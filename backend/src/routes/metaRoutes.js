import { Router } from 'express';
import { CATEGORIES, DEPARTMENTS } from '../lib/constants.js';

const router = Router();

// Public: the signup page needs the department list before anyone is logged in.
router.get('/', (req, res) => {
  res.json({ departments: DEPARTMENTS, categories: CATEGORIES });
});

export default router;
