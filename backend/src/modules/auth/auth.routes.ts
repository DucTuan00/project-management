import { Router } from 'express';
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

const router = Router();

// Public routes
router.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  AuthController.register,
);

router.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  AuthController.login,
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  AuthController.refresh,
);

router.post(
  '/logout',
  validate(refreshTokenSchema),
  AuthController.logout,
);

router.post(
  '/verify-email',
  authRateLimit,
  validate(verifyEmailSchema),
  AuthController.verifyEmail,
);

router.post(
  '/resend-verification',
  authRateLimit,
  validate(forgotPasswordSchema),
  AuthController.resendVerification,
);

router.post(
  '/forgot-password',
  authRateLimit,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword,
);

router.post(
  '/reset-password',
  authRateLimit,
  validate(resetPasswordSchema),
  AuthController.resetPassword,
);

// Protected routes
router.get(
  '/me',
  authenticate,
  AuthController.getMe,
);

export default router;
