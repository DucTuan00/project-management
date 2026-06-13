import { Router } from 'express';
import authRoutes from '@/modules/auth/auth.routes';

const authModule = Router();

authModule.use('/', authRoutes);

export default authModule;
