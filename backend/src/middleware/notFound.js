import { HttpError } from "../lib/HttpError.js";

export const notFound = (req, res, next) =>{
    next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}` ));
};