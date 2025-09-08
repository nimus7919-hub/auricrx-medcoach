export function kmBetween(a:{lat:number;lng:number}, b:{lat:number;lng:number}) {
  const R = 6371;
  const dLat = deg2rad(b.lat - a.lat);
  const dLng = deg2rad(b.lng - a.lng);
  const la1 = deg2rad(a.lat);
  const la2 = deg2rad(b.lat);
  const x = Math.sin(dLat/2)**2 + Math.sin(dLng/2)**2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(x));
}
function deg2rad(d:number){ return d * Math.PI / 180; }
