import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from './App';
import { Users, Plus, Share2, Vote, DollarSign, CheckCircle2, UserPlus, Trash2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const GroupTrip = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (user?.email) fetchGroups();
  }, [user?.email]);

  useEffect(() => {
    if (id) fetchGroupDetails(id);
  }, [id]);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/groups?user=${user?.email}`);
      setGroups(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (groupId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/groups/${groupId}`);
      setActiveGroup(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createGroup = async () => {
    if (!newGroupName || !user?.email) return;
    try {
      const res = await axios.post('http://localhost:5000/api/groups', {
        name: newGroupName,
        creator: user.email
      });
      setGroups(prev => [...prev, res.data]);
      setNewGroupName('');
      navigate(`/groups/${res.data.id}`);
    } catch (err) {
      console.error("Create group failed", err);
    }
  };

  const submitVote = async (category, option) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/groups/${activeGroup.id}/vote`, {
        category,
        option,
        user: user.email
      });
      setActiveGroup(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addExpense = async () => {
    if (!expenseDesc || !expenseAmount) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/groups/${activeGroup.id}/expenses`, {
        description: expenseDesc,
        amount: expenseAmount,
        paidBy: user.email
      });
      setActiveGroup(res.data);
      setExpenseDesc('');
      setExpenseAmount('');
    } catch (err) {
      console.error(err);
    }
  };

  const calculateSplits = () => {
    if (!activeGroup) return [];
    const total = activeGroup.expenses.reduce((sum, e) => sum + e.amount, 0);
    const perPerson = total / activeGroup.members.length;
    
    const balances = {};
    activeGroup.members.forEach(m => balances[m] = -perPerson);
    activeGroup.expenses.forEach(e => balances[e.paidBy] += e.amount);
    
    return Object.entries(balances).map(([email, balance]) => ({
      email,
      balance: balance.toFixed(2)
    }));
  };

  const shareLink = `${window.location.origin}/groups/${activeGroup?.id}/join`;

  if (loading) return <div className="page-container" style={{display:'flex', justifyContent:'center', marginTop:'100px'}}><div className="loader"></div></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Group Trip Planning</h1>

      {!id ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3>Create New Group</h3>
            <input 
              type="text" 
              placeholder="e.g. Summer Goa Trip" 
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <button className="btn btn-primary" onClick={createGroup}><Plus size={18} /> Create Group</button>
          </div>

          {groups.map(group => (
            <motion.div 
              key={group.id} 
              className="glass-panel" 
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate(`/groups/${group.id}`)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Users size={24} color="var(--primary-color)" />
                  <h3 style={{ margin: 0 }}>{group.name}</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{group.members.length} Members</p>
              </div>
              <div style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 600 }}>Open Dashboard →</div>
            </motion.div>
          ))}
        </div>
      ) : activeGroup ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header */}
            <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <button onClick={() => navigate('/groups')} style={{ background:'none', border:'none', color:'var(--primary-color)', cursor:'pointer', marginBottom:'8px' }}>← Back to Groups</button>
                <h2 style={{ margin: 0 }}>{activeGroup.name}</h2>
              </div>
              <button className="btn" onClick={() => setShowShareModal(true)} style={{ background: 'rgba(35, 75, 140, 0.1)', color: 'var(--primary-color)' }}>
                <Share2 size={18} /> Invite Friends
              </button>
            </div>
            {/* Voting Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="glass-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <Vote size={24} color="var(--secondary-color)" />
                  <h3 style={{ margin: 0 }}>Destinations</h3>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {['Paris', 'Tokyo', 'Swiss Alps', 'Dubai', 'Bali'].map(dest => {
                    const categoryVotes = activeGroup.votes?.destinations || {};
                    const votes = categoryVotes[dest]?.length || 0;
                    const hasVoted = categoryVotes[dest]?.includes(user.email);
                    return (
                      <div key={dest} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
                        <span style={{ fontWeight: 600, flex: 1, fontSize: '0.85rem' }}>{dest}</span>
                        <button 
                          className="btn" 
                          onClick={() => submitVote('destinations', dest)}
                          style={{ padding: '4px 12px', background: hasVoted ? 'var(--primary-color)' : 'white', color: hasVoted ? 'white' : 'var(--primary-color)', border: '1px solid var(--primary-color)', fontSize: '0.75rem' }}
                        >
                          {votes} Votes
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <Users size={24} color="var(--primary-color)" />
                  <h3 style={{ margin: 0 }}>Hotels</h3>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {['Hilton Lux', 'Marriott Resort', 'Airbnb Villa', 'Backpacker Hostel'].map(hotel => {
                    const categoryVotes = activeGroup.votes?.hotels || {};
                    const votes = categoryVotes[hotel]?.length || 0;
                    const hasVoted = categoryVotes[hotel]?.includes(user.email);
                    return (
                      <div key={hotel} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
                        <span style={{ fontWeight: 600, flex: 1, fontSize: '0.85rem' }}>{hotel}</span>
                        <button 
                          className="btn" 
                          onClick={() => submitVote('hotels', hotel)}
                          style={{ padding: '4px 12px', background: hasVoted ? 'var(--primary-color)' : 'white', color: hasVoted ? 'white' : 'var(--primary-color)', border: '1px solid var(--primary-color)', fontSize: '0.75rem' }}
                        >
                          {votes} Votes
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="glass-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <DollarSign size={24} color="#10b981" />
                <h3 style={{ margin: 0 }}>Shared Expenses</h3>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input type="text" placeholder="Description" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} style={{ flex: 2 }} />
                <input type="number" placeholder="Amount" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} style={{ flex: 1 }} />
                <button className="btn btn-primary" onClick={addExpense}>Add</button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Paid By</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeGroup.expenses.map(exp => (
                      <tr key={exp.id}>
                        <td>{exp.description}</td>
                        <td style={{ fontSize: '0.8rem' }}>{exp.paidBy}</td>
                        <td style={{ fontWeight: 700 }}>${exp.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="glass-panel">
              <h3 style={{ marginBottom: '20px' }}>Who Owes Whom</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {calculateSplits().map(s => (
                  <div key={s.email} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.email === user.email ? 'You' : s.email}</span>
                    <span style={{ fontWeight: 700, color: s.balance >= 0 ? '#10b981' : '#ef4444' }}>
                      {s.balance >= 0 ? `+ $${s.balance}` : `- $${Math.abs(s.balance)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel">
              <h3 style={{ marginBottom: '20px' }}>Group Members</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeGroup.members.map(m => (
                  <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                      {m[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.9rem' }}>{m}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
                <input 
                  type="email" 
                  placeholder="Friend's Email" 
                  id="add-member-email"
                  style={{ fontSize: '0.8rem', padding: '8px' }} 
                />
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  onClick={async () => {
                    const email = document.getElementById('add-member-email').value;
                    if (!email) return;
                    try {
                      const res = await axios.post(`http://localhost:5000/api/groups/${activeGroup.id}/join`, { user: email });
                      setActiveGroup(res.data);
                      document.getElementById('add-member-email').value = '';
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-panel" style={{ maxWidth: '500px', width: '90%', padding: '32px' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: '16px' }}>Invite Friends</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Share this link with your friends to add them to the group trip!</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" readOnly value={shareLink} style={{ flex: 1, background: 'rgba(0,0,0,0.05)' }} />
                <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(shareLink); alert('Link copied!'); }}>Copy</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupTrip;
