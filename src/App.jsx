import { useState } from 'react';
import { Download, Calculator, Globe, CalendarRange, MapPin, Lock, User } from 'lucide-react';
import { calculatePlanetaryPositions } from './utils/astronomy';
import { downloadExcel } from './utils/export';
import { Country, State, City } from 'country-state-city';
import Commodities from './Commodities';
import './App.css';

function App() {
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Routing State
  const [activeTab, setActiveTab] = useState('astrology');

  // Dashboard State
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const defaultDateTime = now.toISOString().slice(0, 16);

  const [startDate, setStartDate] = useState(defaultDateTime);
  const [endDate, setEndDate] = useState(defaultDateTime);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const [results, setResults] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const countries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];
  const cities = selectedState ? City.getCitiesOfState(selectedCountry, selectedState) : [];

  const handleLogin = (e) => {
    e.preventDefault();
    const u = username.toLowerCase().trim();
    if ((u === 'kiran' && password === 'astro123') || (u === 'saumya' && password === 'astro123')) {
      setLoginError('');
      setIsLoggedIn(true);
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleCountryChange = (e) => {
    const code = e.target.value;
    setSelectedCountry(code);
    setSelectedState('');
    setSelectedCity('');
    if (code) {
      const c = Country.getCountryByCode(code);
      if (c && c.latitude) {
        setLatitude(parseFloat(c.latitude).toFixed(4));
        setLongitude(parseFloat(c.longitude).toFixed(4));
      }
    }
  };

  const handleStateChange = (e) => {
    const code = e.target.value;
    setSelectedState(code);
    setSelectedCity('');
    if (code) {
      const s = State.getStateByCodeAndCountry(code, selectedCountry);
      if (s && s.latitude) {
        setLatitude(parseFloat(s.latitude).toFixed(4));
        setLongitude(parseFloat(s.longitude).toFixed(4));
      }
    }
  };

  const handleCityChange = (e) => {
    const name = e.target.value;
    setSelectedCity(name);
    if (name) {
      const c = cities.find(city => city.name === name);
      if (c && c.latitude) {
        setLatitude(parseFloat(c.latitude).toFixed(4));
        setLongitude(parseFloat(c.longitude).toFixed(4));
      }
    }
  };

  const handleCalculate = () => {
    if (!startDate || !endDate || !latitude || !longitude) {
      alert('Please fill in all fields (Dates, Latitude, Longitude)');
      return;
    }
    
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const data = calculatePlanetaryPositions(startDate, endDate, parseFloat(latitude), parseFloat(longitude));
        setResults(data);
      } catch (error) {
        console.error('Calculation error:', error);
        alert('An error occurred during calculation. Please check your inputs.');
      }
      setIsCalculating(false);
    }, 50);
  };

  const handleExport = () => {
    downloadExcel(results, 'astrological_positions.xlsx');
  };

  const setLocationByBrowser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(4));
          setLongitude(position.coords.longitude.toFixed(4));
          setSelectedCountry('');
          setSelectedState('');
          setSelectedCity('');
        },
        (error) => alert('Could not get location automatically: ' + error.message)
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <Globe size={48} style={{ color: 'var(--accent-color)', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Omni Tracker Portal</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Sign in to access Astrological and Commodity data.</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group" style={{ textAlign: 'left' }}>
              <label className="input-label"><User size={14} style={{display:'inline', marginRight: '4px'}}/>Username</label>
              <input 
                type="text" 
                className="glass-input" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Enter username"
                required
              />
            </div>
            
            <div className="input-group" style={{ textAlign: 'left' }}>
              <label className="input-label"><Lock size={14} style={{display:'inline', marginRight: '4px'}}/>Password</label>
              <input 
                type="password" 
                className="glass-input" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter password"
                required
              />
            </div>

            {loginError && <p style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{loginError}</p>}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Omni Tracker Suite</h1>
          <p>{activeTab === 'astrology' ? 'Vedic Sidereal calculations for Zodiac Sign, Degree, and Nakshatra.' : 'Live global commodity prices using Alpha Vantage API.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn ${activeTab === 'astrology' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setActiveTab('astrology')}
          >
            Astrology
          </button>
          <button 
            className={`btn ${activeTab === 'commodities' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setActiveTab('commodities')}
          >
            Commodities
          </button>
          <button className="btn btn-secondary" onClick={() => setIsLoggedIn(false)} style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
            Logout
          </button>
        </div>
      </header>

      {activeTab === 'astrology' ? (
        <>
          <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {/* Time Inputs */}
            <div className="controls-grid" style={{ paddingBottom: '0.5rem' }}>
              <div className="input-group">
                <label className="input-label"><CalendarRange size={14} style={{display:'inline', marginRight: '4px'}}/>Start Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="glass-input" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              
              <div className="input-group">
                <label className="input-label"><CalendarRange size={14} style={{display:'inline', marginRight: '4px'}}/>End Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="glass-input" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
            </div>

            {/* Location Dropdowns */}
            <div className="controls-grid" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
              <div className="input-group">
                <label className="input-label"><MapPin size={14} style={{display:'inline', marginRight: '4px'}}/>Country</label>
                <select className="glass-input" value={selectedCountry} onChange={handleCountryChange}>
                  <option value="">Select Country</option>
                  {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label"><MapPin size={14} style={{display:'inline', marginRight: '4px'}}/>State / Province</label>
                <select className="glass-input" value={selectedState} onChange={handleStateChange} disabled={!selectedCountry || states.length === 0}>
                  <option value="">Select State</option>
                  {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label"><MapPin size={14} style={{display:'inline', marginRight: '4px'}}/>City / Region</label>
                <select className="glass-input" value={selectedCity} onChange={handleCityChange} disabled={!selectedState || cities.length === 0}>
                  <option value="">Select City</option>
                  {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Manual Coordinates Override */}
            <div className="controls-grid" style={{ paddingTop: '0.5rem' }}>
              <div className="input-group">
                <label className="input-label"><Globe size={14} style={{display:'inline', marginRight: '4px'}}/>Latitude Override</label>
                <input 
                  type="number" 
                  step="any"
                  placeholder="e.g. 40.7128"
                  className="glass-input" 
                  value={latitude} 
                  onChange={(e) => setLatitude(e.target.value)} 
                />
              </div>

              <div className="input-group">
                <label className="input-label"><Globe size={14} style={{display:'inline', marginRight: '4px'}}/>Longitude Override</label>
                <input 
                  type="number" 
                  step="any"
                  placeholder="e.g. -74.0060"
                  className="glass-input" 
                  value={longitude} 
                  onChange={(e) => setLongitude(e.target.value)} 
                />
              </div>
            </div>

            <div className="action-bar">
              <button className="btn btn-secondary" onClick={setLocationByBrowser}>
                Use Current Location
              </button>
              <button className="btn btn-primary" onClick={handleCalculate} disabled={isCalculating}>
                <Calculator size={18} />
                {isCalculating ? 'Calculating...' : 'Calculate Positions'}
              </button>
            </div>
          </div>

          {results.length > 0 ? (
            <div className="glass-panel results-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="results-header">
                <h2>Calculated Data ({results.length} rows)</h2>
                <button className="btn btn-primary" onClick={handleExport}>
                  <Download size={18} />
                  Export to Excel
                </button>
              </div>
              
              <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ position: 'sticky', top: 0 }}>Date & Time</th>
                      <th style={{ position: 'sticky', top: 0 }}>Planets</th>
                      <th style={{ position: 'sticky', top: 0 }}>Sign</th>
                      <th style={{ position: 'sticky', top: 0 }}>Degree</th>
                      <th style={{ position: 'sticky', top: 0 }}>Naks</th>
                      <th style={{ position: 'sticky', top: 0 }}>Lat</th>
                      <th style={{ position: 'sticky', top: 0 }}>Lon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 100).map((row, i) => (
                      <tr key={i}>
                        <td style={{whiteSpace: 'nowrap'}}>{row.Date}</td>
                        <td style={{fontWeight: 600}}>{row.Planets}</td>
                        <td>{row.Sign}</td>
                        <td>{row.Degree}</td>
                        <td>{row.Naks}</td>
                        <td>{row.Latitude}</td>
                        <td>{row.Longitude}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {results.length > 100 && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Showing first 100 rows. Export to Excel to see all data.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel empty-state animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Globe size={48} />
              <p>Select your location and a specific date/time to see precise planetary sign, degree, and Nakshatra placements.</p>
            </div>
          )}
        </>
      ) : (
        <Commodities />
      )}
    </div>
  );
}

export default App;
