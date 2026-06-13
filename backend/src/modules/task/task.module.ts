import { Router } from 'express';
import taskRoutes from '@/modules/task/task.routes';

const taskModule = Router();

taskModule.use('/', taskRoutes);

export default taskModule;
