import { createApp } from './server';
import { config } from './config';

const { httpServer } = createApp();

httpServer.listen(config.port, () => {
  console.log(`[server] game server running on port ${config.port}`);
  console.log(`[server] environment: ${config.nodeEnv}`);
  console.log(`[server] CORS origin: ${config.corsOrigin}`);
});
