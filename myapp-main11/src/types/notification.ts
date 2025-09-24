export interface Notification {
  id: number;
  notification_type: string;
  notification_title: string;
  notification_message: string;
  user_id: number;
  admin_id: number | null;
  isRead: boolean;
  created_at: string;
  updated_at: string;
  username?: string; // JOIN 필드
  admin_username?: string; // JOIN 필드
}

export interface NotificationConfig {
  icon: string;
  color: string;
  title: string;
  description: string;
}

export type NotificationType = 
  | 'INQUIRY_ANSWER'
  | 'BOARD_COMMENT';

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}



