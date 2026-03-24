import Redis from "ioredis";
import { ENV } from "./env";

export const redis = new Redis({
    host: ENV.REDIS_HOST,
    port: Number(ENV.REDIS_PORT),
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

export const connectRedis = async () => {
    try {
        const status = await redis.ping();
        if (status === 'PONG') {
            console.log('Redis Cache connected successfully');
        }
    } catch (error) {
        console.error('Error connecting to Redis:', error);
    }
}