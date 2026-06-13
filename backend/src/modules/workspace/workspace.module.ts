import { Router } from 'express';
import workspaceRoutes from '@/modules/workspace/workspace.routes';

const workspaceModule = Router();

workspaceModule.use('/', workspaceRoutes);

export default workspaceModule;
