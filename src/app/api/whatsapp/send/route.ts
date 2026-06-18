import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const { to, body } = await request.json();

    const waAccessToken = process.env.WA_ACCESS_TOKEN;
    const waPhoneId = process.env.WA_PHONE_NUMBER_ID;

    let success = true;
    let statusCode = 200;
    let provider = 'simulated_whatsapp';

    if (waAccessToken && waPhoneId) {
      provider = 'whatsapp_cloud_api';
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${waAccessToken}`
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to || '628123456789',
            type: 'text',
            text: { body }
          })
        });
        statusCode = response.status;
        if (!response.ok) {
          throw new Error(`WhatsApp API responded with status ${response.status}`);
        }
      } catch (err) {
        success = false;
        console.warn('Meta WhatsApp API failed, falling back to simulated dispatch', err);
      }
    }

    const latency = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      sent: {
        to: to || 'Admin (Simulated)',
        body,
        timestamp: new Date().toISOString()
      },
      metrics: {
        provider,
        latency_ms: latency,
        status_code: statusCode,
        success
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch outbound message' },
      { status: 500 }
    );
  }
}
