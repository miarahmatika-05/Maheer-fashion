import { NextResponse } from 'next/server';

// Get simulated business insights based on data
const getMockInsights = (data: any) => {
  const { total_revenue, total_profit, margin_pct, top_channel, top_channel_pct, top_product, low_stock_count } = data;
  
  const formattedRevenue = Number(total_revenue || 0).toLocaleString('id-ID');
  const formattedProfit = Number(total_profit || 0).toLocaleString('id-ID');

  return [
    {
      title: 'Optimalisasi Stok Produk Terlaris',
      insight: `Produk "${top_product}" merupakan kontributor utama penjualan Anda bulan ini. Namun, saat ini terdapat ${low_stock_count} produk yang mendekati batas stok minimum (stok rendah).`,
      recommendation: `Segera lakukan pengadaan restock massal untuk SKU "${top_product}" dan produk populer lainnya guna menghindari potensi kehilangan penjualan (lost sales) hingga 15% di minggu depan.`
    },
    {
      title: 'Peluang Ekspansi Channel Penjualan',
      insight: `Channel penjualan "${top_channel}" mendominasi transaksi sebesar ${top_channel_pct}%. Sementara channel penjualan lainnya masih berkontribusi sangat minim terhadap omzet total Rp ${formattedRevenue}.`,
      recommendation: `Alokasikan anggaran promosi tambahan sebesar 10% untuk Shopee/TikTok Shop dengan strategi Flash Sale atau gratis ongkir untuk menyeimbangkan distribusi penjualan.`
    },
    {
      title: 'Efisiensi Margin Keuntungan Bersih',
      insight: `Margin profit bersih Anda saat ini berada di kisaran ${margin_pct}%, menghasilkan laba bersih Rp ${formattedProfit} dari total omzet Rp ${formattedRevenue}.`,
      recommendation: `Evaluasi kembali HPP produk-produk dengan margin rendah (< 15%). Pertimbangkan penyesuaian harga jual master secara bertahap atau negosiasi ulang harga beli grosir dengan supplier utama.`
    }
  ];
};

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const data = await request.json();

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openAIKey = process.env.OPENAI_API_KEY;

    let insights = [];
    let provider = 'simulated_llm';
    let success = true;
    let statusCode = 200;

    if (!anthropicKey && !openAIKey) {
      insights = getMockInsights(data);
    } else {
      provider = anthropicKey ? 'anthropic' : 'openai';
      const systemPrompt = `Anda adalah analis bisnis senior untuk toko fashion retail Indonesia. Tugas Anda adalah membaca data penjualan dan memberikan insight bisnis yang actionable.
Aturan:
- Gunakan Bahasa Indonesia yang profesional namun mudah dipahami.
- Berikan tepat 3 poin insight utama dalam format JSON array berisi object dengan field: title, insight, dan recommendation.
- Jangan menyebutkan angka tanpa konteks perbandingan.`;

      const userPrompt = `Data ringkasan toko bulan ini:
- Total revenue: Rp ${data.total_revenue}
- Total profit: Rp ${data.total_profit}
- Margin rata-rata: ${data.margin_pct}%
- Channel terbaik: ${data.top_channel} (${data.top_channel_pct}%)
- Produk terlaris: ${data.top_product}
- Produk stok hampir habis: ${data.low_stock_count} SKU

Bandingkan dengan bulan lalu jika ada. Berikan 3 insight bisnis utama beserta rekomendasi tindakan.`;

      try {
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
              max_tokens: 1000,
              temperature: 0.2,
              system: systemPrompt,
              messages: [{ role: 'user', content: userPrompt }]
            })
          });
          statusCode = response.status;
          const resJson = await response.json();
          const contentText = resJson.content?.[0]?.text || '';
          insights = JSON.parse(contentText.trim().replace(/```json/g, '').replace(/```/g, ''));
        } else {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openAIKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              max_tokens: 1000,
              temperature: 0.2,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ]
            })
          });
          statusCode = response.status;
          const resJson = await response.json();
          const contentText = resJson.choices?.[0]?.message?.content || '';
          const parsed = JSON.parse(contentText.trim());
          insights = parsed.insights || parsed; // Handle array in root or wrapped in object
        }
      } catch (err) {
        success = false;
        console.warn('AI Insights generation failed, falling back to mock insights', err);
        insights = getMockInsights(data);
      }
    }

    const latency = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      insights,
      metrics: {
        provider,
        latency_ms: latency,
        status_code: statusCode,
        success
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
