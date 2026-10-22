import { Schema } from "zod/v3";
import { HttpError } from "../lib/HttpError.js";

// checks req.body and replaces it with cleaned data
export const validate = (schema, source = 'body') => (req, res, next) =>{
    const result = schema.safeParse(req [source]);
    if(!result.success){
        const details = result.error.issues.map((i) =>({
            field: i.path.join('.'),
            message: i.message,
        }));
        throw new HttpError(400, 'Please check the highlighted fields', details);
    }

    if(source === 'body') req.body = result.data;
    next();
};