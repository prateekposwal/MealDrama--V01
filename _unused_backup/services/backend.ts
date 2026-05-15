import { io, Socket } from 'socket.io-client';

const API_BASE = '/api';

class BackendService {
    private socket: Socket | null = null;
    private chatSocket: Socket | null = null;
    private householdId: string | null = null;
    private token: string | null = null;
    private messageCallbacks: ((msg: any) => void)[] = [];
    private typingCallbacks: ((data: any) => void)[] = [];
    private userJoinedCallbacks: ((data: any) => void)[] = [];

    setAuth(token: string, householdId: string) {
        this.token = token;
        this.householdId = householdId;
        this.initSocket();
    }

    private initSocket() {
        if (this.socket) return;

        this.socket = io({
            query: { token: this.token }
        });

        this.socket.on('connect', () => {
            console.log('Connected to Real-Time Service');
            if (this.householdId) {
                this.socket?.emit('join_household', this.householdId);
            }
        });
    }

    // --- PLANNING API ---
    async generatePlan(date: string, memberIds: string[]) {
        const res = await fetch(`${API_BASE}/plan/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
                'x-household-id': this.householdId || ''
            },
            body: JSON.stringify({ date, memberIds })
        });
        return res.json();
    }

    // --- SERVICE CHAT (Legacy) ---
    sendMessage(text: string, senderName: string) {
        if (!this.socket || !this.householdId) return;
        this.socket.emit('send_message', {
            householdId: this.householdId,
            text,
            senderName,
            timestamp: new Date().toISOString()
        });
    }

    onMessageReceived(callback: (msg: any) => void) {
        this.socket?.on('receive_message', callback);
    }

    // --- MEAL CHAT (New) ---
    connectMealChat(mealId: string, userId: string, userName: string, role: string) {
        if (this.chatSocket) {
            this.chatSocket.disconnect();
        }

        this.chatSocket = io('/chat', {
            query: { token: this.token }
        });

        this.chatSocket.on('connect', () => {
            console.log('Connected to Meal Chat');
            this.chatSocket?.emit('join-meal', { mealId, userId, userName, role });
        });

        this.chatSocket.on('chat-history', (messages: any[]) => {
            console.log('Received chat history:', messages.length, 'messages');
            this.messageCallbacks.forEach(cb => {
                messages.forEach(msg => cb(msg));
            });
        });

        this.chatSocket.on('new-message', (message: any) => {
            console.log('New message:', message);
            this.messageCallbacks.forEach(cb => cb(message));
        });

        this.chatSocket.on('user-joined', (data: any) => {
            console.log('User joined:', data);
            this.userJoinedCallbacks.forEach(cb => cb(data));
        });

        this.chatSocket.on('user-typing', (data: any) => {
            this.typingCallbacks.forEach(cb => cb({ ...data, isTyping: true }));
        });

        this.chatSocket.on('user-stopped-typing', (data: any) => {
            this.typingCallbacks.forEach(cb => cb({ ...data, isTyping: false }));
        });
    }

    sendChatMessage(mealId: string, message: string, userId: string, userName: string, type: string = 'text') {
        if (!this.chatSocket) {
            console.error('Chat socket not connected');
            return;
        }
        this.chatSocket.emit('send-message', { mealId, message, userId, userName, type });
    }

    sendTyping(mealId: string, userId: string, userName: string) {
        if (!this.chatSocket) return;
        this.chatSocket.emit('typing', { mealId, userId, userName });
    }

    stopTyping(mealId: string, userId: string) {
        if (!this.chatSocket) return;
        this.chatSocket.emit('stop-typing', { mealId, userId });
    }

    markMessagesAsRead(mealId: string, userId: string) {
        if (!this.chatSocket) return;
        this.chatSocket.emit('mark-read', { mealId, userId });
    }

    onChatMessage(callback: (msg: any) => void) {
        this.messageCallbacks.push(callback);
    }

    onUserTyping(callback: (data: any) => void) {
        this.typingCallbacks.push(callback);
    }

    onUserJoined(callback: (data: any) => void) {
        this.userJoinedCallbacks.push(callback);
    }

    disconnectMealChat() {
        if (this.chatSocket) {
            this.chatSocket.disconnect();
            this.chatSocket = null;
        }
        this.messageCallbacks = [];
        this.typingCallbacks = [];
        this.userJoinedCallbacks = [];
    }
}

export const backend = new BackendService();

