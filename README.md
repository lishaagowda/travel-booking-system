# Wanderlust Travel Booking System

Follow these steps to run the project:

## 1. Start the Backend Server
1. Open a terminal.
2. Navigate to the backend folder: `cd backend`
3. Start the server: `npm run dev`
4. Keep this terminal open!

## 2. Start the Frontend Application
1. Open a **second, separate** terminal.
2. Navigate to the frontend folder: `cd frontend`
3. Start the app: `npm run dev`
4. Open the link provided in the terminal (usually `http://localhost:5173`) in your browser.

## 🔑 Login Credentials
### User Account
- **Email**: lishu@gmail.com
- **Password**: Lishu@2004

### Admin Account
- **Email**: admin@admin.com
- **Password**: Admin@123

## 🚀 Deployment

### Frontend (GitHub Pages)
The frontend is automatically deployed to GitHub Pages via GitHub Actions whenever code is pushed to the `main` branch.

- **Build process**: Vite build creates optimized files in `frontend/dist/`
- **Deployment**: GitHub Actions workflow deploys from `frontend/dist` to GitHub Pages
- **URL**: https://lishaagowda.github.io/travel-booking-system

### Backend (Render)
The backend is deployed on Render using the `render.yaml` configuration file.

**Setup Steps:**
1. Go to [https://render.com](https://render.com)
2. Create a new account or sign in
3. Connect your GitHub repository
4. Create a new Web Service
5. Select the repository and branch (main)
6. Render will automatically detect the `render.yaml` file
7. The service will be deployed at: `https://travel-booking-backend.onrender.com`

**Configuration:**
- **Start Command**: `cd backend && npm run start`
- **Environment**: Node.js
- **Region**: Oregon (free tier)

### Environment Variables
The application uses environment variables for API URL configuration:

**Frontend (.env.production):**
```
VITE_API_URL=https://travel-booking-backend.onrender.com
```

**Backend (.env):**
```
NODE_ENV=production
```

## 📁 Project Structure
```
├── backend/               # Express.js API server
│   ├── server.js
│   ├── database/         # JSON data storage
│   └── package.json
├── frontend/             # React + Vite application
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   └── package.json
├── .github/workflows/    # GitHub Actions CI/CD
├── render.yaml           # Render deployment config
└── README.md
```
