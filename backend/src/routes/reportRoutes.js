import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { summary, ticketsCsv } from "../controllers/reportController.js";

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/summary', summary);
router.get('/tickets.csv', ticketsCsv);

export default router;
