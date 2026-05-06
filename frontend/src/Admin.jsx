import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, DollarSign, Plane, MoreHorizontal, ShieldCheck, Check, Trash2, CheckCircle2, Clock } from 'lucide-react';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [confirmReject, setConfirmReject] = useState(null); // id of booking being rejected
  const [filterStatus, setFilterStatus] = useState('All Bookings');

  useEffect(() => {
    if (!isUnlocked) return;
    
    setLoading(true);
    const fetchData = async () => {
      try {
        const [statsRes, bookingsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/stats'),
          axios.get('http://localhost:5000/api/bookings')
        ]);
        setStats(statsRes.data);
        setBookings(bookingsRes.data);
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isUnlocked]);

  const handleUnlock = () => {
    if (adminEmail === 'admin@admin.com' && adminPassword === 'Admin@123') {
      setIsUnlocked(true);
      setErrorMsg(null);
    } else {
      setErrorMsg('Invalid Admin Credentials');
    }
  };

  const handleConfirm = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/bookings/${id}/confirm`);
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Confirmed' } : b));
    } catch (err) {
      console.error("Failed to confirm booking", err);
    }
  };

  const handleRejectBooking = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/bookings/${id}`);
      setBookings(bookings.filter(b => b.id !== id));
      setStats(prev => ({
        ...prev,
        totalBookings: prev.totalBookings - 1
      }));
      setConfirmReject(null);
    } catch (err) {
      console.error("Failed to delete booking", err);
    }
  };

  if (!isUnlocked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <motion.div 
          className="glass-panel" 
          style={{ padding: '60px', maxWidth: '450px', width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div style={{ background: 'rgba(35, 75, 140, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <ShieldCheck size={40} color="#234b8c" />
          </div>
          <h2 style={{ marginBottom: '12px', color: '#1e293b', fontSize: '1.75rem', fontWeight: '800' }}>Admin Access Required</h2>
          <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Please verify your identity by entering the specific Admin Email ID and Password.
          </p>
          
          {errorMsg && (
            <div className="message error" style={{ padding: '12px', marginBottom: '24px', borderRadius: '12px', fontSize: '0.85rem' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <input 
              type="email" 
              placeholder="Admin Email ID" 
              value={adminEmail} 
              onChange={(e) => setAdminEmail(e.target.value)} 
              className="admin-input"
            />
            <input 
              type="password" 
              placeholder="Admin Password" 
              value={adminPassword} 
              onChange={(e) => setAdminPassword(e.target.value)} 
              onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
              className="admin-input"
            />
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleUnlock}
            style={{ width: '100%', height: '50px', fontSize: '1rem' }}
          >
            Unlock Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}><div className="loader"></div></div>;
  }

  const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
  const pendingCount = bookings.filter(b => b.status === 'Pending').length;
  const successRate = bookings.length > 0 ? ((confirmedCount / bookings.length) * 100).toFixed(1) : 0;

  const filteredBookings = bookings.filter(b => {
    if (filterStatus === 'All Bookings') return true;
    return b.status === filterStatus;
  });

  return (
    <div style={{ background: 'var(--report-bg)', minHeight: '100%', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>Booking Execution Report</h1>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="report-stats-grid">
        <div className="report-stat-card">
          <span className="report-stat-label">Total Bookings</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <Plane size={32} color="var(--primary-color)" />
             <div className="report-stat-value">{bookings.length}</div>
          </div>
        </div>
        <div className="report-stat-card">
          <span className="report-stat-label" style={{ color: '#10b981' }}>Confirmed</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <CheckCircle2 size={32} color="#10b981" />
             <div className="report-stat-value" style={{ color: '#10b981' }}>{confirmedCount}</div>
          </div>
        </div>
        <div className="report-stat-card">
          <span className="report-stat-label" style={{ color: '#f59e0b' }}>Pending</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <Clock size={32} color="#f59e0b" />
             <div className="report-stat-value" style={{ color: '#f59e0b' }}>{pendingCount}</div>
          </div>
        </div>
        <div className="report-stat-card">
          <span className="report-stat-label" style={{ color: 'var(--primary-color)' }}>Success Rate</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <ShieldCheck size={32} color="var(--primary-color)" />
             <div className="report-stat-value" style={{ color: 'var(--primary-color)' }}>{successRate}%</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Filter by Status:</span>
        <select 
          className="admin-input" 
          style={{ width: '220px', padding: '10px 16px', textAlign: 'left' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option>All Bookings</option>
          <option>Confirmed</option>
          <option>Pending</option>
        </select>
      </div>

      <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', marginBottom: '24px' }}>Booking Execution Details</h2>

      <div className="booking-list-report">
        {filteredBookings.length > 0 ? filteredBookings.map((b) => (
          <motion.div 
            key={b.id} 
            className={`booking-item-card ${b.status.toLowerCase()}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '20px' }}>

              <div className="booking-item-title" style={{ fontSize: '1rem' }}>
                <span style={{ fontWeight: '800' }}>{b.user}</span> booked <span style={{ color: 'var(--primary-color)' }}>{b.destination}</span> for {b.date}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <span className={`badge-report ${b.status.toLowerCase()}`} style={{ minWidth: '100px', textAlign: 'center' }}>{b.status}</span>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                {b.status === 'Pending' ? (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleConfirm(b.id)}
                    style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px' }}
                  >
                    Confirm
                  </button>
                ) : (
                  <div style={{ width: '82px' }}></div>
                )}
                
                {confirmReject === b.id ? (
                  <div style={{ display: 'flex', gap: '4px', background: '#fee2e2', padding: '4px', borderRadius: '8px' }}>
                    <button onClick={() => handleRejectBooking(b.id)} className="btn" style={{ background: '#ef4444', color: 'white', padding: '6px 12px', fontSize: '0.75rem' }}>Yes</button>
                    <button onClick={() => setConfirmReject(null)} className="btn" style={{ background: 'white', padding: '6px 12px', fontSize: '0.75rem' }}>No</button>
                  </div>
                ) : (
                  <button 
                    className="btn" 
                    onClick={() => setConfirmReject(b.id)}
                    style={{ padding: '8px 16px', fontSize: '0.8rem', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          </motion.div>

        )) : (
          <div className="report-stat-card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No bookings found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

