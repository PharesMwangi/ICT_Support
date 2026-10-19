//for admins
import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireRole } from "../middleware/requireRole";
import { requireAuth } from "../middleware/requireAuth";
import { idParams } from "../validators/commonSchemas";
import { setActiveSchema, setRoleSchema } from "../validators/userSchemas";
import { listUsers, setActive, setRole } from "../controllers/userController";

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', listUsers);
router.patch('/:id/role', validate(idParams, "params"), validate(setRoleSchema), setRole);
router.patch('/:id/active', validate(idParams, 'params'), validate(setActiveSchema), setActive);

export default router;