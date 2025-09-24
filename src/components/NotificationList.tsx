'use client';

import React, { useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import NotificationItem from './NotificationItem';
import { Bell, RefreshCw, CheckCheck } from 'lucide-react';

interface NotificationListProps {
  onClose?: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    fetchNotifications,
    markAllNotificationsAsRead
  } = useNotification();

  console.log('📊 NotificationList 읽지 않은 알림 수:', {
    contextUnreadCount: unreadCount,
    totalNotifications: notifications.length,
    unreadCountType: typeof unreadCount,
    unreadCountValue: unreadCount,
    shouldShowBadge: unreadCount > 0
  });

  // unreadCount가 변경될 때 강제 리렌더링
  useEffect(() => {
    console.log('🔄 NotificationList unreadCount 변경 감지:', unreadCount);
  }, [unreadCount]);

  const handleRefresh = async () => {
    await fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };

  return (
    <div className="w-96 max-h-96 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              알림
              {unreadCount > 0 && (
                <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              )}
            </h3>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* 새로고침 버튼 */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 액션 버튼들 */}
        {notifications.length > 0 && (
          <div className="mt-3 flex items-center space-x-2">
            {unreadCount > 0 ? (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                모두 읽음
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* 알림 목록 */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">알림을 불러오는 중...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">알림이 없습니다</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={onClose}
            />
          ))
        )}
      </div>

    </div>
  );
};

export default NotificationList;

