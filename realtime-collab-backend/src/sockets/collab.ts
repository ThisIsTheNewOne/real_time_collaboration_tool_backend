import { Server, Socket } from "socket.io";
import { redisClient } from "../config/db";

// Define types of clarity 
type DocId = string;
type UserId = string;
type CursorPosition = { x: number; y: number };


export const setupCollabSocket = (io: Server ) => {
    io.on("connection", (socket: Socket) => {
        console.log(`User connected: ${socket.id}`);
      
        // Handle joining a document room
        socket.on("join-documnet", async (docId: DocId) => {

            // Join the room for this document
            socket.join(docId);
            console.log(`User ${socket.id} joined document ${docId}`);

            // Track active users in Redis 
            await redisClient.sAdd(`doc:${docId}:users`, socket.id);

            // Notify others in the room about the new user
            socket.to(docId).emit("user-connected", socket.id);

            // Send current document content to the new user 
            // socket.emit("document-content", initialContent)

            // Handle cursor movement
            socket.on("cursor-move", (cursorPos: CursorPosition) => {
                // Broadcast cursor position to others in the same doc ( excluding sender )
                socket.to(docId).emit("cursor-position", {
                    userId: socket.id,
                    cursorPos,
                });
            });

            // Handle disconnection
            socket.on("disconnect", async () => {
                console.log(`User ${socket.id} disconnected`);
                // Remove user from Redis traking
                await redisClient.sRem(`doc:${docId}:users`, socket.id);
                // Notify others in the room
                socket.to(docId).emit("user-disconnected", socket.id)
            });
        });
    });
};