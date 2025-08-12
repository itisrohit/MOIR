# MOIR Chat

Real-time messaging platform with AI-powered conversation assistance.

## Overview

MOIR is a modern chat application that combines traditional messaging with intelligent AI assistance. Users can chat with friends in real-time while getting help from Mizuki, an AI assistant that provides conversation suggestions, mood responses, and direct answers to keep conversations engaging.

## Key Features

**Real-time Messaging**
- Instant message delivery with Socket.IO
- Typing indicators and read receipts
- Online/offline status tracking
- Friend system with requests

**AI Assistant (Mizuki)**
- Conversation suggestions when chats stall
- Mood-based responses and ice breakers
- Direct question answering in chat
- Per-conversation AI toggle for privacy

**User Management**
- Secure authentication with JWT
- Profile customization with image uploads
- Friend discovery and management
- Message history persistence

## Tech Stack

**Frontend**
- Next.js 14 with TypeScript
- Zustand for state management
- Socket.IO for real-time features
- Tailwind CSS for styling

**Backend**
- Node.js with Express and TypeScript
- MongoDB with Mongoose ODM
- Socket.IO for WebSocket connections
- Cloudinary for image storage

**AI Integration**
- Groq SDK with Llama 3 70B model
- Custom AI personality implementation
- Rate limiting and error handling

## Quick Start

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd MOIR
   
   # Client setup
   cd client && npm install
   
   # Server setup
   cd ../server && npm install
   ```

2. **Environment variables**
   
   Client `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
   NEXT_PUBLIC_GROQ_API_KEY=your_groq_key
   ```
   
   Server `.env`:
   ```
   MONGODB_URI=your_mongodb_url
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. **Run development servers**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

4. **Access the app**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8080

## How It Works

**Getting Started**
1. Register an account or login
2. Add friends by searching usernames
3. Start conversations with accepted friends
4. Toggle AI assistance on/off per chat

**Using Mizuki AI**
- Ask direct questions in any AI-enabled chat
- Get automatic suggestions during conversation lulls
- Receive mood-appropriate responses and ice breakers
- Control AI access per conversation for privacy

**Chat Features**
- Send messages with instant delivery
- See when others are typing
- Track message read status
- Manage your online presence
- Upload and update profile pictures

## Project Structure

```
MOIR/
├── client/                    # Next.js frontend
│   ├── src/app/              # App router pages
│   ├── src/components/       # UI components
│   ├── src/context/          # React contexts
│   ├── src/service/          # API and AI services
│   └── src/store/            # State management
├── server/                   # Node.js backend
│   ├── src/controllers/      # Route handlers
│   ├── src/models/           # Database schemas
│   ├── src/socket/           # WebSocket handlers
│   └── src/middlewares/      # Custom middleware
└── README.md
```

## API Reference

**Authentication**
- `POST /auth/register` - Create account
- `POST /auth/login` - Sign in
- `GET /auth/profile` - Get user data

**Conversations**
- `GET /conversation/chatlist` - List all chats
- `GET /conversation/get/:id` - Get messages
- `POST /conversation/send/:id` - Send message
- `PUT /conversation/toggle-ai/:id` - Enable/disable AI

**Friends**
- `GET /friends/list` - Get friends
- `POST /friends/request` - Send friend request
- `PUT /friends/accept/:id` - Accept request

## Deployment

**Frontend (Vercel recommended)**
1. Connect your GitHub repo to Vercel
2. Set environment variables in dashboard
3. Deploy automatically on push

**Backend (Railway/Render recommended)**
1. Connect repo to hosting platform
2. Configure environment variables
3. Set up MongoDB database connection
4. Deploy with automatic builds

## Security

- JWT tokens for authentication
- Bcrypt password hashing
- Input validation and sanitization
- CORS protection
- Rate limiting on AI requests
- Secure cookie handling


---

Built for seamless communication enhanced by AI assistance.