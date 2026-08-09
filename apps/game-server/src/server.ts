import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@afterlight/protocol';
import { config } from './config';
import { healthRouter } from './routes/health';
import { registerSocketHandlers } from './socket/gateway';

export function createApp() {
  const app = express();
  const httpServer = createServer(app);

  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
      },
    },
  );

  app.use(express.json());
  app.use('/health', healthRouter);

  registerSocketHandlers(io);

  return { app, httpServer, io };
}
