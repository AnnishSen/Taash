import { getStoredToken } from './api';

type MessageHandler = (data: any) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: any = null;
  private url: string = '';
  private isAuthenticated: boolean = false;
  private pendingQueue: Record<string, any>[] = [];

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const host = isDev && window.location.port !== '8080' ? `${window.location.hostname}:8080` : window.location.host;
    this.url = `${protocol}//${host}`;
  }

  connect(): Promise<boolean> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WS] Connected to Taash Server');
          const token = getStoredToken();
          if (token) {
            this.ws?.send(JSON.stringify({ type: 'auth', token }));
          }
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'authenticated') {
              console.log('[WS] Authenticated successfully');
              this.isAuthenticated = true;
              this.flushQueue();
            }
            this.dispatch(data.type, data);
            this.dispatch('*', data);
          } catch (err) {
            console.error('[WS] Failed to parse message', err);
          }
        };

        this.ws.onclose = () => {
          console.log('[WS] Connection closed. Reconnecting in 3s...');
          this.isAuthenticated = false;
          this.ws = null;
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            const token = getStoredToken();
            if (token) {
              this.connect();
            }
          }, 3000);
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          resolve(false);
        };
      } catch (err) {
        console.error('[WS] Connection attempt failed:', err);
        resolve(false);
      }
    });
  }

  private flushQueue() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const queue = [...this.pendingQueue];
    this.pendingQueue = [];
    queue.forEach((msg) => {
      try {
        this.ws?.send(JSON.stringify(msg));
      } catch (e) {
        console.error('[WS] Failed to send queued message', e);
      }
    });
  }

  authenticate(token: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'auth', token }));
    } else {
      this.connect().then(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'auth', token }));
        }
      });
    }
  }

  send(message: Record<string, any>) {
    if (message.type === 'auth') {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isAuthenticated) {
      this.pendingQueue.push(message);
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.connect();
      }
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);

    return () => {
      this.off(type, handler);
    };
  }

  off(type: string, handler: MessageHandler) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  private dispatch(type: string, data: any) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (e) {
          console.error(`[WS] Handler for ${type} failed:`, e);
        }
      });
    }
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    this.isAuthenticated = false;
    this.pendingQueue = [];
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  joinRoom(roomCode: string) {
    this.send({ type: 'join_room', roomCode });
  }

  leaveRoom(roomCode: string) {
    this.send({ type: 'leave_room', roomCode });
  }

  toggleReady(roomCode: string) {
    this.send({ type: 'toggle_ready', roomCode });
  }

  startGame(roomCode: string) {
    this.send({ type: 'start_game', roomCode });
  }

  chooseTrump(card: string) {
    this.send({ type: 'choose_trump', card });
  }

  openTrump() {
    this.send({ type: 'open_trump' });
  }

  playCard(card: string, traatVolume?: number) {
    this.send({ type: 'play_card', card, traatVolume });
  }

  inviteToRoom(friendId: string, roomCode: string) {
    this.send({ type: 'invite_to_room', friendId, roomCode });
  }

  returnToLobby(roomCode: string) {
    this.send({ type: 'return_to_lobby', roomCode });
  }

  nextRound(roomCode: string) {
    this.send({ type: 'next_round', roomCode });
  }
}

export const socketService = new SocketService();
