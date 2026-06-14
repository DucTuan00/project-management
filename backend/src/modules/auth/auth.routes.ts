import { Router } from 'express';
import { AppDataSource } from '@/config/database';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthController } from '@/modules/auth/auth.controller';
import { validate } from '@/shared/middleware/validate.middleware';
import { authenticate } from '@/shared/middleware/auth.middleware';
import { authRateLimit } from '@/shared/middleware/rate-limit.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/modules/auth/auth.dto';

const authRepository = new AuthRepository(AppDataSource);
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

const router = Router();

// Public routes
router.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  authController.register,
);

router.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  authController.login,
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refresh,
);

router.post(
  '/logout',
  validate(refreshTokenSchema),
  authController.logout,
);

router.post(
  '/verify-email',
  authRateLimit,
  validate(verifyEmailSchema),
  authController.verifyEmail,
);

router.post(
  '/resend-verification',
  authRateLimit,
  validate(forgotPasswordSchema),
  authController.resendVerification,
);

router.post(
  '/forgot-password',
  authRateLimit,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  '/reset-password',
  authRateLimit,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

// Protected routes
router.get(
  '/me',
  authenticate,
  authController.getMe,
);

export default router;
