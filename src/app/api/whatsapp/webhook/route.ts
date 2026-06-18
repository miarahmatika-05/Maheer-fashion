import { NextResponse } from 'next/server';

// helper to format Rupiah
const formatRp = (num: number) => 'Rp ' + Math.round(num).toLocaleString('id-ID');

// Main logic to process bot commands based on static/dynamic local state
function getBotResponse(intent: string, dbData: any): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  switch (intent) {
    case 'HELP':
      return `🤖 *Maheer Fashion POS - Asisten Virtual*
Berikut daftar perintah yang dapat Anda gunakan:
1. *stok* - Cek daftar produk dengan stok rendah/habis.
2. *laporan hari ini* - Laporan ringkas keuangan hari ini.
3. *laporan kemarin* - Laporan ringkas keuangan kemarin.
4. *transaksi terakhir* - Daftar 5 transaksi penjualan terakhir.
5. *help* - Menampilkan menu bantuan ini.`;

    case 'STOCK_CHECK': {
      const lowStockProducts = (dbData.products || []).filter((p: any) => (p.stock || p.current_stock || 0) <= 5);
      if (lowStockProducts.length === 0) {
        return `✅ *Laporan Inventaris:* Semua produk memiliki stok aman di atas 5 unit.`;
      }
      let response = `⚠️ *Peringatan Stok Rendah (${lowStockProducts.length} Produk):*\n`;
      lowStockProducts.forEach((p: any, idx: number) => {
        const stock = p.stock !== undefined ? p.stock : (p.current_stock || 0);
        response += `${idx + 1}. *${p.sku}* - ${p.name} (Sisa: *${stock}* unit)\n`;
      });
      return response;
    }

    case 'REPORT_TODAY': {
      const todayDateStr = now.toISOString().split('T')[0];
      const transactions = dbData.transactions || [];
      const todayTxs = transactions.filter((t: any) => t.date === todayDateStr && t.status !== 'cancelled');
      
      const totalRev = todayTxs.reduce((sum: number, t: any) => sum + (t.total_revenue || 0), 0);
      const totalProfit = todayTxs.reduce((sum: number, t: any) => sum + (t.total_revenue - (t.hpp_cost || t.total_revenue * 0.6)), 0);
      
      return `📊 *Laporan Keuangan Hari Ini*
📅 Tanggal: ${dateStr}
━━━━━━━━━━━━━━━━━━
💰 *Total Pendapatan:* ${formatRp(totalRev)}
📈 *Estimasi Profit:* ${formatRp(totalProfit)}
🛒 *Jumlah Transaksi:* ${todayTxs.length} transaksi

_Laporan dihasilkan secara otomatis pada pukul ${now.toTimeString().split(' ')[0]} WIB._`;
    }

    case 'REPORT_YESTERDAY': {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const yesterdayDateStr = yesterday.toISOString().split('T')[0];
      const transactions = dbData.transactions || [];
      const yesterdayTxs = transactions.filter((t: any) => t.date === yesterdayDateStr && t.status !== 'cancelled');
      
      const totalRev = yesterdayTxs.reduce((sum: number, t: any) => sum + (t.total_revenue || 0), 0);
      const totalProfit = yesterdayTxs.reduce((sum: number, t: any) => sum + (t.total_revenue - (t.hpp_cost || t.total_revenue * 0.6)), 0);
      
      return `📊 *Laporan Keuangan Kemarin*
📅 Tanggal: ${yesterday.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
━━━━━━━━━━━━━━━━━━
💰 *Total Pendapatan:* ${formatRp(totalRev)}
📈 *Estimasi Profit:* ${formatRp(totalProfit)}
🛒 *Jumlah Transaksi:* ${yesterdayTxs.length} transaksi`;
    }

    case 'LAST_TRANSACTIONS': {
      const transactions = dbData.transactions || [];
      const sortedTxs = [...transactions].sort((a: any, b: any) => b.id.localeCompare(a.id)).slice(0, 5);
      
      if (sortedTxs.length === 0) {
        return `📭 Belum ada riwayat transaksi penjualan tercatat di sistem.`;
      }
      
      let response = `🛒 *5 Transaksi Penjualan Terakhir:*\n`;
      sortedTxs.forEach((t: any, idx: number) => {
        response += `${idx + 1}. *${t.id}* - ${formatRp(t.total_revenue)} (${t.channel || 'Offline'}) oleh Kasir: ${t.customer_id || 'Staff'}\n`;
      });
      return response;
    }

    default:
      return `🤖 Halo! Perintah tidak dikenal. Ketik *help* atau *bantuan* untuk melihat menu perintah yang tersedia.`;
  }
}

// Simple text search pattern-matching fallback for intent parser
function parseIntentLocal(text: string): string {
  const clean = text.toLowerCase().trim();
  if (clean.includes('help') || clean.includes('bantuan') || clean === 'menu' || clean === 'h') {
    return 'HELP';
  }
  if (clean.includes('stok') || clean.includes('stock') || clean === 's') {
    return 'STOCK_CHECK';
  }
  if (clean.includes('laporan hari') || clean.includes('laporan sekarang') || clean === 'laporan') {
    return 'REPORT_TODAY';
  }
  if (clean.includes('laporan kemarin') || clean.includes('kemarin')) {
    return 'REPORT_YESTERDAY';
  }
  if (clean.includes('transaksi') || clean.includes('terakhir') || clean === 'tx') {
    return 'LAST_TRANSACTIONS';
  }
  return 'UNKNOWN';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Support Twilio, Meta, or simulator payload
    const rawMessage = body.message || body.Body || body.message_text || '';
    const cleanMessage = typeof rawMessage === 'string' ? rawMessage : '';

    // Database states passed from frontend simulator to handle sandbox/offline operations
    const dbData = body.dbData || { products: [], transactions: [] };

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openAIKey = process.env.OPENAI_API_KEY;

    let intent = 'UNKNOWN';

    if (!anthropicKey && !openAIKey) {
      intent = parseIntentLocal(cleanMessage);
    } else {
      try {
        const systemPrompt = `Anda adalah parser intent untuk WhatsApp Bot toko fashion.
Klasifikasikan pesan pengguna ke salah satu intent berikut:
STOCK_CHECK, REPORT_TODAY, REPORT_YESTERDAY, LAST_TRANSACTIONS, HELP, UNKNOWN
Output HANYA nama intent dalam huruf kapital tanpa penjelasan tambahan.`;
        const userPrompt = `Pesan pengguna: "${cleanMessage}"`;

        if (anthropicKey) {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicKey,
              'anthropic-version': '2024-03-07'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 10,
              temperature: 0.1,
              system: systemPrompt,
              messages: [{ role: 'user', content: userPrompt }]
            })
          });
          const resJson = await response.json();
          intent = (resJson.content?.[0]?.text || 'UNKNOWN').trim().toUpperCase();
        } else {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openAIKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              max_tokens: 10,
              temperature: 0.1,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ]
            })
          });
          const resJson = await response.json();
          intent = (resJson.choices?.[0]?.message?.content || 'UNKNOWN').trim().toUpperCase();
        }
      } catch (err) {
        console.warn('AI intent parser failed, falling back to local regex matching', err);
        intent = parseIntentLocal(cleanMessage);
      }
    }

    // If intent returned is not in valid list, do local fallback
    const validIntents = ['HELP', 'STOCK_CHECK', 'REPORT_TODAY', 'REPORT_YESTERDAY', 'LAST_TRANSACTIONS'];
    if (!validIntents.includes(intent)) {
      intent = parseIntentLocal(cleanMessage);
    }

    const responseText = getBotResponse(intent, dbData);

    return NextResponse.json({
      success: true,
      intent,
      response: responseText
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process WhatsApp webhook' },
      { status: 500 }
    );
  }
}
