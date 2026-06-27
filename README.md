# LakshiChatz 💬

A production-ready, real-time messaging application inspired by **Instagram Direct Messages** and **WhatsApp**. Built with React Native (frontend) and Node.js/Express/MongoDB (backend).

---

## 🏗️ Architecture

```
LakshiChatz/
├── backend/                    # Node.js + Express + MongoDB + Socket.IO
│   └── src/
│       ├── config/             # DB, CORS, environment configuration
│       ├── controllers/        # Route handlers (thin layer)
│       ├── middleware/          # Auth, error handling, rate limiting, validation
│       ├── models/             # Mongoose schemas (User, Chat, Message)
│       ├── routes/             # Express route definitions
│       ├── services/           # Business logic layer
│       ├── socket/             # Socket.IO manager + event handlers
│       ├── validators/         # Express-validator rule chains
│       ├── constants/          # Shared constants
│       ├── helpers/            # Utility functions
│       ├── utils/              # API response helpers, async handler
│       ├── app.js              # Express app factory
│       └── server.js           # Server entry point
│
└── frontend/                   # React Native
    └── src/
        ├── components/         # 12 reusable UI components
        ├── constants/          # App-wide constants
        ├── hooks/              # Custom hooks (debounce, socket, keyboard, theme)
        ├── navigation/         # React Navigation stacks
        ├── screens/            # 8 screens (Splash, Login, Register, ChatList, Search, ChatRoom, Profile, EditProfile)
        ├── services/           # API + Socket.IO services
        ├── store/              # Zustand state management (4 stores)
        ├── styles/             # Global stylesheets
        ├── theme/              # Design system (colors, typography, spacing)
        └── utils/              # Utility functions
```

---

## ✨ Features

### Authentication
- User registration with username validation (4-25 chars, lowercase, alphanumeric + underscore)
- Login with JWT-based authentication
- Auto-login from stored token on app restart
- bcrypt password hashing (12 rounds)

### Real-Time Messaging
- One-to-one real-time chat via Socket.IO
- Message status tracking: Sent ✓ → Delivered ✓✓ → Read (Blue ✓✓)
- Typing indicators with animated bouncing dots
- Online/offline presence with green indicator dots
- Reconnection recovery (delivers pending messages)

### Chat Features
- Chat list with last message preview, timestamps, and unread badges
- Pull-to-refresh on chat list
- Infinite scroll for message history (paginated)
- Auto-growing message input (up to 5 lines)
- Empty states with beautiful illustrations

### User Management
- User search with debounced partial matching (username + display name)
- Profile viewing (avatar, display name, bio, joined date)
- Profile editing (display name, bio, photo placeholder)

### UI/UX
- Dark mode and light mode (auto-detects system preference)
- Instagram/WhatsApp-inspired design
- Smooth animations (splash screen, typing indicator, skeletons)
- Loading skeletons for chat list and messages
- Consistent color palette with proper contrast

### Security
- JWT authentication on all protected routes
- Helmet security headers
- Rate limiting (general, auth, search)
- Input validation (frontend + backend)
- Password hashing with bcrypt
- CORS configuration
- XSS prevention

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- React Native CLI environment (Android SDK / Xcode)
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start development server
npm run dev
```

The server will start on `http://localhost:5000`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

Use the Expo Go app on your phone, or press `a` for Android emulator, or `i` for iOS simulator.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | 5000 | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/lakshichatz` | MongoDB connection string |
| `JWT_SECRET` | (required) | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiration |
| `CORS_ORIGIN` | `*` | Allowed origins |

---

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/users/profile` | Get own profile |
| GET | `/api/users/profile/:userId` | Get user profile |
| PUT | `/api/users/profile` | Update profile |

### Chats
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/chat/list` | Get chat list |
| GET | `/api/chat/:userId` | Get/create chat with user |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/messages/send` | Send message |
| GET | `/api/messages/history/:userId` | Get message history |

---

## 🔌 Socket Events

| Event | Direction | Description |
|---|---|---|
| `connection` | Client → Server | Establish socket connection |
| `disconnect` | Client → Server | Socket disconnection |
| `message` | Client → Server | Send a new message |
| `newMessage` | Server → Client | Receive a new message |
| `typing` | Bidirectional | Typing indicator |
| `stopTyping` | Bidirectional | Stop typing indicator |
| `messageDelivered` | Client → Server | Acknowledge delivery |
| `messageSeen` | Client → Server | Mark messages as read |
| `messageStatusUpdate` | Server → Client | Message status changed |
| `userOnline` | Server → Client | User came online |
| `userOffline` | Server → Client | User went offline |
| `online` | Server → Client | Initial online users list |

---

## 📱 State Management

Four Zustand stores with clear separation:

| Store | Responsibility |
|---|---|
| `authStore` | User session, JWT, login/register/logout |
| `chatStore` | Chat list, messages, pagination, unread counts |
| `socketStore` | Socket connection, online users, typing indicators |
| `userStore` | Search results, profile viewing/editing |

---

## 🔮 Future-Ready Architecture

The codebase is designed for easy extension:
- **Push Notifications**: Add Firebase Cloud Messaging (notification service slot ready)
- **Image Upload**: Multer configured, Cloudinary integration prepared
- **Voice/Video Calls**: Socket infrastructure supports signaling
- **Group Chat**: Chat model can be extended to support >2 participants
- **Message Reactions**: Message model extensible
- **Block/Report**: User model extensible

---

## 📄 License

MIT
