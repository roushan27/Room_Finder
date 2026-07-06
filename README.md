# Room Finder - A Student Housing Platform

A modern web application built with React + Vite that helps students find rental rooms and property owners list their rooms. Features real-time messaging, booking system, ratings, and interactive maps.

## Features

- 🏠 **Room Listings**: Browse available rooms with photos, pricing, and facilities
- 🗺️ **Location Mapping**: Interactive map view with Leaflet integration
- 💬 **Real-time Chat**: Direct messaging between students and room owners
- 📅 **Booking System**: Request to book rooms with owner confirmation
- ⭐ **Ratings & Reviews**: Students can rate rooms and leave feedback
- 📍 **Location Search**: Find rooms near your college or reference location
- 🔐 **Role-based Access**: Separate dashboards for students and room owners
- 📊 **Owner Analytics**: View booking stats and room ratings
- 🎬 **Room Media**: Upload and view room photos and videos

## Tech Stack

- **Frontend**: React 19 with Vite
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Maps**: Leaflet + React Leaflet
- **Charts**: Recharts
- **Routing**: React Router 7
- **Linting**: Oxlint

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Room_Finder
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Then update `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

Start the dev server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── auth/              # Auth-related components
│   ├── common/            # Shared components (Footer, LogoutButton, etc.)
│   ├── owner/             # Owner dashboard components
│   └── student/           # Student dashboard components
├── context/               # React Context (Auth, Location)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities (Supabase client)
├── pages/                 # Page components
├── utils/                 # Helper functions
└── App.jsx                # Main app component
```

## Key Components

### Authentication
- **AuthContext**: Manages user authentication state and profile
- **Login/Signup**: User authentication pages
- **ProtectedRoute**: Route guard for authenticated users

### Student Features
- **BrowseRooms**: Browse and filter available rooms
- **RoomCard/RoomDetailModal**: Room display and detailed view
- **RoomList**: List view with search and filter
- **RatingForm**: Rate and review rooms
- **ChatPage**: Message room owners

### Owner Features
- **OwnerDashboard**: Main owner panel
- **AddRoomForm**: Add new rooms with photos/videos
- **RoomTable**: Manage listings
- **BookingRequests**: Approve/reject booking requests
- **StatsGraph**: View analytics and ratings

## Database Schema

Key Supabase tables:
- `profiles`: User profile information
- `rooms`: Room listings
- `bookings`: Booking requests
- `messages`: Chat messages
- `ratings`: Room ratings and reviews
- `notifications`: User notifications

## Deployment

The app is configured for Vercel deployment:

```bash
npm run build
vercel deploy
```

See `vercel.json` for deployment configuration.

## Troubleshooting

### Supabase Connection Issues
- Verify `.env` variables are correctly set
- Check Supabase project is active
- Ensure ANON_KEY is properly configured

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`

### Dev Server Not Starting
- Check port 5173 isn't already in use
- Try: `npm run dev -- --port 3000`

## Contributing

1. Create a new branch for features
2. Test thoroughly before committing
3. Follow existing code patterns
4. Test with `npm run build` before submitting

## License

MIT
