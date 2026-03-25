import { pool } from '../config/db';
import bcrypt from 'bcrypt';
import { userData } from '../types/user';
import { ApiError, mapDatabaseError } from '../utils/ApiErrors';
import { StatusCodes } from 'http-status-codes';
import { publishEvent } from './kafkaService';
import { USER_EVENTS_TOPIC } from '../config/kafka';
import { redis } from '../config/redis';
import { tokenUtils } from '../utils/tokens';

export const createUser = async (userData: userData) => {
  try {
    // 1. Hash the formatted password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // 2. Prepare the SQL query
    const query = `
    INSERT INTO users (username, email, password, first_name, last_name)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, username, email, first_name, last_name, created_at;
  `;
    const values = [
      userData.username,
      userData.email,
      hashedPassword,
      userData.first_name,
      userData.last_name
    ];

    // 3. Execute and return
    const result = await pool.query(query, values);
    const newUser = result.rows[0];

    await publishEvent(USER_EVENTS_TOPIC, 'USER-REGISTERED', {
      userId: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name,
      timestamp: new Date().toISOString()
    });
    return newUser;
  } catch (error) {
    throw mapDatabaseError(error);
  }

};

export const loginUser = async (loginData: userData) => {
  const { email, password } = loginData;

  // 1. Find the user by email
  const query = `SELECT * FROM users WHERE email = $1`;
  const result = await pool.query(query, [email]);
  const user = result.rows[0];

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  // 2. Compare the provided password with the hashed password in the DB
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const tokens = tokenUtils.generateTokens({ id: user.id });

  await redis.set(`refresh-token:${user.id}`, tokens.refreshToken, 'EX', 7 * 24 * 60 * 60);

  // Remove the password before returning the user object
  delete user.password;

  return { user, ...tokens };
};

export const logoutUser = async (userId: string) => {
  await redis.del(`refresh-token:${userId}`);
}

export const findUserByEmail = async (email: string) => {
  try {
    const query = `
    SELECT id, username, email, password, first_name, last_name, created_at
    FROM users
    WHERE email = $1
    LIMIT 1;
  `;

    const result = await pool.query(query, [email]);
    return result.rows[0];
  } catch (error) {
    throw mapDatabaseError(error);
  }

};

export const getUserProfile = async (userId: string) => {
  try {
    const cacheKey = `user-profile:${userId}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      // console.log(`CACHE HIT: Fetched user ${userId} from Redis`);
      return JSON.parse(cachedData);
    }
    // console.log(`CACHE MISS: Fetching user ${userId} from PostgreSQL`);
    const query = `
    SELECT id, username, email, first_name, last_name, created_at 
    FROM users 
    WHERE id = $1
  `;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }
    const user = result.rows[0];
    // 3. Save to Redis for next time! 
    // 'EX', 3600 means this cache will EXpire in 3600 seconds (1 hour).
    await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600);
    return user;
  } catch (error) {
    throw mapDatabaseError(error);
  }
};

export const refreshUserToken = async (refreshToken: string) => {
  const decoded = tokenUtils.verifyRefreshToken(refreshToken);
  
  // REAL WORLD check: Does this token exist in Redis?
  const savedToken = await redis.get(`refresh-token:${decoded.id}`);
  
  if (!savedToken || savedToken !== refreshToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Token revoked or invalid. Please login again.');
  }

  const tokens = tokenUtils.generateTokens({ id: decoded.id });

  // Rotate: Save the NEW refresh token, overwriting the old one
  await redis.set(`refresh-token:${decoded.id}`, tokens.refreshToken, 'EX', 7 * 24 * 60 * 60);

  return tokens;
};