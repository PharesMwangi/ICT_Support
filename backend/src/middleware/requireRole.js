import { HttpError } from "../lib/HttpError.js";

export const requireRole = (...roles) => (req, res, next) =>{
    if(!req.user || !roles.includes(req.user.role)){
        throw new HttpError(403, 'You do not have permission to do that');
    }
    next();
};