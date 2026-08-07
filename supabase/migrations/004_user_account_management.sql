-- 004_user_account_management.sql
-- 남건을 위한 가입된 사용자 이메일 계정 및 프로필 관리/조회 SQL 파일입니다.
-- 프로젝트 규칙 7 준수: supabase/migrations/004_user_account_management.sql 저장

-- ─────────────────────────────────────────────────────────────────
-- 1. [조회] 가입된 전체 사용자 계정 정보 통합 조회 (이메일, 닉네임, 가입일자)
--   Supabase Auth 테이블(auth.users)과 프로필 테이블(public.profiles)을 
--   조인하여 한눈에 보기 쉽게 보여줍니다.
-- ─────────────────────────────────────────────────────────────────
SELECT 
    u.id AS 사용자_ID,
    u.email AS 이메일_계정,
    COALESCE(p.nickname, u.raw_user_meta_data->>'nickname', '닉네임 미설정') AS 닉네임,
    u.created_at AS 가입_일시,
    u.last_sign_in_at AS 마지막_로그인_일시
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;


-- ─────────────────────────────────────────────────────────────────
-- 2. [참고용 삭제 명령] 특정 계정을 테스트로 삭제할 때 사용하는 쿼리 예시
--   (실제 실행 시 '삭제할이메일@example.com' 부분을 해당 이메일로 변경 후 사용)
-- ─────────────────────────────────────────────────────────────────
-- DELETE FROM auth.users WHERE email = '삭제할이메일@example.com';
