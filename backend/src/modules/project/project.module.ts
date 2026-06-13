import { Router } from 'express';
import projectRoutes from '@/modules/project/project.routes';

const projectModule = Router();

projectModule.use('/', projectRoutes);

export default projectModule;
