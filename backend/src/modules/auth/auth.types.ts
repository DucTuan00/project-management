export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPayload {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
}

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthResponse {
  user: UserPayload;
  tokens: AuthTokens;
}
