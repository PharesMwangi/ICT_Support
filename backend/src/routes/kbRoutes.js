import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { idParams } from "../validators/commonSchemas.js";
import { createArticleSchema, updateArticleSchema } from "../validators/kbSchema.js";
import { createArticle, 
    deleteArticle, 
    getArticle, 
    listArticles, 
    updateArticle } from "../controllers/kbController.js";

const router = Router();

// Everyone logged in can read.
router.use(requireAuth);
router.get('/', listArticles);
router.get('/:id', validate(idParams, 'params'), getArticle);
    
// Only admins can write.
router.post('/', requireRole('ADMIN'), validate(createArticleSchema), createArticle);
router.patch('/:id', requireRole('ADMIN'), validate(idParams, 'params'), validate(updateArticleSchema), updateArticle);
router.delete('/:id', requireRole('ADMIN'), validate(idParams, 'params'), deleteArticle);
    
export default router;