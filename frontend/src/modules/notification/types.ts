export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, any>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  email: Record<string, boolean>;
  push: Record<string, boolean>;
}
