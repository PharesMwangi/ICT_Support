//for admins
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireRole } from "../middleware/requireRole.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { idParams } from "../validators/commonSchemas.js";
import { setActiveSchema, setRoleSchema } from "../validators/userSchemas.js";
import { listUsers, setActive, setRole } from "../controllers/userController.js";

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', listUsers);
router.patch('/:id/role', validate(idParams, "params"), validate(setRoleSchema), setRole);
router.patch('/:id/active', validate(idParams, 'params'), validate(setActiveSchema), setActive);

export default router;