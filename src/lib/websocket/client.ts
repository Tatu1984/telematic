// WebSocket client for real-time updates
import { getWebSocketUrl } from '@/config/api.config';
import { getAuthToken } from '@/lib/auth/token-manager';
import type { WebSocketEvents, WebSocketEventName } from './types';

type EventCallback<T extends WebSocketEventName> = WebSocketEvents[T];

class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnecting = false;

  /**
   * Connect to WebSocket server
   */
  connect(): WebSocket | null {
    if (this.isConnecting || this.socket?.readyState === WebSocket.OPEN) {
      return this.socket;
    }

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) {
      console.warn('WebSocket URL not configured');
      return null;
    }

    this.isConnecting = true;

    try {
      const token = getAuthToken();
      const url = token ? `${wsUrl}?token=${token}` : wsUrl;

      this.socket = new WebSocket(url);
      this.setupEventHandlers();

      return this.socket;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.isConnecting = false;
      return null;
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.emit('connect');
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnecting = false;
      this.emit('disconnect');
      this.attemptReconnect();
    };

    this.socket.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.emit('error', new Error('WebSocket error'));
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit(message.type, message.payload);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Subscribe to an event
   */
  on<T extends WebSocketEventName>(event: T, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as Function);
  }

  /**
   * Unsubscribe from an event
   */
  off<T extends WebSocketEventName>(event: T, callback?: EventCallback<T>): void {
    if (!this.listeners.has(event)) return;

    if (callback) {
      this.listeners.get(event)!.delete(callback as Function);
    } else {
      this.listeners.delete(event);
    }
  }

  /**
   * Emit an event to listeners
   */
  private emit(event: string, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Send a message through WebSocket
   */
  send(type: string, payload: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

// Also export the class for testing
export { WebSocketClient };
