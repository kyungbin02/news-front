import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getToken } from '@/utils/token';
import { getUserIdFromToken, isAdminFromToken } from '@/utils/jwt';
import { Notification } from '@/types/notification';

class WebSocketService {
  private stompClient: Client | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5초

  private onNotificationCallback: ((notification: Notification) => void) | null = null;
  private onConnectionChangeCallback: ((connected: boolean) => void) | null = null;

  constructor() {
    // 클라이언트 초기화는 connect()에서 토큰과 함께 수행
  }

  private handleConnectionError() {
    this.isConnected = false;
    this.onConnectionChangeCallback?.(false);
    this.attemptReconnect();
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        const token = getToken();
        if (token) {
          this.connect();
        } else {
          console.log('토큰이 없어서 재연결을 중단합니다.');
        }
      }, this.reconnectInterval);
    } else {
      console.error('최대 재연결 시도 횟수 초과');
    }
  }

  private subscribeToNotifications() {
    if (!this.stompClient || !this.isConnected) return;

    const token = getToken();
    if (!token) {
      console.error('토큰이 없어서 알림 구독을 할 수 없습니다.');
      return;
    }

    try {
      // JWT 토큰에서 사용자 ID와 관리자 권한 확인
      const userId = getUserIdFromToken(token);
      const isAdmin = isAdminFromToken(token);

      if (!userId) {
        console.error('사용자 ID를 찾을 수 없습니다.');
        return;
      }

      console.log('사용자 정보:', { userId, isAdmin });

      // 관리자인 경우 관리자용 브로드캐스트 알림 구독
      if (isAdmin) {
        this.stompClient.subscribe('/topic/admin/notifications', (message) => {
          try {
            const notification: Notification = JSON.parse(message.body);
            console.log('관리자 알림 수신:', notification);
            this.onNotificationCallback?.(notification);
          } catch (error) {
            console.error('관리자 알림 파싱 오류:', error);
          }
        });
        console.log('관리자 알림 구독 완료: /topic/admin/notifications');
      }

      // 사용자용 개인 알림 구독 (관리자도 개인 알림을 받을 수 있음)
      this.stompClient.subscribe(`/queue/user/${userId}/notifications`, (message) => {
        try {
          const notification: Notification = JSON.parse(message.body);
          console.log('사용자 알림 수신:', notification);
          this.onNotificationCallback?.(notification);
        } catch (error) {
          console.error('사용자 알림 파싱 오류:', error);
        }
      });

      console.log(`사용자 알림 구독 완료: /queue/user/${userId}/notifications`);
    } catch (error) {
      console.error('토큰 파싱 오류:', error);
    }
  }

  public connect() {
    if (this.stompClient && !this.isConnected) {
      const token = getToken();
      if (!token) {
        console.error('토큰이 없어서 WebSocket에 연결할 수 없습니다.');
        return;
      }

      // JWT 토큰을 쿼리 파라미터로 전달
      const socketUrl = `ws://localhost:8080/ws?token=${encodeURIComponent(token)}`;
      const socket = new SockJS(socketUrl);
      
      // 새로운 소켓으로 클라이언트 재생성
      this.stompClient = new Client({
        webSocketFactory: () => socket,
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        onConnect: () => {
          console.log('WebSocket 연결 성공');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onConnectionChangeCallback?.(true);
          this.subscribeToNotifications();
        },
        onStompError: (frame) => {
          console.error('STOMP 오류:', frame);
          this.handleConnectionError();
        },
        onWebSocketError: (error) => {
          console.error('WebSocket 오류:', error);
          this.handleConnectionError();
        },
        onWebSocketClose: () => {
          console.log('WebSocket 연결 종료');
          this.isConnected = false;
          this.onConnectionChangeCallback?.(false);
          this.attemptReconnect();
        }
      });

      this.stompClient.activate();
    }
  }

  public disconnect() {
    if (this.stompClient && this.isConnected) {
      this.stompClient.deactivate();
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  public setNotificationCallback(callback: (notification: Notification) => void) {
    this.onNotificationCallback = callback;
  }

  public setConnectionChangeCallback(callback: (connected: boolean) => void) {
    this.onConnectionChangeCallback = callback;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public sendMessage(destination: string, body: any) {
    if (this.stompClient && this.isConnected) {
      this.stompClient.publish({
        destination,
        body: JSON.stringify(body)
      });
    } else {
      console.error('WebSocket이 연결되지 않았습니다.');
    }
  }
}

// 싱글톤 인스턴스
export const webSocketService = new WebSocketService();
