// Accord du pluriel des points : « 1 pt » mais « 0 pts » / « 2 pts ».
// Partagé par le récap et le classement final pour éviter les « 1 pts ».
export function formatPoints(value) {
  return `${value} ${Math.abs(value) === 1 ? 'pt' : 'pts'}`;
}
