import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { idParams } from "../validators/commonSchemas";
import { createArticleSchema, updateArticleSchema } from "../validators/kbSchema";
import { createArticle, 
    deleteArticle, 
    getArticle, 
    listArticles, 
    updateArticle } from "../controllers/kbController";

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