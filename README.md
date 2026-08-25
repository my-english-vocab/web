# My English Vocab Frontend

Next.js(App Router) 기반 영어 단어장 웹 클라이언트입니다.

## Tech Stack
- Node.js 22.23.2
- Next.js 16.3.0 + React 19.2.4 + TypeScript
- CSS Modules + Design Tokens
- JWT Access(메모리) + Refresh(httpOnly 쿠키)
- Vitest + React Testing Library

## 로컬 실행

1. 백엔드가 `http://localhost:8080`에서 떠 있어야 합니다. (`server/` 참고)
2. 프론트 환경변수:

```bash
cp .env.local.example .env.local
```

3. 실행:

```bash
npm install
npm run dev
```

- 앱: http://localhost:3000

배포 환경에서는 빌드 전에 실제 백엔드 HTTPS 주소를 설정해야 합니다.

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

이 값은 브라우저에 공개되는 API 주소이며 비밀값을 넣으면 안 됩니다.

## 운영 배포

- 프론트엔드: Vercel — [https://app.myenglishvocab.com](https://app.myenglishvocab.com)
- 백엔드 API: AWS EC2 — [https://api.myenglishvocab.com](https://api.myenglishvocab.com)
- GitHub Actions: `main` push와 Pull Request에서 lint, test, build 실행
- Vercel: `main`에 반영된 프론트엔드를 자동 배포

Vercel의 `NEXT_PUBLIC_API_BASE_URL`에는 `https://api.myenglishvocab.com`을 설정합니다. 이 변수에는 Token, Cookie, API Key 같은 비밀값을 넣지 않습니다.

## 화면
| 경로 | 설명 |
|------|------|
| `/` | 인증 상태에 따라 `/login` 또는 `/home`으로 이동 |
| `/login`, `/signup` | 인증 |
| `/home` | `{displayName}의 단어장` 홈 |
| `/words` | 단어 목록 · 순번/정렬/즐겨찾기 필터 · 상세에서 즐겨찾기/수정/삭제 · 스크롤 시 플로팅 뒤로가기 |
| `/words/add` | AI 예문 초안 → 확인 후 저장 |
| `/quiz` | 전체 랜덤 또는 등록 순서 기준 20개 단위 세트 퀴즈 · 완료 횟수 · mark-learned |
| `/admin` | `ADMIN` 전용 운영 통계 대시보드 |

## 인증 메모
- Access Token은 메모리에만 보관합니다.
- Refresh Token은 httpOnly 쿠키로 서버가 내려 주며, API 호출 시 `credentials: "include"`로 전송합니다.
- Access 만료(401) 시 `/api/auth/refresh`로 재발급합니다.
- Refresh Token은 JavaScript와 `localStorage`에서 읽지 않습니다.
- 로그인 사용자 정보(아이디·표시 이름·역할)는 화면 상태 복구를 위해 `localStorage`에 저장합니다.
- 앱 시작 시 Refresh Token으로 Access Token을 재발급한 뒤 `/api/auth/me`에서 현재 역할을 다시 확인합니다.
- `/admin`의 화면 가드는 사용자 경험을 위한 장치이며, 실제 권한 경계는 백엔드의 `ADMIN` 검사입니다.

## 운영 통계 연동

- 로그인 사용자가 화면을 이동하면 `POST /api/analytics/page-view`로 경로를 기록합니다.
- 쿼리 문자열, 단어·뜻과 폼 입력값은 전송하지 않습니다.
- 관리자 대시보드는 요약·일별·월별·인기 단어·인기 페이지·사용자·가입/탈퇴 API를 함께 조회합니다.
- 일반 사용자가 `/admin`에 직접 접근하면 `/home`으로 돌아갑니다.

## 테스트와 품질 검사

```bash
# 개발 중 변경을 감지하며 실행
npm test

# CI와 동일하게 한 번만 실행
npm run test:run

# 필요할 때만 coverage 보고서 생성 (목표 수치는 강제하지 않음)
npm run test:coverage

npm run lint
npm run build
```

- Vitest: API Client의 인증 헤더, 쿠키 전송, 204 처리, 오류 변환, 401 재발급·재시도를 검증합니다.
- React Testing Library: `AuthProvider`의 인증·역할 동기화, 페이지 방문 기록, 관리자 접근 제어·통계 화면과 단어 목록의 정렬·즐겨찾기를 검증합니다.
- GitHub Actions는 `main` push와 Pull Request에서 `npm ci → lint → test:run → build`를 실행합니다. npm 및 Next.js 빌드 캐시를 사용합니다.

운영 환경에서 로그인, 새로고침 후 로그인 복구, 단어 CRUD, 즐겨찾기 필터·토글, AI 생성과 퀴즈를 수동 Smoke Test로 확인했습니다. 관리자 대시보드는 로컬 실제 API 연동과 데스크톱·모바일 화면을 확인했으며, 운영에서는 관리자 계정으로 별도 접근 확인이 필요합니다. 이 브라우저 흐름을 자동으로 반복하는 Playwright E2E 테스트는 아직 없습니다.

## 배포 시 인증 확인

Refresh Token은 `SameSite=Lax; HttpOnly` 쿠키를 사용합니다. 백엔드는 `prod` 프로필의 `application-prod.yaml`에서 `auth.cookie.secure=true`를 강제하므로 프론트엔드나 `.env.production`에 `AUTH_COOKIE_SECURE`를 따로 설정하지 않습니다. 현재 프론트와 API는 `app.myenglishvocab.com`, `api.myenglishvocab.com`처럼 같은 최상위 도메인의 HTTPS 주소를 사용합니다.

배포 후에는 로그인 직후만 확인하지 말고, 페이지를 새로고침해도 로그인 상태가 복구되는지 반드시 확인합니다. 이 과정에서 API 주소, HTTPS, CORS와 Refresh Cookie 설정을 함께 검증할 수 있습니다.
