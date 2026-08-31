export default function StatCard({ label, value, accent = 'signal', sub }) {
  const accents = {
    signal: 'text-signal',
    growth: 'text-growth',
    ember: 'text-ember',
    slate: 'text-slate',
  };
  return (
    <div className="bg-card rounded-xl border border-line shadow-card px-5 py-4">
      <div className="text-xs font-medium text-slate uppercase tracking-wide">{label}</div>
      <div className={`font-display text-3xl font-semibold mt-1.5 ${accents[accent]}`}>{value}</div>
      {sub && <div className="text-xs text-slate mt-1">{sub}</div>}
    </div>
  );
}
