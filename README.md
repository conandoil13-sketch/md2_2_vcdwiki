# 국민대학교 시각디자인학과 위키

시디위키를 정적 프로토타입에서 실제 서비스 구조로 옮기기 위한 저장소입니다. 현재는 `Next.js + Supabase + Vercel` 기반의 4단계 초입까지 들어가 있고, 기존 정적 프로토타입 파일도 함께 보존되어 있습니다.

## 현재 상태

- Next.js 앱 구조 추가
- Supabase 로그인 연결용 유틸 추가
- Google 로그인 + `@kookmin.ac.kr` 도메인 제한을 넣을 자리 추가
- 읽기 공개 / 작성 로그인 필요 구조의 기본 분기 추가
- 기존 정적 프로토타입 파일 보존

## 서비스 뼈대 파일

- `app/`: Next.js App Router 페이지
- `components/`: 로그인 버튼 같은 클라이언트 컴포넌트
- `lib/supabase/`: 브라우저/서버용 Supabase 클라이언트
- `lib/wiki.ts`: 문서를 Supabase에서 읽고 seed로 fallback하는 로직
- `lib/wiki-seed.generated.ts`: `data/wikiData.js`에서 생성한 초기 문서 데이터
- `proxy.ts`: 세션 유지를 위한 Supabase 프록시
- `.env.example`: 필요한 환경변수 예시
- `supabase/schema.sql`: 테이블과 권한 정책
- `supabase/seed.sql`: 초기 문서 데이터 삽입 SQL
- `scripts/export-wiki-seed.mjs`: seed 파일과 SQL을 다시 생성하는 스크립트

## 기존 프로토타입 파일

- `index.html`: 기존 정적 화면 구조
- `styles.css`: 기존 정적 스타일
- `app.js`: 기존 정적 동작 로직
- `data/wikiData.js`: 기존 문서 원본 데이터

## 실행 방법

1. `.env.example`를 보고 `.env.local` 파일을 만듭니다.
2. Supabase URL과 Anon Key를 넣습니다.
3. `npm install`
4. `npm run dev`
5. 브라우저에서 `http://localhost:3000` 접속

## Supabase에서 먼저 실행할 것

1. [supabase/schema.sql](/Users/alltimesuho/Desktop/코딩/VCDWiki/supabase/schema.sql) 실행
2. [supabase/seed.sql](/Users/alltimesuho/Desktop/코딩/VCDWiki/supabase/seed.sql) 실행
3. `profiles` 테이블에서 내 계정의 `role`을 `admin`으로 변경

예시 SQL:

```sql
update public.profiles
set role = 'admin'
where email = 'your-name@kookmin.ac.kr';
```

이 작업을 마치면 홈과 `/wiki/[slug]` 페이지가 `wiki_pages` 테이블을 우선 읽고, 비어 있을 때만 기존 seed 데이터를 대신 사용합니다.

## 필요한 환경변수

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_GOOGLE_HOSTED_DOMAIN`
- `NEXT_PUBLIC_ADMIN_EMAIL`
- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

## 이번 단계에서 구현된 것

- Google OAuth 시작 버튼
- 로그인 콜백 라우트
- 로그인 사용자 표시
- 학교 메일 도메인 확인 로직
- 관리자 1인 초기 지정용 환경변수
- `wiki_pages`, `wiki_page_revisions`, `profiles` 테이블 설계
- 기존 `wikiData.js`를 SQL 시드로 내보내는 스크립트
- 문서 목록과 문서 상세를 DB에서 읽는 첫 버전

## 시드 다시 만들기

`data/wikiData.js`를 고친 뒤 아래 명령을 실행하면 seed TypeScript와 SQL이 다시 생성됩니다.

```bash
npm run seed:export
```

## 다음 단계

- 기존 위키 UI를 Next.js 컴포넌트로 더 많이 이동
- 로그인한 사용자만 편집 가능하게 연결
- 수정 기록, 신고, 관리자 권한 기능 추가
