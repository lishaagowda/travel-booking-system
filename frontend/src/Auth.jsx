import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { AuthContext } from './App';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const successMessage = location.state?.logoutMessage;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await axios.post(`http://localhost:5000${endpoint}`, formData);
      if (isLogin) {
        login(res.data.user);
        navigate('/');
      } else {
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ display: 'flex', minHeight: '100vh' }}>
      <div className="auth-left" style={{ flex: 1, background: 'linear-gradient(135deg, #234b8c 0%, #1e293b 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', color: 'white' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <Compass size={40} color="#f59e0b" />
            <span style={{ fontSize: '2rem', fontWeight: '800' }}>Wanderlust</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '24px' }}>Explore the World with Premium Comfort.</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.8, maxWidth: '500px' }}>Join our community of global travelers and unlock exclusive deals on curated tours.</p>
        </motion.div>
      </div>

      <div className="auth-right" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: '#f8fafc' }}>
        <motion.div 
          className="glass-panel" 
          style={{ maxWidth: '440px', width: '100%', padding: '40px' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '8px' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={{ color: '#64748b', marginBottom: '32px' }}>{isLogin ? 'Login to continue your journey' : 'Start your adventure today'}</p>

          {successMessage && <div className="message success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>{successMessage}</div>}
          {error && <div className="message error" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {!isLogin && (
              <div className="input-group">
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={18} />
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    style={{ paddingLeft: '40px' }} 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}
            <div className="input-group">
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={18} />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  style={{ paddingLeft: '40px' }} 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div className="input-group">
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  style={{ paddingLeft: '40px', paddingRight: '40px' }} 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
              {loading ? <div className="loader" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div> : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', color: '#64748b' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: '#234b8c', fontWeight: '700', marginLeft: '8px', cursor: 'pointer' }}
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
