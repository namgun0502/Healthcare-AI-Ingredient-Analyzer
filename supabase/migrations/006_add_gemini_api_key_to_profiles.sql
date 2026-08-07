-- 006_add_gemini_api_key_to_profiles.sql
-- 사용자 계정별로 Gemini API 키를 안전하게 보관 및 관리하기 위한 Supabase DDL 마이그레이션입니다.
-- 프로젝트 규칙 7 준수: supabase/migrations/006_add_gemini_api_key_to_profiles.sql 파일로 모아서 관리합니다.

-- 1. public.profiles 테이블에 gemini_api_key 컬럼 추가 (이미 존재하는 경우 무시)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- 2. RLS (Row Level Security) 확인 및 보안 개별격리 정책 유지
-- 본인의 프로필(profiles) 레코드만 조회/수정할 수 있으므로, 타 사용자의 API 키에 접근할 수 없습니다.
COMMENT ON COLUMN public.profiles.gemini_api_key IS '사용자 계정별 개인 Gemini AI API 키 (본인만 RLS를 통해 접근 가능)';
