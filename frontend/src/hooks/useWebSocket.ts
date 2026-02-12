import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

interface UseWebSocketOptions {
  onPriceUpdate?: (data: any) => void;
  onArbitrage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      options.onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      options.onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      options.onError?.(error);
    });

    socket.on('price:update', (data) => {
      options.onPriceUpdate?.(data);
    });

    socket.on('arbitrage:opportunity', (data) => {
      options.onArbitrage?.(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current?.disconnected) {
      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return {
    socket: socketRef.current,
    reconnect,
    disconnect,
  };
}
