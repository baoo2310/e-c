import express from 'express';
import { errorMiddleware } from './middlewares/errorMiddleware';
import authRoutes from './routes/authRoute';
import { ApiError } from './utils/ApiErrors';
import { StatusCodes } from 'http-status-codes';
import { connectProducer } from './services/kafkaService';
import { ENV } from './config/env';
import { connectConsumer } from './config/kafka';
import { connectRedis } from './config/redis';

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);

// Catch-all for 404 (Route not found)
app.use((req, res, next) => {
  next(new ApiError(StatusCodes.NOT_FOUND, 'Route not found'));
});

// GLOBAL ERROR HANDLER (MUST BE LAST)
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectRedis();     
  await connectProducer();  
  await connectConsumer();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();