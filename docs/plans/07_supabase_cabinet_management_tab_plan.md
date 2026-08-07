# Supabase 연동 약물 보관함 전용 관리 탭 & 데이터베이스 기획서

## 1. 개요
사용자(남건)가 약물 보관함을 데이터베이스(Supabase) 기반으로 체계적으로 추가, 조회, 삭제 관리할 수 있도록 **[약물 보관함 관리 탭/모달]**을 신설합니다.
메인 대화 화면에서의 "전체 비우기"는 이번 챗봇 대조 세션에서의 체크박스 해제(대조 중단) 역할을 맡으며, 실제 보관함 DB 데이터는 **Supabase 클라우드 데이터베이스**에 안전하게 보관 및 관리됩니다.

## 2. 주요 기능 정의
1. **규칙 7 준수 (Supabase SQL 분리 관리)**:
   - `supabase/migrations/001_create_medicines_table.sql` 파일에 테이블 생성 DDL 작성.
2. **보관함 관리 전용 탭/모달 UI**:
   - Supabase URL 및 Anon Key 설정 (최초 1회 설정 후 LocalStorage 자동 저장)
   - 약물/영양제 직접 추가 폼 (약품명, 구분, 주요 성분)
   - DB에 저장된 약물 전체 리스트 및 실제 DB 삭제 기능 제공
3. **메인 화면 대조 세션과 DB 분리**:
   - 메인 화면 "전체 비우기": 대조할 약물 체크박스를 모두 해제 (DB 데이터는 삭제되지 않음)
   - 관리 탭 "약물 삭제": Supabase DB에서 해당 약물을 영구 삭제

## 3. 데이터베이스 테이블 구조 (`medicines`)
- `id`: bigint / uuid (PK)
- `name`: text (약물명)
- `type`: text (의약품 / 건강기능식품)
- `ingredients`: text (주요 성분)
- `created_at`: timestamp with time zone (생성일시)
