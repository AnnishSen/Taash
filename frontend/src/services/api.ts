import type { User, Room, Friend, FriendRequest } from '../types';

const API_BASE = ''; // Uses Vite proxy in development, or relative in production

export const getStoredToken = (): string | null => {
  return localStorage.getItem('taash_token');
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem('taash_token', token);
};

export const clearStoredToken = (): void => {
  localStorage.removeItem('taash_token');
};

const getHeaders = () => {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Auth
  async signup(data: { email: string; username: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async signin(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success && result.token) {
      setStoredToken(result.token);
    }
    return result;
  },

  async getMe(): Promise<{ success: boolean; user?: User; message?: string }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } finally {
      clearStoredToken();
    }
  },

  // Rooms
  async getRooms(): Promise<{ success: boolean; rooms: Room[] }> {
    const res = await fetch(`${API_BASE}/rooms`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async getRoom(roomCode: string): Promise<{ success: boolean; room: Room }> {
    const res = await fetch(`${API_BASE}/rooms/${roomCode}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async createRoom(): Promise<{ success: boolean; room: Room; message?: string }> {
    const res = await fetch(`${API_BASE}/rooms/create`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async joinRoom(roomCode: string): Promise<{ success: boolean; roomCode?: string; seat?: number; message?: string }> {
    const res = await fetch(`${API_BASE}/rooms/join`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ roomCode }),
    });
    return res.json();
  },

  async leaveRoom(): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/rooms/leave`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async toggleReady(): Promise<{ success: boolean; isReady: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/rooms/ready`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return res.json();
  },

  async startGame(): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/rooms/start`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async inviteToRoom(friendId: string, roomCode: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/rooms/invite`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ friendId, roomCode }),
    });
    return res.json();
  },

  // Friends
  async getFriends(): Promise<{ success: boolean; friends: Friend[] }> {
    const res = await fetch(`${API_BASE}/friends`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async getPendingRequests(): Promise<{ success: boolean; requests: FriendRequest[] }> {
    const res = await fetch(`${API_BASE}/friends/requests`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async sendFriendRequest(username: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/friends/request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username }),
    });
    return res.json();
  },

  async acceptFriendRequest(requestId: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/friends/accept`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ requestId }),
    });
    return res.json();
  },

  async rejectFriendRequest(requestId: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/friends/reject`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ requestId }),
    });
    return res.json();
  },

  async removeFriend(friendId: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/friends/${friendId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },
};
