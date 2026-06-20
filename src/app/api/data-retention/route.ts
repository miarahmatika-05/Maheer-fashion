import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const THREE_YEARS_AGO = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 3);
  return d.toISOString();
};

/**
 * INF-05: Data Retention & Privacy API Route
 * 
 * GET  → Dry-run: preview transaksi yang akan dianonimisasi (> 3 tahun)
 * POST → Eksekusi anonimisasi: ubah customer_id menjadi "ANONYMIZED"
 * 
 * Referensi: COMP 6.1, COMP 6.2 — UU Perlindungan Data Pribadi (UU PDP)
 */

export async function GET(request: NextRequest) {
  const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key'
  );
  const cutoffDate = THREE_YEARS_AGO();

  try {
    // Try to query from Supabase first
    const { data: supabaseData, error } = await supabase
      .from('transaksi')
      .select('id, date, customer_id, total_revenue, channel, status')
      .lt('date', cutoffDate.split('T')[0])
      .neq('customer_id', 'ANONYMIZED')
      .not('customer_id', 'is', null);

    if (error) {
      // Supabase unavailable — simulate with empty result
      return NextResponse.json({
        mode: 'dry_run',
        timestamp: new Date().toISOString(),
        cutoff_date: cutoffDate,
        policy: 'Transaksi dengan data pelanggan yang berusia > 3 tahun akan dianonimisasi sesuai UU PDP Pasal 6.',
        affected_count: 0,
        affected_transactions: [],
        note: 'Supabase tidak tersedia atau tabel transaksi belum ada. Jalankan migrasi database terlebih dahulu.',
        pg_cron_status: 'Jadwal otomatis: setiap hari pukul 02:00 WIB via pg_cron',
        compliance_ref: 'COMP 6.1, COMP 6.2 — UU PDP Indonesia',
      });
    }

    const affected = supabaseData || [];

    return NextResponse.json({
      mode: 'dry_run',
      timestamp: new Date().toISOString(),
      cutoff_date: cutoffDate,
      policy: 'Transaksi dengan data pelanggan yang berusia > 3 tahun akan dianonimisasi sesuai UU PDP Pasal 6.',
      affected_count: affected.length,
      affected_transactions: affected.slice(0, 20).map((t: any) => ({
        id: t.id,
        date: t.date,
        customer_id_preview: t.customer_id ? `${String(t.customer_id).substring(0, 3)}***` : null,
        channel: t.channel,
        total_revenue: t.total_revenue,
        action_will_be: 'SET customer_id = "ANONYMIZED"',
      })),
      note: affected.length > 20 ? `Menampilkan 20 dari ${affected.length} transaksi yang terpengaruh.` : null,
      pg_cron_status: 'Jadwal otomatis: setiap hari pukul 02:00 WIB via pg_cron',
      compliance_ref: 'COMP 6.1, COMP 6.2 — UU PDP Indonesia',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Gagal menjalankan dry-run: ' + err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key'
  );
  const cutoffDate = THREE_YEARS_AGO();
  const executedAt = new Date().toISOString();

  try {
    // Step 1: Count affected records before anonymization
    const { data: previewData, error: previewError } = await supabase
      .from('transaksi')
      .select('id', { count: 'exact' })
      .lt('date', cutoffDate.split('T')[0])
      .neq('customer_id', 'ANONYMIZED')
      .not('customer_id', 'is', null);

    if (previewError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tabel transaksi tidak ditemukan atau akses ditolak. Jalankan migrasi database terlebih dahulu.',
          error: previewError.message,
          note: 'Untuk environment lokal, anonimisasi dijalankan secara manual melalui Supabase Dashboard SQL Editor.',
        },
        { status: 200 }
      );
    }

    const affectedCount = previewData?.length || 0;

    if (affectedCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada data pelanggan yang perlu dianonimisasi saat ini.',
        anonymized_count: 0,
        executed_at: executedAt,
        cutoff_date: cutoffDate,
        compliance_ref: 'COMP 6.1, COMP 6.2 — UU PDP Indonesia',
      });
    }

    // Step 2: Execute anonymization
    const { error: updateError } = await supabase
      .from('transaksi')
      .update({ customer_id: 'ANONYMIZED' })
      .lt('date', cutoffDate.split('T')[0])
      .neq('customer_id', 'ANONYMIZED')
      .not('customer_id', 'is', null);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Step 3: Write to audit_logs
    const auditEntry = {
      id: `LOG-ANON-${Date.now()}`,
      timestamp: executedAt,
      action: 'DATA_ANONYMIZATION',
      actor: 'SYSTEM_RETENTION_JOB',
      details: `Anonimisasi ${affectedCount} record transaksi dengan customer_id berusia > 3 tahun. Cutoff: ${cutoffDate.split('T')[0]}. Sesuai UU PDP COMP 6.2.`,
    };

    await supabase.from('audit_logs').insert([auditEntry]);

    return NextResponse.json({
      success: true,
      message: `Berhasil mengaonimisasi ${affectedCount} record transaksi.`,
      anonymized_count: affectedCount,
      executed_at: executedAt,
      cutoff_date: cutoffDate,
      audit_log_id: auditEntry.id,
      compliance_ref: 'COMP 6.1, COMP 6.2 — UU PDP Indonesia',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Gagal menjalankan anonimisasi: ' + err.message },
      { status: 500 }
    );
  }
}
