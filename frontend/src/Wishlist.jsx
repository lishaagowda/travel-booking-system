import React, { useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plane, ArrowRight, Star } from 'lucide-react';
import { AuthContext } from './App';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Wishlist = () => {
  const { wishlist, toggleWishlist, user } = useContext(AuthContext);
  const [bookingMessages, setBookingMessages] = useState({});
  const [userBookedTrips, setUserBookedTrips] = useState([]);

  const fetchUserBookings = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/api/bookings`);
      const myBookings = res.data.filter(b => b.user === user.email);
      setUserBookedTrips(myBookings.map(b => b.destination));
    } catch (err) {
      console.error("Failed to fetch user bookings", err);
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, [user]);

  const handleBookNow = async (trip) => {
    if (!user || !user.email) {
      setBookingMessages(prev => ({ ...prev, [trip.id]: { text: 'Please log in to book', type: 'error' } }));
      return;
    }

    const destinationName = trip.from && trip.to ? `${trip.from} to ${trip.to} (${trip.type || 'Trip'})` : (trip.name || 'Unknown Destination');
    
    try {
      await axios.post(`${API_URL}/api/bookings`, {
        user: user.email,
        destination: destinationName,
        date: trip.date || new Date().toISOString().split('T')[0]
      });
      setBookingMessages(prev => ({ ...prev, [trip.id]: { text: 'Booking Confirmed!', type: 'success' } }));
      setUserBookedTrips(prev => [...prev, destinationName]);
      setTimeout(() => {
        setBookingMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[trip.id];
          return newMessages;
        });
      }, 3000);
    } catch (err) {
      console.error(err);
      setBookingMessages(prev => ({ ...prev, [trip.id]: { text: 'Failed to book', type: 'error' } }));
    }
  };

  return (
    <div className="page-container">
      <motion.h1 
        className="page-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        My Wishlist
      </motion.h1>

      {wishlist.length === 0 ? (
        <motion.div 
          className="glass-panel" 
          style={{ padding: '60px', textAlign: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Heart size={64} color="#cbd5e1" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ color: '#64748b' }}>Your wishlist is empty</h2>
          <p style={{ color: '#94a3b8', marginTop: '10px' }}>Start exploring and heart your favorite destinations!</p>
        </motion.div>
      ) : (
        <div className="wishlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {wishlist.map((trip, idx) => {
            const destString = trip.from && trip.to ? `${trip.from} to ${trip.to} (${trip.type || 'Trip'})` : (trip.name || 'Unknown Destination');
            const isAlreadyBooked = userBookedTrips.includes(destString);
            
            return (
              <motion.div 
                key={trip.id} 
                className="glass-panel" 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                style={{ padding: '20px', position: 'relative' }}
              >
                <button 
                  className="wishlist-toggle active" 
                  onClick={() => toggleWishlist(trip)}
                  style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Heart size={18} fill="#ef4444" color="#ef4444" />
                </button>
                <img src={trip.image} alt={trip.to} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>
                  {trip.from && trip.to ? `${trip.from} → ${trip.to}` : (trip.name || 'Explore Trip')}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary-color)' }}>${trip.price}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.9rem', fontWeight: '600' }}>
                    <Star size={16} fill="#f59e0b" /> {trip.rating}
                  </div>
                </div>
                
                {bookingMessages[trip.id] && (
                  <div className={`message ${bookingMessages[trip.id].type}`} style={{ padding: '8px', fontSize: '0.8rem', marginBottom: '10px', textAlign: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                    {bookingMessages[trip.id].text}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleBookNow(trip)} 
                    style={{ flex: 1, background: isAlreadyBooked ? '#10b981' : '' }}
                    disabled={isAlreadyBooked}
                  >
                    <Plane size={16} style={{ marginRight: '8px' }} />
                    {isAlreadyBooked ? 'Booked' : 'Book Now'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
