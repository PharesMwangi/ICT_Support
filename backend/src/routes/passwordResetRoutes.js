import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { idParams } from '../validators/commonSchemas.js';
import { dismissReset, issueResetCode, listResets } from '../controllers/passwordResetController.js';

const router = Router();

// Only ICT admins handle password resets.
router.use(requireAuth, requireRole('ADMIN'));
router.get('/', listResets);
router.post('/:id/issue-code', validate(idParams, 'params'), issueResetCode);
router.post('/:id/dismiss', validate(idParams, 'params'), dismissReset);

export default router;
