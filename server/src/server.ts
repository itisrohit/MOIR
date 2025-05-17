import 'dotenv/config';
import http from 'http';
import { connectDB } from './config/db';
import { app } from './app';



async function bootstrap(): Promise<void> {
  try {
    await connectDB();
    const server = http.createServer(app);
    const PORT = process.env.PORT || 5000;
    
    server.listen(PORT, () => {
      console.log(`✅ Server running on port http://localhost:${PORT}`);
    });
    
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('💤 HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('🔥 Server initialization failed:', error);
    process.exit(1);
  }
}


bootstrap();