-- ==============================================================
-- Script: Registrasi User di Supabase Auth
-- Project: Maheer Fashion POS
-- Tanggal: 05 Juni 2026
--
-- Dua opsi:
-- OPSI A → Gunakan Supabase Dashboard (direkomendasikan)
-- OPSI B → SQL via Supabase SQL Editor (jika pakai service_role)
-- ==============================================================

-- ================================================================
-- OPSI A: Melalui Supabase Dashboard (DIREKOMENDASIKAN)
-- ================================================================
-- 1. Buka https://supabase.com/dashboard
-- 2. Pilih project: nyunctgkjkzgromnkenf
-- 3. Pergi ke Authentication > Users
-- 4. Klik "+ Add user" > "Create new user"
-- 5. Isi data berikut:

--   USER 1 - ADMIN:
--   Email    : fashionnaisha21@gmail.com
--   Password : Naisha@12345
--   Role     : Admin
--   (centang "Auto Confirm User")

--   USER 2 - KASIR:
--   Email    : miarahmatika05@gmail.com
--   Password : Mia@12345
--   Role     : Kasir
--   (centang "Auto Confirm User")


-- ================================================================
-- OPSI B: SQL via Supabase SQL Editor (Butuh service_role key)
-- ================================================================
-- CATATAN: Script ini hanya bisa dijalankan menggunakan
-- service_role key (BUKAN anon key). Jalankan di SQL Editor
-- di Supabase Dashboard.

-- Tambah user Admin (fashionnaisha21)
-- SELECT auth.create_user(
--   '{"email": "fashionnaisha21@gmail.com", "password": "Naisha@12345", "email_confirm": true, "user_metadata": {"full_name": "Naisha", "role": "admin"}}'::jsonb
-- );

-- Tambah user Kasir (miarahmatika05)
-- SELECT auth.create_user(
--   '{"email": "miarahmatika05@gmail.com", "password": "Mia@12345", "email_confirm": true, "user_metadata": {"full_name": "Mia Rahmatika", "role": "kasir"}}'::jsonb
-- );


-- ================================================================
-- STEP SETELAH USER DIBUAT: Catat ke tabel users (jika ada)
-- ================================================================
-- Jalankan setelah user berhasil dibuat di Supabase Auth:

INSERT INTO public.users (id, email, full_name, role, is_active, created_at)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' AS full_name,
  raw_user_meta_data->>'role' AS role,
  true AS is_active,
  created_at
FROM auth.users
WHERE email IN ('fashionnaisha21@gmail.com', 'miarahmatika05@gmail.com')
ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- ================================================================
-- Verifikasi
-- ================================================================
-- Cek user sudah terdaftar:
-- SELECT id, email, created_at, email_confirmed_at 
-- FROM auth.users 
-- WHERE email IN ('fashionnaisha21@gmail.com', 'miarahmatika05@gmail.com');
