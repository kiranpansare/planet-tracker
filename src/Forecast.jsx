import { useState } from 'react';
import { Target, TrendingUp, AlertCircle, Zap, Activity, CalendarRange, Filter, ChevronDown, ChevronUp } from 'lucide-react';

export default function Forecast() {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  
  const [aggregation, setAggregation] = useState('Daily'); // Daily, Weekly, Monthly
  
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openReasonIdx, setOpenReasonIdx] = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    setError('');
    setPredictions(null);
    setOpenReasonIdx(null);
    try {
      const res = await fetch('https://ml-backend-gp8o.onrender.com/forecast/range', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start_date: startDate, end_date: endDate }),
      });
      const data = await res.json();
      
      if (data.error) {
         setError(data.error);
      } else {
         const processed = processAggregation(data.data, aggregation);
         setPredictions(processed);
      }
    } catch (err) {
      setError('Could not connect to the Python ML server. Make sure the backend is live at https://ml-backend-gp8o.onrender.com');
    } finally {
      setLoading(false);
    }
  };

  const processAggregation = (data, type) => {
    if (!data || data.length === 0) return [];
    
    if (type === 'Daily') {
      return data.map(d => ({
        label: d.date,
        trend: d.predicted_trend,
        confidence: d.confidence,
        reasons: d.reasons
      }));
    }
    
    // Grouping by Weekly or Monthly
    const groups = {};
    data.forEach(d => {
      const dateObj = new Date(d.date);
      let groupKey = '';
      if (type === 'Monthly') {
         groupKey = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
      } else if (type === 'Weekly') {
         // simple week grouping, could use ISO week
         const firstDayOfYear = new Date(dateObj.getFullYear(), 0, 1);
         const pastDaysOfYear = (dateObj - firstDayOfYear) / 86400000;
         const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
         groupKey = `Week ${weekNum}, ${dateObj.getFullYear()}`;
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(d);
    });
    
    const aggregated = [];
    for (const [key, items] of Object.entries(groups)) {
       let upCount = 0;
       let totalConf = 0;
       items.forEach(i => {
          if (i.predicted_trend === 'UPWARD') upCount++;
          totalConf += i.confidence;
       });
       const avgConf = totalConf / items.length;
       const finalTrend = (upCount >= items.length / 2) ? 'UPWARD' : 'DOWNWARD';
       
       // Just take the reasons from the first day as representative, 
       // or aggregate them (can be complex). Let's use first day's.
       const repReasons = items[0].reasons;
       
       aggregated.push({
         label: key,
         trend: finalTrend,
         confidence: avgConf.toFixed(2),
         reasons: repReasons,
         subText: `${items.length} Days Evaluated (${upCount} Up, ${items.length - upCount} Down)`
       });
    }
    return aggregated;
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.1s', textAlign: 'center', padding: '3rem 2rem' }}>
      <Zap size={48} style={{ color: 'var(--accent-color)', marginBottom: '1rem' }} />
      <h2>Astrological AI Forecaster</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        Predict Crude Oil trends over a specific date range. Extracted features highlight the strongest astrological drivers influencing the AI.
      </p>

      <div className="controls-grid" style={{ maxWidth: '800px', margin: '0 auto 2rem auto', textAlign: 'left' }}>
        <div className="input-group">
          <label className="input-label"><CalendarRange size={14} style={{display:'inline', marginRight:'4px'}}/>Start Date</label>
          <input type="date" className="glass-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label"><CalendarRange size={14} style={{display:'inline', marginRight:'4px'}}/>End Date</label>
          <input type="date" className="glass-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label"><Filter size={14} style={{display:'inline', marginRight:'4px'}}/>Aggregation</label>
          <select className="glass-input" value={aggregation} onChange={(e) => setAggregation(e.target.value)}>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <button className="btn btn-primary" onClick={handlePredict} disabled={loading} style={{ fontSize: '1.25rem', padding: '1rem 3rem', borderRadius: '50px', marginBottom: '3rem' }}>
        <Target size={24} style={{ marginRight: '0.5rem' }} />
        {loading ? 'Consulting Neural Oracle...' : 'Forecast Trend'}
      </button>

      {predictions && !loading && (
        <div className="results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
          {predictions.map((p, idx) => (
             <div key={idx} className="glass-panel" style={{ padding: '1.5rem' }}>
               <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '1.125rem' }}>{p.label}</h3>
               {p.subText && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{p.subText}</p>}
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                 <Activity size={28} color={p.trend === 'UPWARD' ? '#10b981' : '#ef4444'} />
                 <h2 style={{ fontSize: '2rem', color: p.trend === 'UPWARD' ? '#10b981' : '#ef4444', margin: 0 }}>
                   {p.trend}
                 </h2>
               </div>
               <p style={{ margin: '0 0 1rem 0' }}>Confidence: <strong>{p.confidence}%</strong></p>
               
               <div style={{ backgroundColor: 'var(--panel-bg)', borderRadius: '8px', overflow: 'hidden' }}>
                 <button 
                   onClick={() => setOpenReasonIdx(openReasonIdx === idx ? null : idx)} 
                   style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderTop: '1px solid var(--border-color)' }}
                 >
                   <strong style={{ fontSize: '0.875rem' }}>Astrological Reasoning</strong>
                   {openReasonIdx === idx ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                 </button>
                 {openReasonIdx === idx && (
                   <ul style={{ margin: 0, padding: '0 1rem 1rem 2.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                     {p.reasons.map((r, i) => <li key={i} style={{marginBottom: '0.25rem'}}>{r}</li>)}
                   </ul>
                 )}
               </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
