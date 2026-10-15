//to send clean error messages

export class HttpError extends Error{
    constructor(status, message, details){
        supet(message);
        this.status = status;
        this.details = details;
    }
}