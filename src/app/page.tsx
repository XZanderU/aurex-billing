import BotonWompi from "@/components/BotonWompi";
import crypto from "crypto";

export default function CheckoutPage() {
  // En producción, este ID llegaría por la URL y consultaríamos Supabase. 
  // Por ahora, simulamos una factura dinámica.
  const facturaDemo = {
    reference: `AUREX-TEST-${Date.now()}`,
    amountInCents: 15000000, // $150,000 COP
    currency: "COP",
  };

  // Generamos la firma de seguridad (esto jamás llega al navegador del usuario)
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || "";
  const stringToSign = `${facturaDemo.reference}${facturaDemo.amountInCents}${facturaDemo.currency}${integritySecret}`;
  const integritySignature = crypto.createHash("sha256").update(stringToSign).digest("hex");

  return (
    <div className="min-h-screen bg-blue-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center border-t-4 border-blue-500">
        <h1 className="text-2xl font-bold text-blue-950 mb-1">Aurex Billing</h1>
        <p className="text-gray-500 mb-6 text-sm">Pago de Administración</p>
        
        <div className="bg-blue-50 py-4 rounded-lg mb-6 border border-blue-100">
          <p className="text-xs text-gray-400 font-mono mb-1">Ref: {facturaDemo.reference}</p>
          <p className="text-4xl font-black text-blue-700">
            ${(facturaDemo.amountInCents / 100).toLocaleString('es-CO')}
          </p>
        </div>
        
        <BotonWompi 
          factura={facturaDemo} 
          firmaIntegridad={integritySignature} 
          llavePublica={process.env.NEXT_PUBLIC_WOMPI_PUB_KEY as string} 
        />
      </div>
    </div>
  );
}