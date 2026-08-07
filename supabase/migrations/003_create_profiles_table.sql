-- 003_create_profiles_table.sql
-- 사용자 닉네임 및 프로필 정보를 관리하는 Supabase 데이터베이스 테이블 생성 SQL 파일입니다.
-- 프로젝트 규칙 7 준수: supabase/migrations/ 폴더 내에 003_ 순서 번호를 부여하여 작성되었습니다.

-- 1. public.profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nickname TEXT NOT NULL DEFAULT '사용자',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. RLS (Row Level Security) 보안 정책 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 읽기: 누구나 프로필 조회 가능 (또는 인증된 사용자만)
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- 추가: 본인 프로필만 생성 가능
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 수정: 본인 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);
