'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification } from '@/types/notification';
import { webSocketService } from '@/services/websocketService';
import { 
  getUserNotifications, 
  getUserUnreadCount,
  getAdminNotifications,
  getAdminUnreadCount,
  markAsRead,
  markAllAsRead
} from '@/services/notificationService';
import { getToken } from '@/utils/token';
import { isAdminFromToken } from '@/utils/jwt';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: number) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // 읽지 않은 알림 수 계산 (클라이언트에서)
  const calculateUnreadCount = useCallback((notifications: Notification[]) => {
    console.log('🔍 알림 데이터 상세 분석:', notifications.map(n => ({
      id: n.id,
      isRead: n.isRead,
      isReadType: typeof n.isRead,
      isReadValue: n.isRead,
      isReadBoolean: Boolean(n.isRead),
      isReadNumber: Number(n.isRead)
    })));
    
    const count = notifications.filter(n => {
      // isRead가 number인 경우 0이면 읽지 않음, 1이면 읽음
      // isRead가 boolean인 경우 false면 읽지 않음, true면 읽음
      const isUnread = typeof n.isRead === 'number' ? n.isRead === 0 : !n.isRead;
      console.log(`알림 ${n.id}: isRead=${n.isRead} (${typeof n.isRead}) → 읽지 않음: ${isUnread}`);
      return isUnread;
    }).length;
    
    console.log('📊 계산된 읽지 않은 알림 수:', count);
    console.log('📊 이전 unreadCount:', unreadCount);
    console.log('📊 새로운 unreadCount로 업데이트:', count);
    return count;
  }, [unreadCount]);

  // 알림 목록 조회
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('토큰이 없습니다.');
      }

      const isAdmin = isAdminFromToken(token);
      console.log('🔄 알림 목록 조회 시작...', { isAdmin });
      
      const response = isAdmin ? await getAdminNotifications() : await getUserNotifications();
      console.log('📋 받은 알림 데이터:', response);
      console.log('📊 알림 배열:', response.notifications);
      console.log('📊 알림 개수:', response.notifications?.length || 0);
      
      const notifications = response.notifications || [];
      
      // 각 알림의 isRead 상태 상세 분석
      console.log('🔍 서버에서 받은 알림 상태 분석:');
      notifications.forEach((n, index) => {
        console.log(`알림 ${index + 1}:`, {
          id: n.id,
          isRead: n.isRead,
          isReadType: typeof n.isRead,
          isReadValue: n.isRead,
          isReadBoolean: Boolean(n.isRead),
          isReadNumber: Number(n.isRead),
          isReadEqual1: typeof n.isRead === 'number' && n.isRead === 1,
          isReadEqual0: typeof n.isRead === 'number' && n.isRead === 0,
          isReadTrue: typeof n.isRead === 'boolean' && n.isRead === true,
          isReadFalse: typeof n.isRead === 'boolean' && n.isRead === false
        });
      });
      
      setNotifications(notifications);
      
      // 읽지 않은 알림 수 계산
      const unreadCount = calculateUnreadCount(notifications);
      console.log('🔄 unreadCount 상태 업데이트:', {
        이전값: unreadCount,
        새로운값: unreadCount,
        설정전: unreadCount
      });
      setUnreadCount(unreadCount);
      
      console.log('✅ 알림 상태 업데이트 완료');
    } catch (error) {
      console.error('알림 조회 실패:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [calculateUnreadCount]);

  // 특정 알림 읽음 처리
  const markNotificationAsRead = useCallback(async (id: number) => {
    try {
      console.log(`🔄 알림 읽음 처리 시작: ID ${id}`);
      
      // 처리 전 현재 알림 상태 확인
      const currentNotification = notifications.find(n => n.id === id);
      console.log(`📊 처리 전 알림 상태:`, {
        id: currentNotification?.id,
        isRead: currentNotification?.isRead,
        isReadType: typeof currentNotification?.isRead
      });
      
      // 1. 서버에 읽음 처리 요청
      await markAsRead(id);
      console.log(`✅ 서버에 읽음 처리 요청 완료: ID ${id}`);
      
      // 2. 서버에서 최신 알림 목록을 다시 가져와서 상태 동기화
      console.log('🔄 서버에서 최신 알림 상태 조회 중...');
      await fetchNotifications();
      
      console.log('✅ 알림 읽음 처리 완료');
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
      // 오류 발생 시 사용자에게 알림
      alert('알림 읽음 처리에 실패했습니다. 다시 시도해주세요.');
    }
  }, [fetchNotifications, notifications]);

  // 모든 알림 읽음 처리
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      console.log('🔄 모든 알림 읽음 처리 시작');
      
      // 읽지 않은 알림들만 서버에 읽음 처리 요청
      const unreadNotifications = notifications.filter(n => {
        const isRead = typeof n.isRead === 'number' ? n.isRead === 1 : n.isRead;
        return !isRead;
      });
      
      console.log(`📊 읽지 않은 알림 ${unreadNotifications.length}개 처리 중...`);
      await Promise.all(unreadNotifications.map(notification => markAsRead(notification.id)));
      
      // 서버에서 최신 알림 목록을 다시 가져와서 상태 동기화
      console.log('🔄 서버에서 최신 알림 상태 조회 중...');
      await fetchNotifications();
      
      console.log('✅ 모든 알림 읽음 처리 완료');
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
      alert('모든 알림 읽음 처리에 실패했습니다. 다시 시도해주세요.');
    }
  }, [notifications, fetchNotifications]);

  // 새 알림 추가 (WebSocket에서 수신)
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev];
      const unreadCount = calculateUnreadCount(updated);
      setUnreadCount(unreadCount);
      return updated;
    });
  }, [calculateUnreadCount]);

  // 알림 목록 초기화
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // WebSocket 연결 상태 변경 핸들러
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  // 새 알림 수신 핸들러
  const handleNewNotification = useCallback((notification: Notification) => {
    addNotification(notification);
  }, [addNotification]);

  // 토큰이 있을 때만 WebSocket 연결 및 데이터 조회
  useEffect(() => {
    const token = getToken();
    if (token) {
      // WebSocket 연결
      webSocketService.connect();
      
      // 알림 조회 활성화 (읽지 않은 알림 수는 자동으로 계산됨)
      fetchNotifications();
      
      console.log('🔔 알림 시스템: WebSocket 연결 및 알림 조회 활성화');
    } else {
      webSocketService.disconnect();
      clearNotifications();
    }
  }, [fetchNotifications, clearNotifications]);

  // WebSocket 설정
  useEffect(() => {
    webSocketService.setConnectionChangeCallback(handleConnectionChange);
    webSocketService.setNotificationCallback(handleNewNotification);
    
    return () => {
      webSocketService.disconnect();
    };
  }, [handleConnectionChange, handleNewNotification]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addNotification,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
