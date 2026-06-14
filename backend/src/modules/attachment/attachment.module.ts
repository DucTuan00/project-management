import { Router } from 'express';
import attachmentRoutes from '@/modules/attachment/attachment.routes';

const attachmentModule = Router();
attachmentModule.use('/', attachmentRoutes);

export default attachmentModule;
