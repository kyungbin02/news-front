'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import NotificationList from './NotificationList';
import { Bell } from 'lucide-react';

const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, isConnected } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  console.log('📊 NotificationDropdown 읽지 않은 알림 수:', {
    contextUnreadCount: unreadCount,
    totalNotifications: notifications.length,
    unreadCountType: typeof unreadCount,
    unreadCountValue: unreadCount,
    shouldShowBadge: unreadCount > 0
  });

  // unreadCount가 변경될 때 강제 리렌더링
  useEffect(() => {
    console.log('🔄 NotificationDropdown unreadCount 변경 감지:', unreadCount);
  }, [unreadCount]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 버튼 */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="알림"
      >
        <Bell className="w-6 h-6" />
        
        {/* 읽지 않은 알림 표시 (빨간 점 대신 다른 방식) */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
        )}
        
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 z-50">
          <NotificationList onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

