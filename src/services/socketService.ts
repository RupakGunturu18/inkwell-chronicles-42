import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5001';

class SocketService {
    private socket: Socket | null = null;
    private messageHandlers: ((data: any) => void)[] = [];
    private onlineHandlers: ((data: any) => void)[] = [];
    private offlineHandlers: ((data: any) => void)[] = [];

    connect(token: string) {
        if (this.socket?.connected) {
            return;
        }

        this.socket = io(SOCKET_URL, {
            auth: { token }
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('receive_message', (data) => {
            this.messageHandlers.forEach(handler => handler(data));
        });

        this.socket.on('user_online', (data) => {
            this.onlineHandlers.forEach(handler => handler(data));
        });

        this.socket.on('user_offline', (data) => {
            this.offlineHandlers.forEach(handler => handler(data));
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    sendMessage(receiverId: string, content: string) {
        if (this.socket) {
            this.socket.emit('send_message', { receiverId, content });
        }
    }

    joinRoom(roomId: string) {
        if (this.socket) {
            this.socket.emit('join_room', roomId);
        }
    }

    onMessage(handler: (data: any) => void) {
        this.messageHandlers.push(handler);
    }

    onUserOnline(handler: (data: any) => void) {
        this.onlineHandlers.push(handler);
    }

    onUserOffline(handler: (data: any) => void) {
        this.offlineHandlers.push(handler);
    }

    removeMessageHandler(handler: (data: any) => void) {
        this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    }
}

export const socketService = new SocketService();
