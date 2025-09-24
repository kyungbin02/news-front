import { NotificationConfig, NotificationType } from '@/types/notification';

export const notificationConfig: Record<NotificationType, NotificationConfig> = {
  'INQUIRY_ANSWER': {
    icon: '✅',
    color: '#4CAF50', // 초록색
    title: '문의사항 답변',
    description: '문의사항에 답변이 등록되었습니다'
  },
  'BOARD_COMMENT': {
    icon: '💬',
    color: '#9C27B0', // 보라색
    title: '게시글 댓글',
    description: '내 게시글에 댓글이 달렸습니다'
  }
};

export const getNotificationConfig = (type: string): NotificationConfig => {
  return notificationConfig[type as NotificationType] || {
    icon: '🔔',
    color: '#6B7280',
    title: '알림',
    description: '새로운 알림이 있습니다'
  };
};



