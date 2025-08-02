import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import 'dotenv/config';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: 'https://askbitsians.netlify.app/',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const server = createServer(app);
const wss = new WebSocketServer({ server });

const rooms = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');
  let clientRoom = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'join') {
        clientRoom = data.room;
        if (!rooms.has(clientRoom)) {
          rooms.set(clientRoom, new Set());
        }
        rooms.get(clientRoom).add(ws);
      } else if (data.room) {
        if (rooms.has(data.room)) {
          rooms.get(data.room).forEach((client) => {
            if (client !== ws && client.readyState === ws.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (clientRoom && rooms.has(clientRoom)) {
      rooms.get(clientRoom).delete(ws);
      if (rooms.get(clientRoom).size === 0) {
        rooms.delete(clientRoom);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 HTTP/WebSocket server listening on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});
