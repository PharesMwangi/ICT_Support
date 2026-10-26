import express from 'express';
import cors from 'cors';
import helmet from'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import metaRoutes from './routes/metaRoutes.js';
import kbRoutes from './routes/kbRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import reportRoutes from './routes/reportRoutes.js'

export const app = express();

if(env.NODE_ENV === 'production') app.test('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true} ));
app.use(express.json({ limit: '100kb'}));
app.use(cookieParser());
if(env.NODE_ENV !== 'test') app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

//slow down guessing
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    message: { error: { message: 'Too many attempts. Please try again in a few minutes' } },
});

app.get('/api/health', (req, res) => res.join({status: 'ok' }));
app.use('/api/meta', metaRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);