export type ApiErrorBody = {
  code: string;
  message: string;
  timestamp?: string;
  path?: string;
};

export type SignupRequest = {
  username: string;
  password: string;
  displayName: string;
};

export type SignupResponse = {
  id: number;
  username: string;
  displayName: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  userId: number;
  username: string;
  displayName: string;
  role: "USER" | "ADMIN";
  accessToken: string;
  tokenType: string;
};

export type TokenResponse = {
  accessToken: string;
  tokenType: string;
};

export type AuthPrincipal = {
  userId: number;
  username: string;
  role: "USER" | "ADMIN";
};

export type AuthUser = {
  userId: number;
  username: string;
  displayName: string;
  role: "USER" | "ADMIN";
};

export type Word = {
  id: number;
  term: string;
  definition: string;
  level: number;
  favorite: boolean;
  exampleSentence: string | null;
  meaningOfExampleSentence: string | null;
  createdAt: string;
};

export type WordInput = {
  term: string;
  definition: string;
  exampleSentence?: string;
  meaningOfExampleSentence?: string;
};

export type GenerateExampleRequest = {
  term: string;
  definition?: string;
};

export type GenerateExampleResponse = {
  definition: string;
  exampleSentence: string;
  meaningOfExampleSentence: string;
};

export type AiUsageResponse = {
  dailyLimit: number;
  used: number;
  remaining: number;
};

export type QuizSetAttemptSummary = {
  setNumber: number;
  completedCount: number;
  lastCompletedAt: string;
};

export type CompleteQuizSetAttemptInput = {
  attemptId: string;
  wordCount: number;
  learnedCount: number;
};

export type AdminOverview = {
  totalAccounts: number;
  activeAccounts: number;
  withdrawnAccounts: number;
  legacyAccountsWithoutSignupDate: number;
  newSignupsLast7Days: number;
  wordUsersLast7Days: number;
  totalSavedWords: number;
  averageWordsPerActiveAccount: number;
  quizUsers: number;
  mostRecentActivityAt: string | null;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  totalPageViews: number;
  pageViewsLast30Days: number;
  totalAiGenerationRequests: number;
  aiGenerationRequestsLast30Days: number;
  totalWithdrawals: number;
};

export type AdminDailyStatistics = {
  date: string;
  newSignups: number;
  activeUsers: number;
  pageViews: number;
  aiGenerationRequests: number;
  withdrawals: number;
};

export type AdminMonthlyStatistics = {
  month: string;
  newSignups: number;
  activeUsers: number;
  pageViews: number;
  aiGenerationRequests: number;
  withdrawals: number;
};

export type AdminPopularWord = {
  term: string;
  savedCount: number;
  userCount: number;
};

export type AdminPopularPage = {
  path: string;
  viewCount: number;
  userCount: number;
};

export type AdminUser = {
  userId: number;
  username: string;
  displayName: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "WITHDRAWN";
  createdAt: string | null;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  withdrawnAt: string | null;
};

export type AdminAccountLifecycle = {
  eventId: number;
  userId: number | null;
  username: string | null;
  eventType: "SIGNUP" | "WITHDRAWAL";
  occurredAt: string;
};
