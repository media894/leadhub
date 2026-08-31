const ICONS = {
  new_lead: '🟢',
  email_sent: '✉️',
  whatsapp_sent: '💬',
  lead_scored: '🤖',
  whatsapp_ready: '📲',
  whatsapp_qr: '🔗',
  whatsapp_disconnected: '⚠️',
  error: '⛔',
};

function describe(evt) {
  switch (evt.type) {
    case 'new_lead':
      return `New ${evt.lead?.queryType === 'BL' ? 'Buy Lead' : 'enquiry'} from ${evt.lead?.senderName || 'a buyer'} — ${evt.lead?.productName || ''}`;
    case 'email_sent':
      return 'Proposal email delivered';
    case 'whatsapp_sent':
      return 'WhatsApp greeting delivered';
    case 'lead_scored':
      return `AI scored a lead ${evt.score}/100`;
    case 'whatsapp_ready':
      return `WhatsApp connected (${evt.number})`;
    case 'whatsapp_disconnected':
      return 'WhatsApp session disconnected';
    case 'error':
      return `${evt.context}: ${evt.message}`;
    default:
      return evt.type;
  }
}

export default function ActivityTicker({ events, connected }) {
  const items = events.length
    ? events
    : [{ type: 'new_lead', lead: { queryType: 'BL', senderName: 'Waiting for leads', productName: '' } }];

  const loop = [...items, ...items];

  return (
    <div className="relative flex items-center h-10 bg-ink text-white overflow-hidden border-b border-black/20">
      <div className="flex items-center gap-2 px-4 shrink-0 bg-ink z-10 h-full border-r border-white/10">
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-growth animate-pulseDot' : 'bg-white/20'}`} />
        <span className="text-[11px] uppercase tracking-wider text-white/60 font-medium">
          {connected ? 'Live' : 'Offline'}
        </span>
      </div>
      <div className="flex-1 overflow-hidden whitespace-nowrap">
        <div className="inline-flex animate-ticker">
          {loop.map((evt, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-xs text-white/80 mx-6">
              <span>{ICONS[evt.type] || '•'}</span>
              {describe(evt)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
