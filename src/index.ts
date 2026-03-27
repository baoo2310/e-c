import express from 'express';
import { errorMiddleware } from './middlewares/errorMiddleware';
import authRoutes from './routes/authRoute';
import productRoute from './routes/productRoute';
import cartRoutes from './routes/cartRoute';
import { ApiError } from './utils/ApiErrors';
import { StatusCodes } from 'http-status-codes';
import { connectProducer } from './services/kafkaService';
import { connectConsumer } from './config/kafka';
import { connectRedis } from './config/redis';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoute)
app.use('/api/cart', cartRoutes);

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