'use client';

import React from 'react';
import { Notification } from '@/types/notification';
import { getNotificationConfig } from '@/config/notificationConfig';
import { useNotification } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X, Check } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const { markNotificationAsRead } = useNotification();
  const config = getNotificationConfig(notification.notification_type);

  // isRead 상태를 올바르게 처리 (number 또는 boolean)
  const isRead = typeof notification.isRead === 'number' ? notification.isRead === 1 : notification.isRead;

  const handleMarkAsRead = async () => {
    console.log(`🖱️ 읽음 처리 버튼 클릭: ID ${notification.id}, isRead: ${notification.isRead} (${typeof notification.isRead}), 계산된 읽음 상태: ${isRead}`);
    if (!isRead) {
      console.log(`✅ 읽음 처리 진행: ID ${notification.id}`);
      await markNotificationAsRead(notification.id);
    } else {
      console.log(`⚠️ 이미 읽음 처리된 알림: ID ${notification.id}`);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ko 
      });
    } catch (error) {
      return '시간 정보 없음';
    }
  };

  return (
    <div 
      className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
        !isRead ? 'bg-blue-50' : 'bg-white'
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* 아이콘 */}
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <span style={{ color: config.color }}>
            {config.icon}
          </span>
        </div>

        {/* 알림 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {notification.notification_title}
            </h4>
            <div className="flex items-center space-x-2">
              {!isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
              <span className="text-xs text-gray-500">
                {formatTime(notification.created_at)}
              </span>
            </div>
          </div>
          
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {notification.notification_message}
          </p>

          {/* 추가 정보 */}
          {(notification.username || notification.admin_username) && (
            <div className="mt-2 text-xs text-gray-500">
              {notification.username && (
                <span>사용자: {notification.username}</span>
              )}
              {notification.admin_username && (
                <span>관리자: {notification.admin_username}</span>
              )}
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="mt-3 flex items-center space-x-2">
            {!isRead && (
              <button
                onClick={handleMarkAsRead}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
              >
                <Check className="w-3 h-3 mr-1" />
                읽음 처리
              </button>
            )}
          </div>
        </div>

        {/* 닫기 버튼 (모달에서 사용) */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;

