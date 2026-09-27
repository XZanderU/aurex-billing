import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    // Next.js parsea automáticamente el JSON entrante
    const event = await request.json();

    // 1. Filtrar solo confirmaciones de transacciones
    if (event.event !== 'transaction.updated') {
      return NextResponse.json({ message: 'Evento ignorado' }, { status: 200 });
    }

    const { transaction } = event.data;
    const { signature, timestamp } = event;

    // Guard de seguridad: Verificar que el secreto exista en el entorno (.env)
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
    if (!eventsSecret) {
      console.error("Fallo crítico: WOMPI_EVENTS_SECRET no está configurado.");
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 });
    }

    // 2. Reconstruir la firma criptográfica exigida por Wompi
    let stringToSign = '';
    signature.properties.forEach((prop: string) => {
      const keys = prop.split('.');
      let value = event.data as any;
      keys.forEach((key: string) => { value = value[key]; });
      stringToSign += value;
    });
    
    stringToSign += timestamp;
    stringToSign += eventsSecret; // Usamos la variable validada

    const hash = crypto.createHash('sha256').update(stringToSign).digest('hex');

    // 3. Bloquear intentos de fraude
    if (hash !== signature.checksum) {
      console.error(`ALERTA DE SEGURIDAD: Firma inválida para referencia ${transaction.reference}.`);
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }

    // 4. Impactar la base de datos silenciosamente usando el cliente Admin
    console.log(`[Webhook] Actualizando pago: ${transaction.reference} -> ${transaction.status}`);
    
    const { error } = await supabaseAdmin
      .from('invoices')
      .update({ status: transaction.status }) // Ej: APPROVED, DECLINED
      .eq('reference_code', transaction.reference);

    if (error) {
      console.error("Error al actualizar estado en Supabase:", error);
      throw error;
    }

    // 5. Acuse de recibo obligatorio para Wompi
    return NextResponse.json({ message: 'Webhook procesado exitosamente' }, { status: 200 });

  } catch (error) {
    console.error("Error crítico en webhook:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
