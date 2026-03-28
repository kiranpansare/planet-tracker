import { MakeTime, SiderealTime } from 'astronomy-engine';

const time = MakeTime(new Date('1983-04-01T21:30:00Z')); // 1983-04-02 03:00 IST
const lat = 19.0946;
const lon = 74.7384;

const gst = SiderealTime(time); // in hours
const lstDeg = (gst * 15.0 + lon) % 360; // LST in degrees
const lstRad = lstDeg * Math.PI / 180.0;

const e = 23.441884 * Math.PI / 180.0; // Obliquity
const latRad = lat * Math.PI / 180.0;

const y = Math.cos(lstRad);
const x = -Math.sin(lstRad) * Math.cos(e) - Math.tan(latRad) * Math.sin(e);
let asc = Math.atan2(y, x) * 180.0 / Math.PI;
if (asc < 0) asc += 360;

console.log("Tropical Ascendant:", asc);

// Approximate Lahiri Ayanamsa for 1983
const year = time.ut / 365.25 + 2000;
const ayanamsa = 23.85 + (year - 2000) * (50.29 / 3600);
console.log("Ayanamsa:", ayanamsa);

let siderealAsc = asc - ayanamsa;
if (siderealAsc < 0) siderealAsc += 360;

console.log("Sidereal Ascendant:", siderealAsc);

const signs = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"];
console.log("Sign:", signs[Math.floor(siderealAsc/30)], "Degree in Sign:", Math.floor(siderealAsc%30));
