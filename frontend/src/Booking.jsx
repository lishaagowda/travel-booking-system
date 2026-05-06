import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from './App';
import { Search, MapPin, Calendar, Users, Star, ArrowRight, Clock, Heart, Filter, ChevronDown, Thermometer, Wind, Droplets } from 'lucide-react';
import { FEATURED_DESTINATIONS, TRIPS, ALL_LOCATIONS_LIST } from './data';

const Booking = () => {
  const { user, wishlist, toggleWishlist } = useContext(AuthContext);
  
  // Search & Filter State
  const [sourceQuery, setSourceQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [priceRange, setPriceRange] = useState(2000);
  const [selectedTypes, setSelectedTypes] = useState(['Train', 'Bus', 'Flight']);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedDates, setSelectedDates] = useState({});

  // Booking UI State
  const [bookingStatus, setBookingStatus] = useState({}); // { tripId: 'success' | 'error' }
  const [userBookedTrips, setUserBookedTrips] = useState([]);

  // Real-time suggestions state
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [loadingSource, setLoadingSource] = useState(false);
  const [loadingDest, setLoadingDest] = useState(false);

  // Weather & Packing State
  const [weatherData, setWeatherData] = useState({}); // { tripId: { temp, condition } }
  const [expandedPacking, setExpandedPacking] = useState(null);

  const calculateRealisticPrice = (from, to, type) => {
    // Generate a consistent pseudo-random price based on route names
    const hash = (from + to).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = (hash % 500) + 200; // Base between 200 and 700
    const typeMultiplier = type === 'Flight' ? 2.5 : (type === 'Train' ? 1.2 : 0.8);
    return Math.round(basePrice * typeMultiplier);
  };

  const allLocations = useMemo(() => {
    try {
      const locations = new Set();
      (TRIPS || []).forEach(t => {
        if (t?.from) locations.add(t.from);
        if (t?.to) locations.add(t.to);
      });
      (FEATURED_DESTINATIONS || []).forEach(d => {
        if (d?.name) locations.add(d.name);
      });
      (ALL_LOCATIONS_LIST || []).forEach(loc => {
        if (loc) locations.add(loc);
      });
      return Array.from(locations).sort((a, b) => a.localeCompare(b));
    } catch (err) {
      console.error("Error generating locations list", err);
      return [];
    }
  }, []);

  // Debounced search for Source
  useEffect(() => {
    if (!sourceQuery || sourceQuery.length < 3) {
      setSourceSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingSource(true);
      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${sourceQuery}&addressdetails=1&limit=8`);
        const formatted = res.data.map(item => item.display_name);
        setSourceSuggestions(formatted);
      } catch (err) {
        console.error("Source search failed", err);
      } finally {
        setLoadingSource(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [sourceQuery]);

  // Debounced search for Destination
  useEffect(() => {
    if (!destinationQuery || destinationQuery.length < 3) {
      setDestinationSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingDest(true);
      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${destinationQuery}&addressdetails=1&limit=8`);
        const formatted = res.data.map(item => item.display_name);
        setDestinationSuggestions(formatted);
      } catch (err) {
        console.error("Destination search failed", err);
      } finally {
        setLoadingDest(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [destinationQuery]);

  const dynamicTrips = useMemo(() => {
    try {
      return (TRIPS || []).map(t => ({
        ...t,
        price: t.price || calculateRealisticPrice(t.from || '', t.to || '', t.type || '')
      }));
    } catch (err) {
      console.error("Error creating dynamic trips", err);
      return [];
    }
  }, []);

  const filteredTrips = useMemo(() => {
    if (!dynamicTrips) return [];
    
    let results = dynamicTrips.filter(trip => {
      try {
        const matchesSource = (trip.from || '').toLowerCase().includes((sourceQuery || '').toLowerCase());
        const matchesDestination = (trip.to || '').toLowerCase().includes((destinationQuery || '').toLowerCase());
        const matchesType = (selectedTypes || []).includes(trip.type);
        const matchesPrice = (trip.price || 0) <= priceRange;
        const matchesRating = (trip.rating || 0) >= minRating;
        return matchesSource && matchesDestination && matchesType && matchesPrice && matchesRating;
      } catch (e) {
        return false;
      }
    });

    if (sortBy === 'price-low') results.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') results.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') results.sort((a, b) => b.rating - a.rating);

    // If no results found but both fields are entered, generate dynamic options
    if (results.length === 0 && sourceQuery.trim() && destinationQuery.trim()) {
      const transportTypes = ['Train', 'Bus', 'Flight'].filter(t => selectedTypes.includes(t));
      
      const dynamicOptions = transportTypes.map((type, index) => ({
        id: `dynamic-${index}-${sourceQuery}-${destinationQuery}`,
        from: sourceQuery.charAt(0).toUpperCase() + sourceQuery.slice(1),
        to: destinationQuery.charAt(0).toUpperCase() + destinationQuery.slice(1),
        type: type,
        duration: type === 'Flight' ? '2.5' : (type === 'Train' ? '6.0' : '10.0'),
        price: calculateRealisticPrice(sourceQuery, destinationQuery, type),
        rating: (4 + Math.random()).toFixed(1),
        date: new Date().toISOString().split('T')[0],
        image: type === 'Flight' 
          ? 'https://images.unsplash.com/photo-1436491865332-7a61a109c055?w=400'
          : (type === 'Train' 
            ? 'https://images.unsplash.com/photo-1474487059417-981c3ba806e1?w=400'
            : 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400')
      }));
      
      results = dynamicOptions;
    }

    return results;
  }, [sourceQuery, destinationQuery, dynamicTrips, priceRange, selectedTypes, minRating, sortBy]);

  const fetchUserBookings = async () => {
    if (!user) return;
    try {
      const res = await axios.get('http://localhost:5000/api/bookings');
      const myBookings = res.data.filter(b => b.user === user.email);
      setUserBookedTrips(myBookings.map(b => b.destination));
    } catch (err) {
      console.error("Failed to fetch user bookings", err);
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, [user]);

  const fetchWeatherData = async (tripId, cityName) => {
    if (weatherData[tripId]) return;
    try {
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${cityName}&limit=1`);
      if (geoRes.data && geoRes.data[0]) {
        const { lat, lon } = geoRes.data[0];
        const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        setWeatherData(prev => ({
          ...prev,
          [tripId]: {
            temp: Math.round(weatherRes.data.current_weather.temperature),
            condition: 'Partially Cloudy'
          }
        }));
      }
    } catch (err) {
      console.error("Weather fetch failed", err);
    }
  };

  const handleBook = async (trip) => {
    if (!user || !user.email) {
      setBookingStatus({ [trip.id]: 'error' });
      return;
    }
    const destString = trip.from && trip.to ? `${trip.from} to ${trip.to} (${trip.type || 'Trip'})` : (trip.name || 'Unknown Destination');
    const travelDate = selectedDates[trip.id] || trip.date || new Date().toISOString().split('T')[0];
    try {
      await axios.post('http://localhost:5000/api/bookings', {
        user: user.email,
        destination: destString,
        date: travelDate
      });
      setBookingStatus({ [trip.id]: 'success' });
      setUserBookedTrips(prev => [...prev, destString]);
      setTimeout(() => setBookingStatus({}), 3000);
    } catch (err) {
      setBookingStatus({ [trip.id]: 'error' });
      setTimeout(() => setBookingStatus({}), 3000);
    }
  };

  const handlePackingToggle = (trip) => {
    if (expandedPacking === trip.id) {
      setExpandedPacking(null);
    } else {
      setExpandedPacking(trip.id);
      fetchWeatherData(trip.id, trip.to);
    }
  };

  const getPackingList = (trip, weather) => {
    const list = ["Passport/ID", "Phone & Charger", "Travel Insurance"];
    const dest = trip.to.toLowerCase();
    const temp = weather ? weather.temp : 22;

    // Smart logic for Indian domestic trips
    const isDomesticIndia = (trip.from.toLowerCase() === 'bengaluru');
    if (isDomesticIndia) {
      const idx = list.indexOf("Passport/ID");
      if (idx > -1) list[idx] = "Aadhar Card / Driving License";
    }

    if (temp > 25) list.push("Sunscreen", "Cotton Clothes", "Sunglasses");
    else if (temp < 15) list.push("Warm Jacket", "Gloves", "Woolen Socks");
    else list.push("Light Jacket", "Walking Shoes");

    if (dest.includes('paris') || dest.includes('london')) list.push("Umbrella", "Raincoat");
    if (dest.includes('mysuru') || dest.includes('hampi')) list.push("Comfortable Sandal", "Hat");
    if (dest.includes('coorg')) list.push("Leech Socks", "Flashlight");

    return list;
  };

  return (
    <div className="booking-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Explore Your Next Adventure</h1>
        
        {/* Search & Filter Bar */}
        <div className="glass-panel" style={{ marginBottom: '40px', position: 'relative', zIndex: 100 }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            {/* Source Input */}
            <div style={{ position: 'relative', flex: 1 }}>
              <MapPin style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} size={20} />
              <input 
                type="text" 
                placeholder="Source Location" 
                className="search-input-fancy"
                style={{ paddingLeft: '44px' }}
                value={sourceQuery}
                onChange={(e) => {
                  setSourceQuery(e.target.value);
                  setShowSourceSuggestions(true);
                }}
                onFocus={() => setShowSourceSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSourceSuggestions(false), 200)}
              />
              <AnimatePresence>
                {showSourceSuggestions && (sourceQuery.length >= 3) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '8px',
                      padding: '8px',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      background: 'var(--input-bg)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'none'
                    }}
                  >
                    {loadingSource ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div className="loader" style={{ width: '24px', height: '24px', margin: '0 auto 10px' }}></div>
                        Searching global locations...
                      </div>
                    ) : (
                      sourceSuggestions.length > 0 ? sourceSuggestions.map((loc, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setSourceQuery(loc);
                            setShowSourceSuggestions(false);
                          }}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            lineHeight: '1.4'
                          }}
                          className="suggestion-item"
                        >
                          <MapPin size={16} color="var(--primary-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span>{loc}</span>
                        </div>
                      )) : (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                          No global matches found for "{sourceQuery}"
                        </div>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Destination Input */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} size={20} />
              <input 
                type="text" 
                placeholder="Destination Location" 
                className="search-input-fancy"
                style={{ paddingLeft: '44px' }}
                value={destinationQuery}
                onChange={(e) => {
                  setDestinationQuery(e.target.value);
                  setShowDestinationSuggestions(true);
                }}
                onFocus={() => setShowDestinationSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
              />
              <AnimatePresence>
                {showDestinationSuggestions && (destinationQuery.length >= 3) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '8px',
                      padding: '8px',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      background: 'var(--input-bg)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'none'
                    }}
                  >
                    {loadingDest ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div className="loader" style={{ width: '24px', height: '24px', margin: '0 auto 10px' }}></div>
                        Searching global locations...
                      </div>
                    ) : (
                      destinationSuggestions.length > 0 ? destinationSuggestions.map((loc, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setDestinationQuery(loc);
                            setShowDestinationSuggestions(false);
                          }}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            lineHeight: '1.4'
                          }}
                          className="suggestion-item"
                        >
                          <MapPin size={16} color="var(--primary-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span>{loc}</span>
                        </div>
                      )) : (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                          No global matches found for "{destinationQuery}"
                        </div>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button className="btn btn-primary" style={{ padding: '12px 32px' }}>Search</button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Train', 'Bus', 'Flight'].map(type => (
                <button 
                  key={type}
                  onClick={() => setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    background: selectedTypes.includes(type) ? 'var(--primary-color)' : 'transparent',
                    color: selectedTypes.includes(type) ? 'white' : 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Max Price: ${priceRange}</span>
              <input 
                type="range" 
                min="0" 
                max="2000" 
                value={priceRange} 
                onChange={(e) => setPriceRange(e.target.value)} 
                style={{ height: '4px' }}
              />
            </div>

            <select style={{ width: 'auto', fontSize: '0.85rem' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="relevance">Sort by: Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100%, 1fr))', gap: '24px' }}>
          {filteredTrips.length > 0 ? (
            filteredTrips.map((trip, idx) => {
              const isFav = wishlist.find(t => t.id === trip.id);
              const destString = `${trip.from} to ${trip.to} (${trip.type})`;
              const isAlreadyBooked = userBookedTrips.includes(destString);

              return (
                <motion.div 
                  key={trip.id} 
                  className="trip-card-container" 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: idx * 0.05 }} 
                  style={{ position: 'relative' }}
                >
                  <div className="glass-panel trip-card" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <button 
                      className="wishlist-toggle" 
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(trip); }}
                      style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Heart size={20} color={isFav ? "#ef4444" : "#64748b"} fill={isFav ? "#ef4444" : "none"} />
                    </button>
                    
                    <img src={trip.image} alt={trip.to} style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '16px' }} />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{trip.from}</span>
                        <ArrowRight size={16} color="var(--text-secondary)" />
                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{trip.to}</span>
                        <span className="status-badge" style={{ background: 'rgba(35, 75, 140, 0.1)', color: 'var(--primary-color)' }}>{trip.type}</span>
                      </div>
                      
                      {/* Date Selection */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                          <Calendar size={14} /> Select Travel Date
                        </div>
                        <input 
                          type="date" 
                          className="search-input-fancy"
                          style={{ 
                            width: '100%', 
                            height: '40px', 
                            padding: '0 12px', 
                            fontSize: '0.85rem',
                            background: 'var(--input-bg)' 
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          value={selectedDates[trip.id] || trip.date || ''}
                          onChange={(e) => setSelectedDates(prev => ({ ...prev, [trip.id]: e.target.value }))}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {trip.duration}h duration</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {trip.date}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={14} fill="#f59e0b" color="#f59e0b" /> {trip.rating}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '200px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)', marginBottom: '12px' }}>${trip.price}</div>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                         <button 
                          className="btn" 
                          style={{ background: 'var(--input-bg)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', padding: '8px 12px', fontSize: '0.8rem' }}
                          onClick={() => handlePackingToggle(trip)}
                        >
                          {expandedPacking === trip.id ? 'Hide Tips' : 'Packing Tips'}
                        </button>
                        <AnimatePresence>
                          {bookingStatus[trip.id] === 'success' && (
                            <motion.span 
                              initial={{ opacity: 0, x: 10 }} 
                              animate={{ opacity: 1, x: 0 }} 
                              exit={{ opacity: 0 }}
                              style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}
                            >
                              Booking confirmed!
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleBook(trip)} 
                          style={{ padding: '8px 20px', background: isAlreadyBooked ? '#10b981' : '' }}
                          disabled={isAlreadyBooked}
                        >
                          {isAlreadyBooked ? 'Booked' : 'Book Now'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedPacking === trip.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="glass-panel" style={{ marginTop: '12px', padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.4)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div>
                              <h4 style={{ marginBottom: '4px' }}>Smart Packing Assistant</h4>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Based on current weather in {trip.to}</p>
                            </div>
                            {weatherData[trip.id] && (
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                                  <Thermometer size={18} color="#ef4444" /> {weatherData[trip.id].temp}°C
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{weatherData[trip.id].condition}</div>
                              </div>
                            )}
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                            {getPackingList(trip, weatherData[trip.id]).map((item, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-color)' }}></div>
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          ) : (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
              <Filter size={48} color="var(--text-secondary)" style={{ marginBottom: '16px' }} />
              <h3>No trips found matching your criteria</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Booking;
