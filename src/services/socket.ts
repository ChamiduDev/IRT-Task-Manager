import { io, Socket } from 'socket.io-client';

/**
 * Socket Service
 * Manages WebSocket connection for real-time updates
 */
class SocketService {
  private socket: Socket | null = null;
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  /**
   * Get the base URL without /api suffix for Socket.IO
   */
  private getSocketURL(): string {
    // Remove /api suffix if present
    const baseURL = this.API_BASE_URL.replace(/\/api$/, '');
    return baseURL;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const socketURL = this.getSocketURL();
    console.log(`🔌 Connecting to WebSocket server: ${socketURL}`);

    this.socket = io(socketURL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ WebSocket connection error:', error);
    });

    return this.socket;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 WebSocket disconnected');
    }
  }

  /**
   * Get the socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();
