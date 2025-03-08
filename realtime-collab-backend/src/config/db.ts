import dotenv from "dotenv";
dotenv.config(); 


import { Pool } from 'pg';
import { createClient } from 'redis';


// configure PostSQL Connection Pool
export const pgPool = new Pool( {
    user: process.env.PG_USER, // Databases username
    host: process.env.PG_HOST, // Database host
    database: process.env.PG_DATABASE, // Database name
    password: process.env.PG_PASSWORD, // Database password
    port: Number(process.env.PG_PORT) || 5432, // Default PostgreSQL port
    
})

// Redis is used for presence tracking && caching
export const redisClient = createClient( {
    url: process.env.REDIS_URL  ||  'redis://localhost:6379' // Default Redis URL
});

// Connect the Database
export const connectDB = async () => {
    try {
        await pgPool.connect(); // Connect to PostgreSQL
        await redisClient.connect(); // Connect to Redis 
        console.log('Databases connected');
    } catch (err) {
        console.error('Database connection error:', err);
    }
}