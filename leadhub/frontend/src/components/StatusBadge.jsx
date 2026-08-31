const styles = {
  New: 'bg-ember/10 text-ember border-ember/20',
  Contacted: 'bg-signal/10 text-signal border-signal/20',
  Converted: 'bg-growth/10 text-growth border-growth/20',
  Lost: 'bg-slate/10 text-slate border-slate/20',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
        styles[status] || styles.Lost
      }`}
    >
      {status}
    </span>
  );
}
