import { Router } from 'express'
import { authRateLimiter }    from '../../middleware/rateLimiter'
import { authenticate }       from '../../middleware/authenticate'
import { validate }           from '../../middleware/validate'
import { loginSchema, changePasswordSchema } from './auth.schemas'
import * as ctrl              from './auth.controller'

const router = Router()

router.post('/login',           authRateLimiter, validate(loginSchema), ctrl.login)
router.post('/logout',          ctrl.logout)
router.post('/refresh',         authRateLimiter, ctrl.refresh)
router.get('/me',               authenticate, ctrl.me)
router.post('/change-password', authenticate, validate(changePasswordSchema), ctrl.changePassword)

export default router
