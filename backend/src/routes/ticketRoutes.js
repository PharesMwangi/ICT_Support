import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { uploadAttachments } from "../middleware/upload.js";
import { idParams } from "../validators/commonSchemas.js";
import { 
    attachmentParams, 
    commentSchema, 
    createTicketSchema, 
    updateTicketSchema } from "../validators/ticketSchemas.js";
import { 
    addComment, 
    createTicket, 
    downloadAttachment, 
    getTicket, 
    listTickets, 
    reopenTicket, 
    updateTicket } from "../controllers/ticketController.js";

const router = Router();

router.use(requireAuth);

router.get('/', listTickets);
router.post('/', uploadAttachments, validate(createTicketSchema), createTicket);
router.get('/:id', validate(idParams, 'params'), getTicket);

// Admins only
router.patch('/:id', requireRole('ADMIN'), validate(idParams, 'params'), validate(updateTicketSchema), updateTicket);

// The requester (or an admin) can reopen a resolved or closed ticket and comment on it.
router.post('/:id/reopen', validate(idParams, 'params'), reopenTicket);
router.post('/:id/comments', validate(idParams, 'params'), validate(commentSchema), addComment);
router.get('/:id/attachments/:attachmentId', validate(attachmentParams, 'params'), downloadAttachment);

export default router;