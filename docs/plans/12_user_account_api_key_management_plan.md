# 사용자 계정별 Gemini API 키 Supabase DB 연동 및 관리 기획서

## 1. 개요
기존에는 브라우저 LocalStorage에만 저장되던 Gemini API 키를 **Supabase 클라우드 DB (`public.profiles` 테이블)**와 연동하여, 사용자 계정별로 API 키가 안전하게 보관 및 관리되도록 개선합니다. 다른 컴퓨터나 스마트폰에서 로그인하더라도 등록해둔 API 키가 자동으로 불러와집니다.

## 2. 주요 기능 및 로직 정의 (보안 & Supabase 연동)
1. **Supabase Migration (`006_add_gemini_api_key_to_profiles.sql`)**:
   - `public.profiles` 테이블에 계정별 `gemini_api_key TEXT` 컬럼을 안전하게 추가합니다.
   - RLS (Row Level Security) 정책에 의해 본인 계정만 자신의 API 키를 읽고 업데이트(`UPDATE`)할 수 있도록 보안이 격리됩니다.
2. **로그인 시 계정 API 키 자동 로드 (`app.js`)**:
   - 로그인 성공 시 Supabase `profiles` 테이블에서 해당 사용자의 `gemini_api_key`를 조회합니다.
   - 키가 등록되어 있으면 자동으로 UI의 API 키 입력창에 세팅되고 연결 상태(`연결됨 ✅`)가 즉시 활성화됩니다.
3. **API 키 저장 및 삭제 기능**:
   - 사용자가 API 키를 저장하면 Supabase `profiles` 테이블과 LocalStorage에 동시에 즉시 업데이트됩니다.
   - API 키를 삭제하거나 변경 시 계정 DB에 실시간으로 반영됩니다.

## 3. 관련 파일
- `docs/plans/12_user_account_api_key_management_plan.md` (본 기획서)
- `supabase/migrations/006_add_gemini_api_key_to_profiles.sql` (신규 006 SQL 마이그레이션)
- `app.js`: 로그인 시 계정별 API 키 로드, API 키 저장/수정 시 Supabase DB 반영 로직
