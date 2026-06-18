-- ==============================================================
-- Migration: INF-05 — Data Retention & Privacy Automation
-- Ref: COMP 6.1, COMP 6.2 — UU Perlindungan Data Pribadi (UU PDP)
--
-- Tujuan:
--   Membuat scheduled job via pg_cron yang berjalan setiap hari
--   pukul 02:00 WIB (19:00 UTC) untuk mengaonimisasi data
--   pelanggan pada transaksi yang berusia > 3 tahun.
--
-- Prasyarat:
--   - Extension pg_cron harus diaktifkan di Supabase Dashboard:
--     Database > Extensions > pg_cron → Enable
--   - Role yang menjalankan migrasi harus memiliki akses ke cron schema.
-- ==============================================================

-- ================================================================
-- STEP 1: Aktifkan extension pg_cron (jika belum aktif)
-- ================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ================================================================
-- STEP 2: Buat fungsi anonimisasi data pelanggan
-- ================================================================
CREATE OR REPLACE FUNCTION anonymize_old_customer_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows INTEGER;
  cutoff_date DATE;
  log_id TEXT;
BEGIN
  -- Tanggal cutoff: 3 tahun yang lalu
  cutoff_date := CURRENT_DATE - INTERVAL '3 years';

  -- Anonimisasi customer_id pada transaksi yang lebih tua dari 3 tahun
  UPDATE transaksi
  SET customer_id = 'ANONYMIZED'
  WHERE date < cutoff_date
    AND customer_id IS NOT NULL
    AND customer_id != 'ANONYMIZED';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  -- Catat aktivitas ke audit_logs (jika ada record yang diproses)
  IF affected_rows > 0 THEN
    log_id := 'LOG-ANON-' || EXTRACT(EPOCH FROM NOW())::BIGINT;

    INSERT INTO audit_logs (id, timestamp, action, actor, details)
    VALUES (
      log_id,
      NOW(),
      'DATA_ANONYMIZATION',
      'SYSTEM_PG_CRON',
      'Anonimisasi ' || affected_rows || ' record transaksi dengan customer_id berusia > 3 tahun. ' ||
      'Cutoff: ' || cutoff_date::TEXT || '. ' ||
      'Sesuai UU PDP Indonesia — COMP 6.1, COMP 6.2.'
    );
  END IF;

  RETURN affected_rows;
END;
$$;

-- Berikan komentar pada fungsi untuk dokumentasi
COMMENT ON FUNCTION anonymize_old_customer_data()
IS 'INF-05: Mengaonimisasi customer_id pada transaksi yang berusia > 3 tahun sesuai UU PDP Indonesia (COMP 6.1, COMP 6.2). Dipanggil oleh pg_cron setiap hari pukul 02:00 WIB.';

-- ================================================================
-- STEP 3: Jadwalkan job pg_cron
-- Setiap hari pukul 02:00 WIB = 19:00 UTC (WIB = UTC+7)
-- ================================================================

-- Hapus job lama jika sudah ada (idempotent)
SELECT cron.unschedule('maheer-data-retention-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'maheer-data-retention-daily'
);

-- Buat jadwal baru
SELECT cron.schedule(
  'maheer-data-retention-daily',       -- Nama job
  '0 19 * * *',                        -- Cron expression: setiap hari pukul 19:00 UTC (02:00 WIB)
  'SELECT anonymize_old_customer_data();'
);

-- ================================================================
-- STEP 4: Verifikasi job terdaftar
-- Jalankan query ini secara manual untuk memverifikasi:
-- SELECT * FROM cron.job WHERE jobname = 'maheer-data-retention-daily';
-- ================================================================

-- ================================================================
-- STEP 5: Tambahkan PostgreSQL Rule untuk immutability audit_logs
-- (Jika belum dibuat di migrasi sebelumnya — COMP 2.2)
-- ================================================================
DO $$
BEGIN
  -- Prevent UPDATE on audit_logs
  IF NOT EXISTS (
    SELECT 1 FROM pg_rules
    WHERE tablename = 'audit_logs' AND rulename = 'no_update_audit_logs'
  ) THEN
    EXECUTE 'CREATE RULE no_update_audit_logs AS ON UPDATE TO audit_logs DO INSTEAD NOTHING';
  END IF;

  -- Prevent DELETE on audit_logs
  IF NOT EXISTS (
    SELECT 1 FROM pg_rules
    WHERE tablename = 'audit_logs' AND rulename = 'no_delete_audit_logs'
  ) THEN
    EXECUTE 'CREATE RULE no_delete_audit_logs AS ON DELETE TO audit_logs DO INSTEAD NOTHING';
  END IF;
END
$$;

-- ================================================================
-- STEP 6: Test manual (opsional — jalankan hanya di staging)
-- ================================================================
-- Untuk uji coba manual, jalankan:
-- SELECT anonymize_old_customer_data();
-- Kemudian verifikasi:
-- SELECT COUNT(*) FROM transaksi WHERE customer_id = 'ANONYMIZED';
-- SELECT COUNT(*) FROM transaksi WHERE customer_id != 'ANONYMIZED' AND date < CURRENT_DATE - INTERVAL '3 years';
