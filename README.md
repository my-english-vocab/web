# My English Vocab Frontend

Next.js App Router 기반 영어 단어장 웹 클라이언트입니다. 단어와 예문을 직접 저장하거나 AI 초안을 활용하고, 등록 순서 기반 세트 퀴즈와 브라우저 음성 합성으로 복습할 수 있습니다.

## 주요 기능

- 회원가입·로그인·로그아웃과 새로고침 후 로그인 복구
- 첫 사용자용 학습 목적별 추천 단어 온보딩
- 단어 추가·수정·삭제, 최신순/A-Z/레벨 정렬과 즐겨찾기 필터
- AI 뜻·예문·해석 초안 생성과 일일 잔여 횟수 표시
- 전체 랜덤 및 등록 순서 기반 세트 퀴즈, 완료 횟수와 학습 레벨 기록
- 퀴즈에서 놓친 단어의 현재 세션 내 다시 보기
- Web Speech API 기반 영어 단어·예문 발음 재생
- 표시 이름 수정, 온보딩 다시 시작, 로그아웃과 회원 탈퇴를 제공하는 마이페이지 패널
- 관리자 전용 서비스 통계 대시보드

## 기술 스택

- Node.js 22.23.2 (`.nvmrc`)
- Next.js 16.3.0, React 19.2.4, TypeScript
- CSS Modules, Design Tokens
- Web Speech API
- Vitest, React Testing Library, jsdom
- GitHub Actions, Vercel

## 관련 저장소

- 프론트엔드: [my-english-vocab/web](https://github.com/my-english-vocab/web)
- 백엔드 API: [my-english-vocab/api](https://github.com/my-english-vocab/api)

프론트엔드와 백엔드는 별도 저장소입니다. 백엔드 실행·환경변수·데이터베이스 설정은 백엔드 저장소의 문서를 기준으로 합니다.

## 로컬 실행

먼저 백엔드가 `http://localhost:8080`에서 실행 중이어야 합니다.

```bash
nvm use
cp .env.local.example .env.local
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다. 이미 의존성과 `.env.local`을 준비했다면 `npm run dev`만 실행하면 됩니다.

### 환경변수

| 변수 | 용도 | 기본 예시 |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | 브라우저가 요청할 백엔드 API 주소 | `http://localhost:8080` |
| `NEXT_ALLOWED_DEV_ORIGINS` | Next.js 개발 리소스를 요청할 추가 호스트. 쉼표로 여러 개 지정 | 비움 |

`NEXT_PUBLIC_` 변수는 브라우저에 공개되므로 Token, Cookie, API Key 같은 비밀값을 넣으면 안 됩니다. `NEXT_ALLOWED_DEV_ORIGINS`에는 프로토콜과 포트를 제외한 호스트만 입력합니다.

### 같은 Wi-Fi의 모바일 기기에서 확인

컴퓨터의 LAN IP가 `192.168.0.10`이라면 프론트엔드 `.env.local`을 다음과 같이 설정합니다.

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://192.168.0.10:8080
NEXT_ALLOWED_DEV_ORIGINS=192.168.0.10
```

백엔드 저장소의 `.env`에도 모바일에서 접속하는 프론트엔드 origin을 추가합니다.

```dotenv
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://192.168.0.10:3000
```

설정 변경 후 Next.js 개발 서버를 다시 시작하고 Docker로 실행 중인 백엔드 `app` 컨테이너를 재생성합니다. 모바일에서는 `http://192.168.0.10:3000`으로 접속합니다. LAN IP는 네트워크 환경에 따라 달라지므로 현재 컴퓨터의 주소로 바꿔야 합니다.

## 화면과 사용자 흐름

| 경로 | 설명 |
|---|---|
| `/` | 인증 상태에 따라 `/login` 또는 `/home`으로 이동 |
| `/login` | 로그인 |
| `/signup` | 회원가입 후 자동 로그인 |
| `/onboarding` | 학습 목적 선택, 추천 단어 10개 확인·선택·저장 |
| `/home` | 저장 단어 수, 단어장·퀴즈 진입, 마이페이지 패널 |
| `/words` | 목록·정렬·즐겨찾기, 상세 조회, 단어·예문 발음, 수정·삭제 |
| `/words/add` | 직접 입력 또는 AI 초안 확인 후 단어 저장 |
| `/quiz` | 전체 랜덤 또는 세트별 퀴즈 선택과 세트 완료 횟수 |
| `/quiz/session/[selection]` | 뜻 가리기 퀴즈, 단어·예문 발음, 학습 처리와 결과 확인 |
| `/admin` | `ADMIN` 전용 운영 통계 대시보드 |

### 첫 단어장 온보딩

단어가 없는 계정은 보호된 화면에 진입할 때 `/onboarding`으로 이동합니다. 7개 학습 목적 중 하나를 고르고 초급 2개·중급 3개·고급 5개 단어를 확인한 뒤 필요한 단어만 저장할 수 있습니다.

진행 상태는 계정별 `sessionStorage`에 임시 저장하며, 답변과 실력 등급은 서버에 저장하지 않습니다. 홈의 `추천 단어로 시작하기`와 마이페이지의 `추천 단어 다시 만나기`에서 다시 시작할 수 있습니다. 자세한 흐름과 예외 처리는 [온보딩 문서](docs/onboarding.md)를 참고합니다.

### 단어장과 AI 초안

- 단어 목록은 최신순, A-Z, 레벨순으로 정렬할 수 있습니다.
- 즐겨찾기만 모아 보거나 상세 화면에서 즐겨찾기 상태를 변경할 수 있습니다.
- 단어, 뜻, 예문, 예문 해석을 직접 작성하거나 AI 초안을 받은 뒤 수정해 저장할 수 있습니다.
- AI 초안 화면은 서버가 제공하는 당일 잔여 사용 횟수를 표시합니다.
- 학습 레벨은 퀴즈에서 `외웠어요`를 선택할 때 올라갑니다.

### 퀴즈

- 전체 랜덤 모드는 저장된 모든 단어를 무작위로 출제합니다.
- 세트는 단어 생성 시각이 오래된 순서로 기본 20개씩 구성하고, 마지막 나머지가 10개 이하이면 직전 세트에 합칩니다.
- 세트 안의 출제 순서는 매번 무작위이며, 세트별 완료 횟수를 표시합니다.
- `외웠어요`는 단어 레벨을 올리고, `모르겠어요`는 현재 결과에서 다시 볼 목록에 추가합니다.
- `모르겠어요` 목록은 현재 퀴즈 결과에서만 제공하며 별도로 저장하지 않습니다.

### 발음 듣기

- 단어 상세와 퀴즈에서 스피커 버튼을 누르면 영어 단어 또는 예문을 재생합니다.
- 별도 음원 파일이나 외부 TTS API 대신 브라우저의 Web Speech API를 사용합니다.
- 미국 영어 음성을 우선하고 알려진 macOS 특수 효과 음성은 선택 대상에서 제외합니다.
- 예문이 없는 단어에는 예문 발음 버튼을 표시하지 않습니다.
- 재생 음질과 실제 목소리는 브라우저와 운영체제에 설치된 음성에 따라 달라질 수 있습니다.
- 음성 합성을 지원하지 않는 브라우저에서는 안내 메시지를 표시합니다.

## 인증과 권한

- Access Token은 메모리에만 보관합니다.
- Refresh Token은 백엔드가 HttpOnly Cookie로 발급하며 모든 API 요청은 `credentials: "include"`를 사용합니다.
- Access Token 만료로 보호 API가 `401`을 반환하면 Refresh Token으로 한 번 재발급한 뒤 원래 요청을 재시도합니다.
- 여러 요청이 동시에 `401`을 받아도 하나의 재발급 요청을 공유합니다.
- 사용자 식별자·아이디·표시 이름·역할은 화면 상태 복구를 위해 `localStorage`에 저장하지만 Access Token과 Refresh Token은 저장하지 않습니다.
- 앱 시작 시 Refresh Token으로 Access Token을 복구하고 `/api/auth/me`에서 현재 계정과 역할을 다시 확인합니다.
- 화면의 `AuthGuard`와 `AdminGuard`는 사용자 경험을 위한 장치이며 실제 데이터 접근 권한은 백엔드가 검사해야 합니다.
- 마이페이지에서 표시 이름 수정, 로그아웃, 비밀번호 확인 후 회원 탈퇴를 수행할 수 있습니다.

## 페이지 방문 기록과 관리자 화면

- 인증된 사용자가 경로를 이동하면 `POST /api/analytics/page-views`로 pathname만 기록합니다.
- 쿼리 문자열, 단어·뜻, 폼 입력값은 페이지 방문 기록에 포함하지 않습니다.
- 통계 기록 실패는 사용자의 화면 이용을 막지 않습니다.
- 관리자 화면은 서비스 요약, 일별·월별 통계, 인기 단어·페이지, 사용자, 가입·탈퇴 이력을 조회합니다.
- 일반 사용자가 `/admin`에 접근하면 통계 API를 요청하지 않고 `/home`으로 이동합니다.

## 테스트와 품질 검사

```bash
# 변경을 감지하며 테스트
npm test

# CI와 동일한 단발 테스트
npm run test:run

# 선택적 커버리지 보고서
npm run test:coverage

npm run lint
npm run build
```

현재 자동 테스트는 다음 영역을 다룹니다.

- API Client의 인증 헤더·쿠키, 오류 변환, `204`, Access Token 재발급과 동시 `401` 처리
- 로그인 복구·로그인·회원가입·로그아웃·표시 이름 변경·회원 탈퇴
- 첫 단어장 자동 진입, 세션 복구, 추천 단어 선택·저장과 중복 제출 방지
- 홈의 빈 단어장 분기와 마이페이지
- 단어 정렬·즐겨찾기
- 퀴즈 세트 구성·선택·완료 기록과 결과 내 오답 목록
- 페이지 방문 기록과 관리자 접근 제어·통계 화면

Web Speech API의 실제 음성 출력, 브라우저 간 음성 차이, 전체 사용자 흐름, 실제 백엔드 연동과 배포 상태는 자동 테스트 범위가 아닙니다. 발음 듣기는 로컬 데스크톱 브라우저와 iPhone Safari에서 수동으로 확인했으며, Playwright E2E 테스트는 아직 없습니다.

GitHub Actions는 `main` push와 `main` 대상 Pull Request에서 `npm ci → lint → test:run → build`를 실행하고 npm 및 Next.js 빌드 캐시를 사용합니다.

## 운영 배포

- 프론트엔드: Vercel — [https://app.myenglishvocab.com](https://app.myenglishvocab.com)
- 백엔드 API: FIREBAT 홈서버 — [https://api.myenglishvocab.com](https://api.myenglishvocab.com)
- Vercel은 `main`에 반영된 프론트엔드를 배포합니다.
- Vercel의 `NEXT_PUBLIC_API_BASE_URL`에는 `https://api.myenglishvocab.com`을 설정합니다.

Refresh Token은 `SameSite=Lax; HttpOnly` Cookie를 사용합니다. 백엔드 운영 프로필은 Secure Cookie를 강제하므로 프론트엔드와 API는 `app.myenglishvocab.com`, `api.myenglishvocab.com`처럼 같은 최상위 도메인의 HTTPS 주소를 사용합니다.

배포 후에는 로그인 성공뿐 아니라 새로고침 후 로그인 복구, CORS, Refresh Cookie, 단어 CRUD, AI 생성, 퀴즈와 관리자 권한을 별도로 확인해야 합니다. 저장소 설정과 문서만으로 현재 운영 배포 상태나 실행 중인 버전을 증명할 수는 없습니다.
