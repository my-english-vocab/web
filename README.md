# My English Vocab Frontend

Next.js(App Router) 기반 영어 단어장 웹 클라이언트입니다.

## Tech Stack
- Next.js + TypeScript
- CSS Modules + Design Tokens (토스풍)
- JWT Access(메모리) + Refresh(localStorage)

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
