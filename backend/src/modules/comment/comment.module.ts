import { Router } from 'express';
import commentRoutes from '@/modules/comment/comment.routes';

const commentModule = Router();
commentModule.use('/', commentRoutes);

export default commentModule;
