# My English Vocab Frontend

Next.js(App Router) 기반 영어 단어장 웹 클라이언트입니다.

## Tech Stack
- Next.js + TypeScript
- CSS Modules + Design Tokens (토스풍)
- JWT Access(메모리) + Refresh(httpOnly 쿠키)

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

## 화면
| 경로 | 설명 |
|------|------|
| `/login`, `/signup` | 인증 |
| `/home` | `{displayName}의 단어장` 홈 |
| `/words` | 단어 목록 · 상세/수정/삭제 |
| `/words/add` | AI 예문 초안 → 확인 후 저장 |
| `/quiz` | 뜻 가리기 퀴즈 · mark-learned |

## 인증 메모
- Access Token은 메모리에만 보관합니다.
- Refresh Token은 httpOnly 쿠키로 서버가 내려 주며, API 호출 시 `credentials: "include"`로 전송합니다.
- Access 만료(401) 시 `/api/auth/refresh`로 재발급합니다.
- Refresh Token은 JavaScript와 `localStorage`에서 읽지 않습니다.

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
- React Testing Library: `AuthProvider`의 앱 시작 인증 복구, 로그인, 회원가입 후 자동 로그인, 로그아웃을 사용자가 관찰하는 Context 상태 기준으로 검증합니다.
- GitHub Actions는 `main` push와 Pull Request에서 `npm ci → lint → test:run → build`를 실행합니다. npm 및 Next.js 빌드 캐시를 사용합니다.

아직 실제 브라우저 E2E, 단어 CRUD/퀴즈 화면의 사용자 흐름, 실제 백엔드와 쿠키 속성의 통합 동작은 테스트하지 않습니다. 이 범위는 배포 환경이 정해진 뒤 API mock 기반 Playwright E2E와 백엔드 통합 테스트로 보강할 수 있습니다.
