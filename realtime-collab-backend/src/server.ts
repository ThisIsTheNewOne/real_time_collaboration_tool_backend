import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"
import dotenv from "dotenv"
import { setupCollabSocket } from "./sockets/collab"
import { connectDB } from "./config/db"

//Initialize Environment Variables
dotenv.config();

const app = express();
// Create express and HTTP Server
const server = http.createServer(app);

// cors() Allows requests from the frontend localhost:3000
app.use(cors());
// express.json() Parse JSON from HTTP request bodies 
app.use(express.json());

// connect the Database
connectDB();

//configure Socket.io
const io = new Server( server, {
    // allows WebSocket connections only from the frontend
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// defines real-time event handlers  
setupCollabSocket(io);


// define HTTP routes
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

// start the server
// starts the server on the specified port (from .env or default 5000).
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})

