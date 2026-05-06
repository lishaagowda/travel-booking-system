import React, { createContext, useState, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { Compass, LogOut, ShieldCheck, User, Map, Sun, Moon, Heart, Users, Calendar } from 'lucide-react';
import Auth from './Auth';
import Booking from './Booking';
import Admin from './Admin';
import Wishlist from './Wishlist';
import GroupTrip from './GroupTrip';
import MyBookings from './MyBookings';
import './index.css';

export const AuthContext = createContext(null);

const App = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const toggleWishlist = (trip) => {
    setWishlist(prev => {
      const exists = prev.find(t => t.id === trip.id);
      if (exists) {
        return prev.filter(t => t.id !== trip.id);
      } else {
        return [...prev, trip];
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, wishlist, toggleWishlist, darkMode, setDarkMode }}>
      <BrowserRouter>
        <div className={`app-wrapper ${darkMode ? 'dark' : ''}`}>
          <Routes>
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

const MainLayout = () => {
  const { user, logout, wishlist, darkMode, setDarkMode } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout');
    } catch (err) {
      console.error("Logout API failed", err);
    }
    logout();
    navigate('/auth', { state: { logoutMessage: 'Logged out successfully!', type: 'success' } });
  };

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="main-container">
      <aside className="sidebar admin-sidebar">
        <div className="sidebar-header" style={{ marginBottom: '20px' }}>
          <Compass size={32} color="#f59e0b" />
          <span className="logo-text" style={{ color: 'white' }}>Wanderlust</span>
        </div>


        
        <nav className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <Map size={18} /> Book Tours
          </Link>
          <Link to="/wishlist" className={`nav-link ${location.pathname === '/wishlist' ? 'active' : ''}`}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Heart size={18} />
              {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
            </div>
            Wishlist
          </Link>
          <Link to="/my-bookings" className={`nav-link ${location.pathname === '/my-bookings' ? 'active' : ''}`}>
            <Calendar size={18} /> My Bookings
          </Link>
          <Link to="/groups" className={`nav-link ${location.pathname.startsWith('/groups') ? 'active' : ''}`}>
            <Users size={18} /> Group Trips
          </Link>
          <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
            <ShieldCheck size={18} /> Admin Dashboard
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <div className="user-profile">
            <div className="avatar">
              <User size={20} />
            </div>
            <div className="user-info">
              <span className="user-name">{user.name || 'Traveler'}</span>
              <span className="user-email" style={{ fontSize: '0.7rem', opacity: 0.7 }}>{user.email}</span>
            </div>
          </div>
          <button className="logout-btn-separate" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<Booking />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/groups" element={<GroupTrip />} />
          <Route path="/groups/:id" element={<GroupTrip />} />
          <Route path="/groups/:id/join" element={<JoinGroupHandler />} />
          <Route path="/my-bookings" element={<MyBookings />} />
        </Routes>
      </main>
    </div>
  );
};

const JoinGroupHandler = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && id) {
      axios.post(`http://localhost:5000/api/groups/${id}/join`, { user: user.email })
        .then(() => {
          navigate(`/groups/${id}`);
        })
        .catch(err => {
          console.error("Failed to join group", err);
          navigate('/groups');
        });
    } else if (!user) {
      navigate('/auth');
    }
  }, [user, id, navigate]);

  return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}><div className="loader"></div></div>;
};

export default App;
