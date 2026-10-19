import { HttpError } from "../lib/HttpError";

// Every error ends up here and is sent as: { error: { message, details? } }
export function errorHandler(err, req, res, next){
    if(err instanceof HttpError){
        return res.status(err.status).json({ error: { message: err.message, details: err.details} });
    }
    if(err.type === 'entity.parse.failed'){
        return res.status(400).json({error: { message: 'Request body is not valid JSON'} });
    }
    if(err.type === 'entity.too.large'){
        return res.status(413).json({error: {message: 'Request is too large'} });
    }
    if(err.name === 'MulterError'){
        const messages ={
            LIMIT_FILE_SIZE: 'Each file must be 2 MB or smaller',
            LIMIT_FILE_COUNT: 'You can attach up to 3 files',
            LIMIT_UNEXPECTED_FILE: 'You can attach up to 3 files (form field name: attachments)',
        };
        return res.status(400).json({ error: { message: messages[err.code] ?? 'The file upload failed' } });
    }
    if(err.name ==='ZodError'){
        const details = err.issues.map((i) => ({field: i.path.join('.'), message: i.message}));
        return res.status(400).json({ error: { message: 'Please check the highlighted fields', details } })
    }
    if(err.code === 'P2025'){
        return res.status(400).json({ error: { message: 'Record not found'} });
    }
    if(err.code ==='P2002'){
        return res.status(409).json({ error: { message: 'That record already exists' } });
    }

    console.error(err);
    return res.status(500).json({ error: { message: 'Something went wrong on the server' } });
}