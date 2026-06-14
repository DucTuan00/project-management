import { Router } from 'express';
import notificationRoutes from '@/modules/notification/notification.routes';

const notificationModule = Router();
notificationModule.use('/', notificationRoutes);

export default notificationModule;
