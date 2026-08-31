import React, { useState } from 'react';

const COLUMNS = [
  { id: 'New', label: 'New Leads', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'Contacted', label: 'Contacted', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { id: 'In Progress', label: 'In Progress', color: 'from-purple-500 to-indigo-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { id: 'Closed', label: 'Closed (Won)', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { id: 'Lost', label: 'Lost', color: 'from-slate-600 to-slate-700', bg: 'bg-slate-500/10', border: 'border-slate-500/30' }
];

export default function KanbanBoard({ leads, onUpdateStatus, onToggleStar, onDeleteLead, onOpenAiProposal }) {
  const [draggedLeadId, setDraggedLeadId] = useState(null);

  const getScoreBadge = (score, classification) => {
    if (classification === 'Hot' || score >= 75) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm animate-pulse-glow">🔥 Hot ({score || 85})</span>;
    }
    if (classification === 'Warm' || score >= 40) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">⚡ Warm ({score || 50})</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/40">❄️ Cold ({score || 20})</span>;
  };

  const handleDragStart = (e, leadId) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId && targetStatus) {
      onUpdateStatus(leadId, targetStatus);
    }
    setDraggedLeadId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
      {COLUMNS.map((col) => {
        const columnLeads = leads.filter((l) => (l.status || 'New') === col.id);

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`glass-panel rounded-2xl p-4 flex flex-col min-h-[600px] border ${col.border} transition-all duration-200`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${col.color}`} />
                <h3 className="font-bold text-slate-100 text-sm">{col.label}</h3>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {columnLeads.length}
              </span>
            </div>

            {/* Column Body / Lead Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin pr-1">
              {columnLeads.length === 0 ? (
                <div className="h-32 border-2 border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-slate-500 text-xs italic">
                  Drop leads here
                </div>
              ) : (
                columnLeads.map((lead) => (
                  <div
                    key={lead._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead._id)}
                    className="glass-card rounded-xl p-3.5 cursor-grab active:cursor-grabbing border border-slate-800 hover:border-amber-500/40 group relative"
                  >
                    {/* Top Row: Name + Star + AI Score */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-1.5 overflow-hidden">
                        <button
                          onClick={(e) => onToggleStar(lead._id, e)}
                          className="text-slate-500 hover:text-amber-400 transition-colors focus:outline-none"
                          title="Star Lead"
                        >
                          {lead.starred ? '⭐' : '☆'}
                        </button>
                        <h4 className="font-semibold text-slate-100 text-sm truncate group-hover:text-amber-400 transition-colors">
                          {lead.senderName || 'Anonymous Inquiry'}
                        </h4>
                      </div>
                      {getScoreBadge(lead.aiScore, lead.aiClassification)}
                    </div>

                    {/* Company / Service Query */}
                    {lead.senderCompany && (
                      <p className="text-xs text-amber-400/90 font-medium mb-1 truncate">
                        🏢 {lead.senderCompany}
                      </p>
                    )}

                    <p className="text-xs text-slate-300 line-clamp-2 mb-2 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                      {lead.queryProductName || lead.subject || lead.message || 'No description provided.'}
                    </p>

                    {/* Details Info Pill */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                      <span>📍 {lead.senderCity || lead.senderState || 'India'}</span>
                      <span>📅 {new Date(lead.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                    </div>

                    {/* Bottom Action Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-1">
                      {/* Status Dropdown */}
                      <select
                        value={lead.status || 'New'}
                        onChange={(e) => onUpdateStatus(lead._id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-900 text-xs text-slate-300 border border-slate-700/80 rounded-lg px-1.5 py-1 focus:border-amber-500 focus:outline-none"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center space-x-1">
                        {/* Quick AI Proposal Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAiProposal(lead);
                          }}
                          className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium transition-all shadow-sm flex items-center space-x-1"
                          title="Generate Instant AI Proposal"
                        >
                          <span>✨ AI</span>
                        </button>

                        {/* Direct WhatsApp Button */}
                        {lead.senderMobile && (
                          <a
                            href={`https://wa.me/${lead.senderMobile.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs transition-all"
                            title="Chat on WhatsApp"
                          >
                            💬
                          </a>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={(e) => onDeleteLead(lead._id, e)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs transition-colors"
                          title="Delete Lead"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
