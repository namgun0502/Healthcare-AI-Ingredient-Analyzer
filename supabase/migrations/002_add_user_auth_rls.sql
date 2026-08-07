-- 002_add_user_auth_rls.sql
-- 각 사용자별로 자신의 약물 데이터만 볼 수 있도록 RLS(보안 정책)를 설정합니다.
-- Supabase Auth와 연동하여 로그인한 사용자 ID 기준으로 데이터를 분리합니다.
-- 프로젝트 규칙 7 준수: 002_ 순서 번호를 부여하여 작성

-- ─────────────────────────────────────────────────────────────────
-- STEP 1. medicines 테이블에 user_id 컬럼 추가
--   auth.users 테이블의 id를 참조하는 외래키입니다.
--   각 약물이 "어느 사용자의 것인지" 표시하는 역할입니다.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.medicines
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ─────────────────────────────────────────────────────────────────
-- STEP 2. 기존 공개 정책 모두 삭제 (이전에 누구나 접근 가능하던 정책 제거)
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow public read access"   ON public.medicines;
DROP POLICY IF EXISTS "Allow public insert access" ON public.medicines;
DROP POLICY IF EXISTS "Allow public update access" ON public.medicines;
DROP POLICY IF EXISTS "Allow public delete access" ON public.medicines;

-- ─────────────────────────────────────────────────────────────────
-- STEP 3. 새 RLS 정책 설정 — "본인 데이터만 접근 가능"
--   auth.uid() 는 현재 로그인된 사용자의 ID를 반환합니다.
--   즉, 내 user_id가 붙은 행만 SELECT/INSERT/DELETE 가능합니다.
-- ─────────────────────────────────────────────────────────────────

-- 조회: 자신의 약물만 조회 가능
CREATE POLICY "Users can read own medicines"
ON public.medicines FOR SELECT
USING ( auth.uid() = user_id );

-- 추가: 로그인된 사용자만 자신의 user_id로 삽입 가능
CREATE POLICY "Users can insert own medicines"
ON public.medicines FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- 수정: 자신의 약물만 수정 가능
CREATE POLICY "Users can update own medicines"
ON public.medicines FOR UPDATE
USING ( auth.uid() = user_id );

-- 삭제: 자신의 약물만 삭제 가능
CREATE POLICY "Users can delete own medicines"
ON public.medicines FOR DELETE
USING ( auth.uid() = user_id );

-- ─────────────────────────────────────────────────────────────────
-- STEP 4. 기존 샘플 데이터 정리 (user_id 없는 이전 데이터 삭제)
--   user_id가 NULL인 기존 테스트 데이터를 제거합니다.
-- ─────────────────────────────────────────────────────────────────
DELETE FROM public.medicines WHERE user_id IS NULL;
