import apiClient from './apiClient';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/env';
import { ChatMessage } from '../types';

let socket: Socket | null = null;

export const chatService = {
  async getMessages(orderId: string): Promise<ChatMessage[]> {
    const res = await apiClient.get(`/chat/${orderId}`);
    return res.data.data ?? res.data.messages ?? res.data;
  },

  async sendMessage(orderId: string, message: string): Promise<ChatMessage> {
    const res = await apiClient.post(`/chat/${orderId}`, { message });
    return res.data.data ?? res.data.message ?? res.data;
  },

  connectSocket(token: string): Socket {
    if (socket?.connected) return socket;
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
    });
    return socket;
  },

  disconnectSocket(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket(): Socket | null {
    return socket;
  },

  joinRoom(orderId: string): void {
    socket?.emit('join_room', orderId);
  },

  leaveRoom(orderId: string): void {
    socket?.emit('leave_room', orderId);
  },
};
