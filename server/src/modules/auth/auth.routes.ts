import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from './auth.schemas';

export const authRouter = Router();

// Public routes
authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.post('/refresh', validate(refreshTokenSchema), authController.refresh);
authRouter.post('/logout', authController.logout);

// Protected routes
authRouter.get('/me', authenticate, authController.me);
authRouter.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
