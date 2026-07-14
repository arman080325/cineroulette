export function SpinningReelBadge() {
  const spokes = [0, 60, 120, 180, 240, 300];

  return (
    <svg viewBox="0 0 100 100" className="w-14 h-14 sm:w-20 sm:h-20 animate-spin-slow opacity-40" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#ffd36a" strokeWidth="2" strokeDasharray="4 6" />
      <circle cx="50" cy="50" r="10" fill="none" stroke="#ffd36a" strokeWidth="2" />
      {spokes.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 50 + 28 * Math.cos(rad);
        const cy = 50 + 28 * Math.sin(rad);
        return <circle key={deg} cx={cx} cy={cy} r="7" fill="none" stroke="#ffd36a" strokeWidth="2" />;
      })}
    </svg>
  );
}