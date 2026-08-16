# SkillSwap - A Campus Skill-Sharing Marketplace

## Overview

SkillSwap is a campus marketplace where students trade skills using a credit-based system instead of cash. Help someone with calculus homework and earn credits you can spend getting your bike fixed. This lowers the barrier to asking for and offering help, builds community, and gives students a lightweight way to build a portfolio of skills and reviews.

## Features

- **User Profiles**: Students list skills they can offer and skills they're looking for, plus a short bio and availability
- **Credit-Based Exchange**: Users earn credits by helping others and spend credits to request help
- **Skill Matching**: Recommendation algorithm suggests relevant helpers based on requested skills, location, and availability
- **Booking & Scheduling**: Users can request sessions, propose times, and confirm bookings within the app
- **In-App Messaging**: Lightweight chat for coordinating details without sharing personal contact info
- **Ratings & Reviews**: Build trust and accountability across the marketplace

## Technology Stack

### Frontend
- React 18
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- Socket.IO Client for real-time messaging

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Socket.IO for real-time features
- JWT authentication
- bcryptjs for password hashing

## Project Structure

```
SkillSwap-A-Campus-Skill-Sharing-Marketplace/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── Profile.js
│   │   │   ├── Skills.js
│   │   │   ├── Bookings.js
│   │   │   ├── Messages.js
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── backend/
│   ├── database/
│   │   └── db.js
│   ├── models/
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── skills.js
│   │   ├── bookings.js
│   │   ├── messages.js
│   │   └── reviews.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local instance or a cloud service like MongoDB Atlas)
- npm or yarn

### 1. Database Setup

With MongoDB and Mongoose, collections and databases are typically created automatically when the application first connects and saves data, so no initial setup commands are needed.

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```
DATABASE_URL=mongodb://127.0.0.1:27017/skillswap
CLIENT_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/profile` - Get current user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)
- `GET /api/users/:id` - Get public user profile

### Skills
- `GET /api/skills` - Get all skills (with optional filters)
- `GET /api/skills/my-skills` - Get current user's skills (protected)
- `POST /api/skills` - Create a new skill (protected)
- `PUT /api/skills/:id` - Update a skill (protected)
- `DELETE /api/skills/:id` - Delete a skill (protected)
- `GET /api/skills/match/:skillName` - Get skill matches

### Bookings
- `GET /api/bookings` - Get user's bookings (protected)
- `POST /api/bookings` - Create a booking request (protected)
- `PUT /api/bookings/:id/status` - Update booking status (protected)

### Messages
- `GET /api/messages/conversations` - Get user conversations (protected)
- `GET /api/messages/:userId` - Get messages with specific user (protected)
- `POST /api/messages` - Send a message (protected)

### Reviews
- `GET /api/reviews/:userId` - Get reviews for a user
- `POST /api/reviews` - Create a review (protected)

## Database Schema

### Users
- id, email, password_hash, first_name, last_name, bio, campus_location, profile_picture, credit_balance, created_at, updated_at

### Skills
- id, user_id, name, description, category, credits_per_hour, is_offering, created_at, updated_at

### Bookings
- id, requester_id, provider_id, skill_id, proposed_time, duration_minutes, status, credits_transferred, notes, created_at, updated_at

### Messages
- id, sender_id, receiver_id, booking_id, content, is_read, created_at

### Reviews
- id, reviewer_id, reviewee_id, booking_id, rating, comment, created_at

### Credit Transactions
- id, user_id, amount, transaction_type, booking_id, description, created_at

## Development Team

- **Project Proposed by**: Nyasha Chimutapira
- **Team Members**: Ndarama Mark
- **Meeting Time**: Wednesday 18:00hrs

## License

This project is part of CSE 499 course work.
