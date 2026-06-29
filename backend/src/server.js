const http = require('http');
const createApp = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const { initializeSocket } = require('./socket/socketManager');
const { startMessageCleanup } = require('./jobs/messageCleanup');

/**
 * Bootstrap the server:
 * 1. Connect to MongoDB
 * 2. Create Express app
 * 3. Create HTTP server
 * 4. Initialize Socket.IO
 * 5. Start message cleanup job
 * 6. Start listening
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create Express application
    const app = createApp();

    // Create HTTP server (required for Socket.IO)
    const server = http.createServer(app);

    // Initialize Socket.IO
    const io = initializeSocket(server);
    app.set('io', io);

    // Start periodic message cleanup job (relay model DB maintenance)
    startMessageCleanup();

    // Start listening
    server.listen(env.PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║          🚀 LakshiChatz Server              ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║  Environment : ${env.NODE_ENV.padEnd(30)}║`);
      console.log(`║  Port        : ${String(env.PORT).padEnd(30)}║`);
      console.log(`║  API         : http://localhost:${env.PORT}/api${' '.repeat(14)}║`);
      console.log(`║  Health      : http://localhost:${env.PORT}/api/health${' '.repeat(7)}║`);
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err.message);
      // Close server & exit process
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err.message);
      // Close server & exit process
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();
