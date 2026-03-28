import { useState } from 'react';
import { Download, Search, Key, CalendarRange, TrendingUp, AlertCircle } from 'lucide-react';
import { downloadExcel } from './utils/export';

const COMMODITIES = [
  { id: 'WTI', name: 'WTI Crude Oil', note: 'Daily, Weekly, Monthly prices available from 1986.', interval: 'daily' },
  { id: 'BRENT', name: 'Brent Crude Oil', note: 'Daily, Weekly, Monthly prices available from 1987.', interval: 'daily' },
  { id: 'NATURAL_GAS', name: 'Natural Gas', note: 'Daily, Weekly, Monthly prices available from 1997.', interval: 'daily' },
  { id: 'COPPER', name: 'Copper', note: 'Monthly prices available from 1990.', interval: 'monthly' },
  { id: 'ALUMINUM', name: 'Aluminum', note: 'Monthly prices available from 1990.', interval: 'monthly' },
  { id: 'GOLD', name: 'Gold (XAU)', note: 'Daily prices (if supported by your API tier).', interval: 'daily' },
  { id: 'SILVER', name: 'Silver (XAG)', note: 'Daily prices (if supported by your API tier).', interval: 'daily' }
];

export default function Commodities() {
  const [apiKey, setApiKey] = useState('');
  const [commodity, setCommodity] = useState('WTI');
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    if (!apiKey) {
      setError('Please enter your Alpha Vantage API Key.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    setData([]);
    setMetadata({});

    const selectedComm = COMMODITIES.find(c => c.id === commodity);

    try {
      const response = await fetch(`https://www.alphavantage.co/query?function=${selectedComm.id}&interval=${selectedComm.interval}&apikey=${apiKey}`);
      const json = await response.json();

      if (json.Information || json.Note) {
        throw new Error(json.Information || json.Note || 'API Rate limit exceeded or invalid key.');
      }
      
      if (!json.data) {
        throw new Error('No data returned from API. Please verify the commodity symbol and your API Key.');
      }

      setMetadata({
        name: json.name || selectedComm.name,
        unit: json.unit || 'USD',
        interval: json.interval || selectedComm.interval
      });

      // Filter by dates
      const filteredData = json.data.filter(item => {
        if (!item.value || item.value === '.') return false;
        // The API returns dates in YYYY-MM-DD
        const entryDate = new Date(item.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return entryDate >= start && entryDate <= end;
      });

      // Sort newest first
      filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setData(filteredData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCommInfo = COMMODITIES.find(c => c.id === commodity);

  return (
    <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="controls-grid" style={{ paddingBottom: '0.5rem' }}>
        <div className="input-group">
          <label className="input-label"><Key size={14} style={{display:'inline', marginRight: '4px'}}/>Alpha Vantage API Key</label>
          <input 
            type="text" 
            className="glass-input" 
            placeholder="e.g. KVJA29..."
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
          />
        </div>

        <div className="input-group">
          <label className="input-label"><TrendingUp size={14} style={{display:'inline', marginRight: '4px'}}/>Commodity</label>
          <select className="glass-input" value={commodity} onChange={(e) => setCommodity(e.target.value)}>
            {COMMODITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label"><CalendarRange size={14} style={{display:'inline', marginRight: '4px'}}/>From Date</label>
          <input 
            type="date" 
            className="glass-input" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
        </div>

        <div className="input-group">
          <label className="input-label"><CalendarRange size={14} style={{display:'inline', marginRight: '4px'}}/>To Date</label>
          <input 
            type="date" 
            className="glass-input" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </div>
      </div>

      <div style={{ padding: '0 1.5rem 1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        <strong>Note for {selectedCommInfo.name}:</strong> {selectedCommInfo.note}
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="action-bar">
        <button className="btn btn-primary" onClick={handleFetch} disabled={isLoading}>
          <Search size={18} />
          {isLoading ? 'Fetching Data...' : 'Get Commodity Prices'}
        </button>
      </div>

      {data.length > 0 && (
        <div className="results-panel animate-fade-in" style={{ animationDelay: '0.2s', borderTop: '1px solid var(--border-color)' }}>
          <div className="results-header">
            <h2>{metadata.name} Prices ({data.length} records)</h2>
            <button className="btn btn-primary" onClick={() => downloadExcel(data, `${selectedCommInfo.id}_prices.xlsx`)}>
              <Download size={18} />
              Export to Excel
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Data Unit: <strong>{metadata.unit}</strong> | Interval: <strong>{metadata.interval}</strong></p>
          
          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ position: 'sticky', top: 0 }}>Date</th>
                  <th style={{ position: 'sticky', top: 0 }}>Price ({metadata.unit})</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    <td>{row.date}</td>
                    <td style={{ fontWeight: 600 }}>{parseFloat(row.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
