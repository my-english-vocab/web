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
  accessToken: string;
  tokenType: string;
};

export type TokenResponse = {
  accessToken: string;
  tokenType: string;
};

export type AuthUser = {
  userId: number;
  username: string;
  displayName: string;
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
