import dotenv from 'dotenv';
import app from './src/app.js';
import {connectDB} from './src/config/database.js';
import logger from './src/utils/logger.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`\nAPI URL: http://localhost:${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/api/health\n`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, closing server gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
