import BotonWompi from "@/components/BotonWompi";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notFound } from "next/navigation";

// 1. Actualizamos la interfaz: params ahora es una Promesa
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  // 2. LA SOLUCIÓN: Desenvolvemos la promesa con 'await' antes de usar el ID
  const { id } = await params;

  // 3. Ahora sí, con un ID real y válido, buscamos en Supabase
  const { data: factura, error } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('reference_code', id)
    .single();

  // Si no existe la orden, bloqueamos el acceso
  if (error || !factura) {
    console.error("Error al buscar la orden:", error);
    return notFound(); 
  }

  // ... (De aquí en adelante, deja el resto del código es exactamente igual: 
  // la generación de la firma y el return del HTML).

  // 2. Generamos la firma de seguridad (Hash SHA-256)
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || "";
  
  // Usamos amount_in_cents (snake_case) tal como viene de tu base de datos
  const stringToSign = `${factura.reference_code}${factura.amount_in_cents}${factura.currency}${integritySecret}`;
  const integritySignature = crypto.createHash("sha256").update(stringToSign).digest("hex");

  // Preparamos los datos en camelCase para el componente cliente de Wompi
  const datosWompi = {
    reference: factura.reference_code,
    amountInCents: factura.amount_in_cents, 
    currency: factura.currency
  };

  return (
    <div className="min-h-screen bg-blue-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center border-t-4 border-blue-500">
        <h1 className="text-2xl font-bold text-blue-950 mb-1">Aurex Assembly</h1>
        <p className="text-gray-500 mb-6 text-sm">Portal de Pagos</p>
        
        <div className="bg-blue-50 py-4 rounded-lg mb-6 border border-blue-100 overflow-hidden">
          <p className="text-xs text-gray-400 font-mono mb-1 truncate px-2" title={factura.reference_code}>
            Ref: {factura.reference_code}
          </p>
          <p className="text-4xl font-black text-blue-700">
            ${(factura.amount_in_cents / 100).toLocaleString('es-CO')}
          </p>
        </div>
        
        <BotonWompi 
          factura={datosWompi} 
          firmaIntegridad={integritySignature} 
          llavePublica={process.env.NEXT_PUBLIC_WOMPI_PUB_KEY as string} 
        />
      </div>
    </div>
  );
}