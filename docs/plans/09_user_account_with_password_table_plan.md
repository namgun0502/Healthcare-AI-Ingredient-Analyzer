# Supabase 데이터베이스 사용자 계정(이메일, 암호화 비밀번호, 닉네임) 통합 조회 쿼리 및 테이블 기획서

## 1. 개요
사용자(남건)가 Supabase 데이터베이스(SQL 에디터 또는 뷰)에서 가입된 계정의 **[이메일, 암호화된 비밀번호 해시값, 닉네임, 가입일시]**를 한눈에 볼 수 있도록 전용 뷰(`user_accounts_view`) 및 SQL 마이그레이션 쿼리를 작성합니다.

## 2. 주요 기능 및 보안 준수 (규칙 8 & 규칙 7)
1. **보안 규칙 준수 (규칙 8 - 강력한 보안 및 암호화)**:
   - 비밀번호는 개인정보 보호 및 보안을 위해 데이터베이스 내에 평문(Plaintext)이 아닌 **Supabase BCrypt 해시 암호화값(`encrypted_password`)** 형태로 조회 및 관리됩니다.
2. **Supabase SQL 순번 분리 관리 (규칙 7)**:
   - `supabase/migrations/005_user_accounts_with_password_view.sql` 파일로 저장하여 마이그레이션 이력을 관리합니다.
3. **통합 계정 뷰(`user_accounts_view`) 생성**:
   - `auth.users` 테이블과 `public.profiles` 테이블을 조인(JOIN)하여 [이메일, 암호화_비밀번호, 닉네임, 가입일시]를 한 뷰에서 조회할 수 있도록 지원합니다.

## 3. SQL 쿼리 구성 정의
- **컬럼 구성**:
  - `user_id`: UUID
  - `email`: 이메일 계정
  - `encrypted_password`: BCrypt 암호화된 비밀번호 해시
  - `nickname`: 사용자 닉네임
  - `created_at`: 가입 일시
  - `last_sign_in_at`: 마지막 로그인 일시

## 4. 관련 파일
- `docs/plans/09_user_account_with_password_table_plan.md` (본 기획서)
- `supabase/migrations/005_user_accounts_with_password_view.sql` (신규 005 SQL 마이그레이션)
