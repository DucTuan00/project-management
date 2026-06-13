import { Router } from 'express';
import kanbanRoutes from '@/modules/kanban/kanban.routes';

const kanbanModule = Router();

kanbanModule.use('/', kanbanRoutes);

export default kanbanModule;
