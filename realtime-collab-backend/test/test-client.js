// test/test-client.js
const { io } = require("socket.io-client");

// Store token in a variable for clarity
const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNzcyNDhlOS1lMDQ0LTQ2MjQtODBiNC0yYzYyODQwYzAyMWUiLCJpYXQiOjE3NDIwNTE5NzAsImV4cCI6MTc0MjA1NTU3MH0.riU6SuxgewpdETdc5DRMIpKum_Bqv38xRbt1hUL3Ks4";

const socket = io("http://localhost:5000", {
  transports: ["websocket"] // Force WebSocket-only
});

socket.on("connect", () => {
  console.log("Connected to server!");
  console.log("Attempting to join document...");
  
  // Join document with auth token as second parameter
  socket.emit(
    "join-document", 
    "2a235c5c-1dbd-49f9-b75e-500c5118dd95", 
    authToken
  );
});

// Add these to see responses
socket.on("error", (message) => {
  console.error("Server error:", message);
});

// Listen for text change confirmations
socket.on("text-change", (delta) => {
  console.log("Received text change from server:", delta);
});

// Add a function to send text changes
function sendTextChange(content) {
  console.log("Sending text change:", content);
  socket.emit("text-change", { 
    title: '',
    content: content 
  });
}

// // Wait for connection and document joining before testing changes
// socket.on("document-content", (content) => {
//   console.log("Document loaded:", content);
  
//   // Send a test change after a short delay
//   setTimeout(() => {
//     console.log("Sending test change...");
//     sendTextChange("This is a test edit!");
//   }, 2000);
  
//   // Send another change a bit later
//   setTimeout(() => {
//     console.log("Sending another test change...");
//     sendTextChange("This is a new update and it should work haha");
//   }, 5000);
// });

// Manual testing
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

socket.on("document-content", (content) => {
  console.log("Document loaded:", content);
  
  // Prompt for text changes
  function promptForChanges() {
    rl.question('Enter text to update (or "exit" to quit): ', (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        socket.disconnect();
        return;
      }
      
      sendTextChange(input);
      promptForChanges();
    });
  }
  
  promptForChanges();
});

// Listen for active users updates
socket.on("active-users", (users) => {
  console.log("Active users:", users);
});

// Listen for updates
socket.on("text-update", (delta) => {
  console.log("Received update:", delta);
});

