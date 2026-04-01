# 🎤 Venue ID – AI-Powered Venue Recommendation Platform

Venue ID is a modern web application that uses AI to recommend ideal venues based on event details, location, and audience expectations. The platform integrates real-time venue data from Foursquare and Ticketmaster to provide comprehensive venue recommendations with actionable insights.

---

## 🚀 Features

✅ **AI-Powered Recommendations** – Google Generative AI analyzes event details to suggest ideal venues  
✅ **Real-Time Venue Data** – Integration with Foursquare and Ticketmaster APIs  
✅ **User Authentication** – Secure authentication via Clerk  
✅ **Search History** – Persistent storage of searches with Supabase  
✅ **Share Results** – Generate shareable links for venue recommendations  
✅ **Modern UI** – Responsive, refined design with smooth interactions  
✅ **Advanced Filtering** – Filter by venue type, setting (indoor/outdoor), audience, and more

---

## 🛠️ Tech Stack

### Frontend

| Component          | Technology                      |
| ------------------ | ------------------------------- |
| Framework          | **React 19**                    |
| Build Tool         | **Vite**                        |
| Routing            | **React Router DOM**            |
| Authentication     | **Clerk**                       |
| Database Client    | **Supabase JS**                 |
| Styling            | **CSS3 (custom, no framework)** |
| Linting            | **ESLint**                      |
| Markdown Rendering | **React Markdown**              |

### Backend

| Component     | Technology                        |
| ------------- | --------------------------------- |
| Runtime       | **Node.js**                       |
| Framework     | **Express.js**                    |
| AI/LLM        | **Google Generative AI (Gemini)** |
| Database      | **Supabase (PostgreSQL)**         |
| External APIs | **Foursquare**, **Ticketmaster**  |
| HTTP Client   | **Axios**                         |
| CORS          | **Express CORS Middleware**       |
| Environment   | **.env (dotenv)**                 |

---

## 📍 How It Works

1. **User Input** – Enter event type, location (city/state), date, time, expected audience, and preferences
2. **AI Processing** – Backend sends request to Google Generative AI (Gemini) with event parameters
3. **Venue Discovery** – AI recommends venue types, then system fetches real venue data from external APIs
4. **Results Display** – Frontend shows detailed venue cards with capacity, features, and reasons for recommendation
5. **Data Persistence** – Authenticated users can save searches to Supabase
6. **Share Results** – Generate unique shareable links for collaboration

---

## 📦 Project Structure

```
venue_id/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx           # Main app component
│   │   ├── App.css           # Main styling
│   │   ├── HistoryPage.jsx   # Search history
│   │   ├── SharePage.jsx     # Public share view
│   │   ├── supabase.js       # Supabase client
│   │   └── main.jsx          # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                   # Node.js/Express server
│   ├── server.js             # Main server
│   ├── supabase.js           # Supabase admin client
│   ├── searches.js           # Search endpoints
│   ├── shares.js             # Share link endpoints
│   ├── services/
│   │   ├── foursquare.js     # Foursquare API integration
│   │   └── ticketmaster.js   # Ticketmaster API integration
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **npm** or **yarn**
- Supabase account and API keys
- Clerk project and API keys
- Google Cloud credentials for Generative AI
- Foursquare and Ticketmaster API keys

### Backend Setup

```bash
cd backend
npm install

# Create .env file in backend/ directory
# Add the following environment variables:
# SUPABASE_URL=<your-supabase-url>
# SUPABASE_SERVICE_KEY=<your-supabase-key>
# GOOGLE_API_KEY=<your-google-generative-ai-key>
# FOURSQUARE_API_KEY=<your-foursquare-key>
# TICKETMASTER_API_KEY=<your-ticketmaster-key>
# CLERK_SECRET_KEY=<your-clerk-secret>

npm start
# Server runs on http://localhost:3001
```

### Frontend Setup

```bash
cd client
npm install

# Create .env.local file in client/ directory
# Add the following environment variables:
# VITE_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
# VITE_SUPABASE_URL=<your-supabase-url>
# VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

npm run dev
# Dev server runs on http://localhost:5173
```

---

## 📝 Available Scripts

### Frontend

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

### Backend

```bash
node server.js    # Start the server
```

---

## 🔑 Key Components

### Frontend

- **App.jsx** – Main application with search form and results display
- **HistoryPage.jsx** – Displays user's previous searches (authenticated only)
- **SharePage.jsx** – Public page for shared venue recommendations
- **Clerk Integration** – Sign in, sign up, user profile, and account management
- **Supabase Client** – Real-time database operations

### Backend

- **server.js** – Express server setup, main endpoints
- **searches.js** – Save and retrieve user searches
- **shares.js** – Generate and manage shareable links
- **foursquare.js** – Venue discovery and details
- **ticketmaster.js** – Event venue and capacity information
- **supabase.js** – Database middleware and queries

---

## 🔗 Environmental Variables

### Backend (.env)

```
SUPABASE_URL=<PostgreSQL database URL>
SUPABASE_SERVICE_KEY=<Admin API key>
GOOGLE_API_KEY=<Google Generative AI key>
FOURSQUARE_API_KEY=<Foursquare Places API key>
TICKETMASTER_API_KEY=<Ticketmaster Discovery API key>
CLERK_SECRET_KEY=<Clerk API secret>
```

### Frontend (.env.local)

```
VITE_CLERK_PUBLISHABLE_KEY=<Clerk publishable key>
VITE_SUPABASE_URL=<Supabase project URL>
VITE_SUPABASE_ANON_KEY=<Supabase anon key>
```

---

## 🎨 UI/UX Highlights

- **Modern Design** – Clean, minimalist interface with refined typography
- **Responsive Layout** – Mobile-friendly design with adaptive layouts
- **Smooth Animations** – Curved buttons and subtle transitions for professional feel
- **Dark Mode Support** – Optimized colors for light backgrounds
- **Real-time Feedback** – Toast notifications for user actions
- **Accessible Forms** – Clear labels, proper spacing, and input validation

---

## 📄 License

ISC License – See LICENSE file for details

---

## 🤝 Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

---

**Built with ❤️ using React, Node.js, and Google Generative AI**
