import { Body, MakeTime, Ecliptic, GeoVector, SiderealTime } from 'astronomy-engine';

const PLANETS = [
  Body.Sun,
  Body.Moon,
  Body.Mars,
  Body.Mercury,
  Body.Jupiter,
  Body.Venus,
  Body.Saturn,
  'Rahu',
  'Ketu',
  Body.Uranus,
  Body.Neptune,
  Body.Pluto,
];

const ZODIAC_SIGNS = [
  "Ari", "Tau", "Gem", "Can", "Leo", "Vir",
  "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"
];

const NAKSHATRAS = [
  "Ashwi", "Bharn", "Kritt", "Rohin", "Mriga", "Ardra", "Punar", "Pushy", "Ashle",
  "Magha", "PPhal", "UPhal", "Hasta", "Chitr", "Swati", "Visha", "Anura", "Jyesh",
  "Moola", "PAsha", "UAsha", "Srava", "Dhani", "Shata", "PBhad", "UBhad", "Revat"
];

const BODY_ABBR = {
  Sun: "Sun",
  Moon: "Mon",
  Mars: "Mar",
  Mercury: "Mer",
  Jupiter: "Jup",
  Venus: "Ven",
  Saturn: "Sat",
  Uranus: "Ura",
  Neptune: "Nep",
  Pluto: "Plu",
  Rahu: "Rah",
  Ketu: "Ket"
};

function getAyanamsa(daysSinceJ2000) {
  const T = daysSinceJ2000 / 36525.0;
  return 23.853056 + (1.396389 * T) + (0.000308 * T * T);
}

function formatDegree(deg) {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = (((deg - d) * 60 - m) * 60).toFixed(0);
  return `${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'${s.toString().padStart(2, '0')}''`;
}

function getAscendant(time, lat, lon) {
  const gst = SiderealTime(time);
  const lstDeg = (gst * 15.0 + lon) % 360; 
  const lstRad = lstDeg * Math.PI / 180.0;
  
  const e = 23.4392911 * Math.PI / 180.0; 
  const latRad = lat * Math.PI / 180.0;

  const y = Math.cos(lstRad);
  const x = -Math.sin(lstRad) * Math.cos(e) - Math.tan(latRad) * Math.sin(e);
  let asc = Math.atan2(y, x) * 180.0 / Math.PI;
  if (asc < 0) asc += 360;
  
  return asc;
}

export function calculatePlanetaryPositions(startDateStr, endDateStr, lat, lon) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const results = [];
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return results;
  }

  let currentDate = new Date(startDate);
  let isFirstRun = true;
  
  while (currentDate <= endDate || isFirstRun) {
    const time = MakeTime(currentDate);
    const ayanamsa = getAyanamsa(time.ut);
    
    // Nodes calculation
    const T = time.ut / 36525.0; 
    let omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
    omega = omega % 360;
    if (omega < 0) omega += 360;
    const nodes = { Rahu: omega, Ketu: (omega + 180) % 360 };

    // Next time for Retrograde
    const nextDate = new Date(currentDate.getTime() + 60 * 60 * 1000);
    const nextTime = MakeTime(nextDate);

    // Sun long for Combust
    const sunVec = GeoVector(Body.Sun, time, true);
    let sunTropicalLon = Ecliptic(sunVec).elon;
    let sunSiderealLon = sunTropicalLon - ayanamsa;
    if (sunSiderealLon < 0) sunSiderealLon += 360;

    const addRow = (name, abbr, siderealLon, isRetrograde, isCombust) => {
      if (siderealLon < 0) siderealLon += 360;
      siderealLon = siderealLon % 360;
      
      const signIndex = Math.floor(siderealLon / 30);
      const degreeInSign = siderealLon % 30;
      const signLabel = ZODIAC_SIGNS[signIndex];

      const nakshatraIndex = Math.floor(siderealLon / (360 / 27));
      const degreesInNakshatra = siderealLon % (360 / 27);
      const pada = Math.floor(degreesInNakshatra / (360 / 108)) + 1;
      
      // Formatting Nakshatra specifically to match AstroSage style e.g. "Sravan(1)", "Revat(1)", "Ashwi(2)"
      // Mapping name to target image format
      let naksTarget = NAKSHATRAS[nakshatraIndex];
      // special adjustments based on target image:
      if (naksTarget === 'Srava') naksTarget = 'Sravan';
      if (naksTarget === 'Bharn') naksTarget = 'Bharni';
      if (naksTarget === 'Ashle') naksTarget = 'Ashles';
      
      const nakshatraLabel = `${naksTarget}(${pada})`;

      let displayName = abbr;
      if (isCombust) displayName += " C";
      if (isRetrograde) displayName += " (R)";

      results.push({
        Date: currentDate.toLocaleString(),
        Planets: displayName,
        Sign: signLabel,
        Degree: formatDegree(degreeInSign),
        Naks: nakshatraLabel,
        Latitude: lat,
        Longitude: lon
      });
    };

    // 1. ASCENDANT
    let ascTropical = getAscendant(time, lat, lon);
    addRow('Lagna', 'Lag', ascTropical - ayanamsa, false, false);

    // 2. PLANETS & NODES
    PLANETS.forEach(body => {
      if (body === 'Rahu' || body === 'Ketu') {
        addRow(body, BODY_ABBR[body], nodes[body] - ayanamsa, true, false);
      } else {
        let tropicalLon, nextTropicalLon;
        try {
          const vec = GeoVector(body, time, true);
          tropicalLon = Ecliptic(vec).elon;
          
          const nextVec = GeoVector(body, nextTime, true);
          nextTropicalLon = Ecliptic(nextVec).elon;
        } catch (e) {
          return;
        }
        
        let siderealLon = tropicalLon - ayanamsa;
        if (siderealLon < 0) siderealLon += 360;

        let diff = nextTropicalLon - tropicalLon;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        const isRetrograde = diff < 0 && body !== Body.Sun && body !== Body.Moon;

        let sunDiff = Math.abs(siderealLon - sunSiderealLon);
        if (sunDiff > 180) sunDiff = 360 - sunDiff;
        // Approximation for combustion (combust if within 14 degrees)
        const isCombust = sunDiff <= 14 && body !== Body.Sun && body !== Body.Moon && body !== Body.Uranus && body !== Body.Neptune && body !== Body.Pluto && body !== 'Rahu' && body !== 'Ketu';

        addRow(body, BODY_ABBR[body], siderealLon, isRetrograde, isCombust);
      }
    });

    isFirstRun = false;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return results;
}
