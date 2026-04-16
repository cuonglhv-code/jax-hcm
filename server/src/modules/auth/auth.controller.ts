import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/response';

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { tokens, user } = await authService.login(email, password);
    sendSuccess(res, { ...tokens, user }, 200);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refresh(refreshToken);
    sendSuccess(res, tokens);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    sendSuccess(res, { message: 'Logged out successfully' });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, req.user);
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    sendSuccess(res, { message: 'Password changed successfully' });
  }),
};
