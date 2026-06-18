-- Migration: AI Prompt Registry
-- Menambahkan tabel untuk menyimpan prompt dinamis aplikasi untuk OCR, Insight, dan Chatbot

CREATE TABLE IF NOT EXISTS public.ai_prompt_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.ai_prompt_registry ENABLE ROW LEVEL SECURITY;

-- Policy (Hanya Super Admin yang bisa edit, siapa saja bisa baca internal server side bypass RLS jadi ini basic saja)
CREATE POLICY "Enable read access for all users" ON public.ai_prompt_registry FOR SELECT USING (true);
CREATE POLICY "Enable write access for super admin" ON public.ai_prompt_registry FOR ALL USING (auth.jwt() ->> 'email' ILIKE '%naisha%');

-- Seed initial prompts
INSERT INTO public.ai_prompt_registry (code, description, system_prompt, user_prompt_template) VALUES
(
    'WHATSAPP_INTENT_PARSER',
    'Parser untuk bot whatsapp intent',
    'Anda adalah parser intent untuk WhatsApp Bot toko fashion. Klasifikasikan pesan pengguna ke salah satu intent berikut: STOCK_CHECK, REPORT_TODAY, REPORT_YESTERDAY, LAST_TRANSACTIONS, HELP, UNKNOWN. Output HANYA nama intent dalam huruf kapital tanpa penjelasan tambahan.',
    'Pesan pengguna: "{{message}}"'
),
(
    'OCR_NOTA_PARSER',
    'Parser OCR nota supplier untuk restock inventory',
    'Ekstrak SKU, Nama, dan Kuantitas dari hasil OCR Nota Supplier. Output HARUS dalam format JSON array berisi object { "sku": string, "name": string, "quantity": number } tanpa teks tambahan apapun.',
    'Hasil OCR Text: "{{ocr_text}}"'
),
(
    'AI_BUSINESS_INSIGHT',
    'AI Business Insight Generator untuk dashboard',
    'Berdasarkan data metrik POS, buatlah 3 rekomendasi bisnis singkat, cerdas, dan langsung bisa diterapkan (actionable). Kembalikan response dalam array JSON dengan key "insights" berisi daftar string. Jangan jelaskan formatnya.',
    'Metrik hari ini: Total Penjualan {{revenue}}, Omset Harian {{daily_turnover}}. Berikan saran untuk besok.'
) ON CONFLICT (code) DO UPDATE SET 
    system_prompt = EXCLUDED.system_prompt,
    user_prompt_template = EXCLUDED.user_prompt_template;
