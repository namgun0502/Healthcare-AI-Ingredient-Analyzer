-- 005_user_accounts_with_password_view.sql
-- 남건을 위한 Supabase 가입 계정 (이메일, 암호화된 비밀번호, 닉네임) 통합 조회 뷰 및 SQL 쿼리 파일입니다.
-- 프로젝트 규칙 7 준수: supabase/migrations/005_user_accounts_with_password_view.sql 파일로 모아서 관리합니다.

-- ─────────────────────────────────────────────────────────────────
-- 1. [SQL VIEW 생성] 가입된 전체 사용자 계정 통합 뷰 (user_accounts_view)
--    Supabase Auth(auth.users)의 이메일 및 암호화 비밀번호(encrypted_password)와 
--    프로필(public.profiles)의 닉네임을 조인하여 한눈에 볼 수 있는 뷰를 생성합니다.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.user_accounts_view AS
SELECT 
    u.id AS user_id,
    u.email AS email,
    u.encrypted_password AS encrypted_password, -- Supabase BCrypt 해시 암호화된 비밀번호
    COALESCE(p.nickname, u.raw_user_meta_data->>'nickname', '닉네임 미설정') AS nickname,
    u.created_at AS created_at,
    u.last_sign_in_at AS last_sign_in_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- 뷰 조회 권한 설정 (인증된 사용자 및 관리자 조회 가능)
GRANT SELECT ON public.user_accounts_view TO authenticated;
GRANT SELECT ON public.user_accounts_view TO service_role;


-- ─────────────────────────────────────────────────────────────────
-- 2. [한눈에 보기 SELECT 쿼리] Supabase SQL Editor에서 실행할 수 있는 조회문
--    가입 이메일, 암호화된 비밀번호, 닉네임, 가입일자를 한 테이블처럼 깔끔하게 보여줍니다.
-- ─────────────────────────────────────────────────────────────────

SELECT 
    u.id AS 사용자_ID,
    u.email AS 이메일_계정,
    u.encrypted_password AS 암호화된_비밀번호, -- 💡 보안을 위해 BCrypt 해시값으로 보호됩니다.
    COALESCE(p.nickname, u.raw_user_meta_data->>'nickname', '닉네임 미설정') AS 닉네임,
    u.created_at AS 가입_일시,
    u.last_sign_in_at AS 마지막_로그인_일시
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
