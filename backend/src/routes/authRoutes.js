import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { forgotPasswordSchema, resetPasswordSchema } from '../validators/passwordResetSchema.js';
import { loginSchema, signupSchema } from "../validators/authSchemas.js";
import { login, logout, me, signup } from "../controllers/authController.js";
import { forgotPassword, resetPassword } from '../controllers/passwordResetController.js';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;