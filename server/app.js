const express = require("express");
const ExpressWs = require("express-ws");
const cors = require("cors");
const PORT = process.env.PORT || 3000;

const app = express();
const wsInstance = ExpressWs(app);

// Middleware
app.use(cors());


/****************************************************
 Twilio Voice Webhooks
****************************************************/

// WebSocket endpoint for call handling
app.ws("/call", (ws, req) => {
    console.log("New WebSocket connection established");
  
    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg);
        console.log("Received message:", data);
        
        // Handle different message types here
        // You can add your conversation relay logic here
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });
  
    ws.on("close", () => {
      console.log("Client disconnected");
    });
});



/****************************************************
 Start Server
****************************************************/
app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
