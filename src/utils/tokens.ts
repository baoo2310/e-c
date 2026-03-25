import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface TokenPayload {
  id: string;
}

export const tokenUtils = {
  // 1. Generate both tokens at once
  generateTokens: (payload: TokenPayload) => {

    const accessToken = jwt.sign(
      payload,
      ENV.JWT_ACCESS_SECRET as jwt.Secret,
      { expiresIn: ENV.JWT_ACCESS_EXPIRES_IN ? String(ENV.JWT_ACCESS_EXPIRES_IN) : '15m' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      payload,
      ENV.JWT_REFRESH_SECRET as jwt.Secret,
      { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN ? String(ENV.JWT_REFRESH_EXPIRES_IN) : '7d' } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
  },

  // 2. Verify Access Token
  verifyAccessToken: (token: string): TokenPayload => {
    return jwt.verify(token, ENV.JWT_ACCESS_SECRET as string) as TokenPayload;
  },

  // 3. Verify Refresh Token
  verifyRefreshToken: (token: string): TokenPayload => {
    return jwt.verify(token, ENV.JWT_REFRESH_SECRET as string) as TokenPayload;
  }
};