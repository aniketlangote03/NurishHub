import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
  }

  /**
   * Initialize connection. Called upon successful login/mount.
   */
  connect(token) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log(`Socket connected: ${this.socket.id}`);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn(`Socket disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connect error:', error.message);
    });

    return this.socket;
  }

  /**
   * Terminate connection on logout
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Bind event listener
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Unbind event listener
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Emit an event
   */
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();
