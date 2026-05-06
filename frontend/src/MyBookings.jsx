import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from './App';
import { Calendar, MapPin, Clock, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyBookings = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null); // id of booking being cancelled

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/bookings`);
        const userBookings = res.data.filter(b => b.user === user.email);
        setBookings(userBookings);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch bookings", err);
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user.email]);

  const handleCancel = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/bookings/${id}`);
      setBookings(bookings.filter(b => b.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Failed to cancel booking", err);
    }
  };

  if (loading) return <div className="page-container" style={{display:'flex', justifyContent:'center', marginTop:'100px'}}><div className="loader"></div></div>;

  return (
    <div className="page-container">
      <motion.h1 
        className="page-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        My Bookings
      </motion.h1>

      <div style={{ display: 'grid', gap: '20px' }}>
        {bookings.length > 0 ? bookings.map((booking, idx) => (
          <motion.div 
            key={booking.id} 
            className="glass-panel" 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ background: 'rgba(35, 75, 140, 0.1)', padding: '16px', borderRadius: '16px', color: 'var(--primary-color)' }}>
                <Calendar size={24} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0' }}>{booking.destination}</h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> Booked on {booking.date}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> Round Trip</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {confirmDelete === booking.id ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fef2f2', padding: '4px 10px', borderRadius: '20px', border: '1px solid #fee2e2' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#b91c1c' }}>Cancel?</span>
                  <button onClick={() => handleCancel(booking.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Yes</button>
                  <button onClick={() => setConfirmDelete(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>No</button>
                </div>
              ) : (
                <>
                  <span className={`status-badge ${booking.status.toLowerCase()}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {booking.status === 'Confirmed' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {booking.status}
                  </span>
                  <button 
                    onClick={() => setConfirmDelete(booking.id)}
                    className="btn-icon"
                    style={{ color: '#94a3b8', padding: '8px', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                    title="Cancel Booking"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )) : (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
            <Calendar size={48} color="var(--text-secondary)" style={{ marginBottom: '16px' }} />
            <h3>No bookings yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Your upcoming trips will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
