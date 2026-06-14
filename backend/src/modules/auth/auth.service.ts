import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { RegisterDto, LoginDto, ResetPasswordDto } from '@/modules/auth/auth.dto';
import { AuthTokens, AuthResponse, UserPayload } from '@/modules/auth/auth.types';
import { ConflictError } from '@/shared/errors/conflict';
import { UnauthorizedError } from '@/shared/errors/unauthorized';
import { NotFoundError } from '@/shared/errors/not-found';
import { AppError } from '@/shared/errors/app-error';
import { env } from '@/config/env';
import { blacklistToken, isTokenBlacklisted } from '@/shared/middleware/auth.middleware';
import { generateVerificationToken } from '@/shared/utils/slug';
import { logger } from '@/shared/logger/logger';
import { User } from '@/modules/auth/auth.entity';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.authRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.authRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      displayName: dto.displayName,
      verificationToken,
      verificationTokenExpires,
      isEmailVerified: false,
    });

    const tokens = this.generateTokens(user);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, SALT_ROUNDS);
    await this.authRepository.update(user.id, { refreshTokenHash });

    logger.info({ userId: user.id }, 'User registered successfully');

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await this.authRepository.update(user.id, { lastLoginAt: new Date() });

    const tokens = this.generateTokens(user);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, SALT_ROUNDS);
    await this.authRepository.update(user.id, { refreshTokenHash });

    logger.info({ userId: user.id }, 'User logged in successfully');

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string; email: string };

    if (await isTokenBlacklisted(refreshToken)) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    const user = await this.authRepository.findById(payload.userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isRefreshTokenValid) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Blacklist old refresh token
    const decoded = jwt.decode(refreshToken) as { exp: number };
    if (decoded && decoded.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await blacklistToken(refreshToken, ttl);
      }
    }

    const tokens = this.generateTokens(user);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, SALT_ROUNDS);
    await this.authRepository.update(user.id, { refreshTokenHash });

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.decode(refreshToken) as { exp: number };
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await blacklistToken(refreshToken, ttl);
        }
      }

      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
      await this.authRepository.update(payload.userId, { refreshTokenHash: null });
    } catch {
      // Token may be invalid/expired, but logout should still succeed
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.authRepository.findByVerificationToken(token);
    if (!user) {
      throw new NotFoundError('Invalid verification token');
    }

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      throw new AppError('Verification token has expired', 400, 'TOKEN_EXPIRED');
    }

    await this.authRepository.update(user.id, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      verificationToken: null,
      verificationTokenExpires: null,
    });

    logger.info({ userId: user.id }, 'Email verified successfully');
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    if (user.isEmailVerified) {
      return;
    }

    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.authRepository.update(user.id, {
      verificationToken,
      verificationTokenExpires,
    });

    logger.info({ userId: user.id }, 'Verification email resent');
    // TODO: Send email via BullMQ job
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    const resetToken = generateVerificationToken();
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.authRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires,
    });

    logger.info({ userId: user.id }, 'Password reset requested');
    // TODO: Send email via BullMQ job
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.authRepository.findByPasswordResetToken(dto.token);
    if (!user) {
      throw new NotFoundError('Invalid reset token');
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw new AppError('Reset token has expired', 400, 'TOKEN_EXPIRED');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.authRepository.update(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshTokenHash: null, // Invalidate all sessions
    });

    logger.info({ userId: user.id }, 'Password reset successfully');
  }

  async getMe(userId: string): Promise<UserPayload> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return this.sanitizeUser(user);
  }

  private generateTokens(user: User): AuthTokens {
    const payload = { userId: user.id, email: user.email };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User): UserPayload {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
