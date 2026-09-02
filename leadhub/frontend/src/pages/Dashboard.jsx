import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';
import AddLeadModal from '../components/AddLeadModal';
import UploadExcelModal from '../components/UploadExcelModal';
import KanbanBoard from '../components/KanbanBoard';
import AnalyticsView from '../components/AnalyticsView';
import AiProposalModal from '../components/AiProposalModal';
import useLiveFeed from '../hooks/useLiveFeed';

const FILTER_PILLS = [
  { id: 'All', label: 'All Leads' },
  { id: 'Hot', label: '🔥 Hot' },
  { id: 'Warm', label: '⚡ Warm' },
  { id: 'Cold', label: '❄️ Cold' },
  { id: 'New', label: '+ New' },
];

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('Buy Leads'); // 'Direct Enquiries' or 'Buy Leads'
  const [viewMode, setViewMode] = useState('analytics'); // 'analytics' (default), 'list', or 'kanban'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [busyAction, setBusyAction] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProposalLead, setSelectedProposalLead] = useState(null);
  const [editingNotes, setEditingNotes] = useState({});

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (status !== 'All') params.status = status;
    if (activeTab === 'Buy Leads') params.queryType = 'BL';
    else if (activeTab === 'Direct Enquiries') params.queryType = 'W';
    if (search) params.search = search;

    try {
      const { data } = await api.get('/leads', { params });
      setLeads(data);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, [status, activeTab, search]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/leads/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleSyncNow() {
    setSyncing(true);
    try {
      const { data } = await api.post('/leads/sync');
      alert(`Sync completed! ${data.created || 0} new lead(s) found.`);
      fetchLeads();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'IndiaMART sync failed. Please check your API key in Settings.');
    } finally {
      setSyncing(false);
    }
  }

  const { connected } = useLiveFeed((evt) => {
    if (['new_lead', 'email_sent', 'whatsapp_sent', 'lead_scored'].includes(evt.type)) {
      fetchLeads();
      fetchStats();
    }
  });

  async function updateStatus(id, newStatus) {
    setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, status: newStatus } : l)));
    await api.patch(`/leads/${id}/status`, { status: newStatus });
    fetchStats();
  }

  async function toggleStar(id, e) {
    if (e) e.stopPropagation();
    setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, starred: !l.starred } : l)));
    await api.patch(`/leads/${id}/star`);
  }

  async function deleteLead(id, e) {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    setLeads((prev) => prev.filter((l) => l._id !== id));
    await api.delete(`/leads/${id}`);
    fetchStats();
  }

  async function saveNotes(id) {
    const text = editingNotes[id];
    if (text === undefined) return;
    await api.patch(`/leads/${id}/notes`, { notes: text });
    setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, notes: text } : l)));
  }

  async function action(id, type, e) {
    if (e) e.stopPropagation();
    setBusyAction(`${id}-${type}`);
    try {
      await api.post(`/leads/${id}/${type}`);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusyAction('');
    }
  }

  function exportToCsv() {
    if (leads.length === 0) return;
    const headers = ['Name', 'Company', 'Phone', 'Email', 'City', 'Product', 'Message', 'Type', 'Score', 'Status', 'Date'];
    const rows = leads.map((l) => [
      `"${(l.senderName || '').replace(/"/g, '""')}"`,
      `"${(l.senderCompany || '').replace(/"/g, '""')}"`,
      `"${l.senderMobile || ''}"`,
      `"${l.senderEmail || ''}"`,
      `"${(l.senderCity || '').replace(/"/g, '""')}"`,
      `"${(l.queryProductName || l.productName || '').replace(/"/g, '""')}"`,
      `"${(l.queryMessage || '').replace(/"/g, '""')}"`,
      l.queryType || '',
      l.aiScore ?? '',
      l.status || '',
      l.createdAt ? new Date(l.createdAt).toLocaleString() : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IndiaMART_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function clearAllLeads() {
    if (!window.confirm('Clear all sample demo leads from dashboard?')) return;
    try {
      await api.delete('/leads/clear-all');
      setLeads([]);
      fetchStats();
    } catch (err) {
      alert('Could not clear leads.');
    }
  }

  const directEnquiriesCount = stats?.byType?.find((t) => t._id === 'W')?.count ?? 0;
  const buyLeadsCount = stats?.byType?.filter((t) => ['BL', 'B', 'P', 'BIZ'].includes(t._id))?.reduce((acc, curr) => acc + curr.count, 0) ?? 0;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/30">
      {/* Modals */}
      <AddLeadModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSaved={fetchLeads} />
      <UploadExcelModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onUploaded={fetchLeads} />
      
      {selectedProposalLead && (
        <AiProposalModal
          lead={selectedProposalLead}
          onClose={() => setSelectedProposalLead(null)}
          onActionSuccess={() => {
            fetchLeads();
            fetchStats();
          }}
        />
      )}

      {/* Sidebar */}
      <Sidebar totalLeadsCount={stats?.totalLeads || stats?.total || leads.length} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Glassmorphic Navigation Header */}
        <header className="px-8 py-4 glass-panel border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-20 shadow-xl">
          {/* Top Source Tabs */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('Buy Leads')}
              className={`text-sm font-extrabold pb-1 transition-all relative ${
                activeTab === 'Buy Leads' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Buy Leads <span className="text-xs text-amber-500/90 font-semibold">({buyLeadsCount || leads.length})</span>
              {activeTab === 'Buy Leads' && (
                <span className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-amber-500 rounded-full shadow-sm" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('Direct Enquiries')}
              className={`text-sm font-extrabold pb-1 transition-all relative ${
                activeTab === 'Direct Enquiries' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Direct Enquiries <span className="text-xs text-slate-400 font-normal">({directEnquiriesCount})</span>
              {activeTab === 'Direct Enquiries' && (
                <span className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-amber-500 rounded-full shadow-sm" />
              )}
            </button>
          </div>

          {/* View Mode Switcher: Analytics vs Table */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'analytics'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📈</span>
              <span>Lead Analytics</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'list'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📋</span>
              <span>Lead Table</span>
            </button>
          </div>

          {/* Top Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <span>🔄</span> {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            {leads.length > 0 && (
              <button
                onClick={clearAllLeads}
                title="Clear demo leads"
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>🗑️</span> Clear Demo
              </button>
            )}
            <button
              onClick={() => setShowUploadModal(true)}
              className="glass-card hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>📥</span> Excel Import
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <span>➕</span> Add Lead
            </button>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <div className="px-8 py-6 max-w-7xl w-full mx-auto flex-1 space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            {/* TOTAL */}
            <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-lg flex flex-col justify-between">
              <div className="text-3xl font-extrabold text-slate-100">
                {stats?.totalLeads || stats?.total || leads.length}
              </div>
              <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mt-2">
                TOTAL LEADS
              </div>
            </div>

            {/* HOT */}
            <div className="glass-panel rounded-2xl p-4 border border-rose-500/30 shadow-lg flex flex-col justify-between relative overflow-hidden">
              <div className="text-3xl font-extrabold text-rose-400 flex items-center gap-2">
                {stats?.hot ?? leads.filter((l) => l.aiClassification === 'Hot' || l.aiScore >= 75).length}
              </div>
              <div className="text-[11px] font-bold tracking-wider text-rose-300 uppercase mt-2 flex items-center gap-1">
                <span>🔥</span> HOT INTENT
              </div>
            </div>

            {/* WARM */}
            <div className="glass-panel rounded-2xl p-4 border border-amber-500/30 shadow-lg flex flex-col justify-between">
              <div className="text-3xl font-extrabold text-amber-400">
                {stats?.warm ?? leads.filter((l) => l.aiClassification === 'Warm' || (l.aiScore >= 40 && l.aiScore < 75)).length}
              </div>
              <div className="text-[11px] font-bold tracking-wider text-amber-300 uppercase mt-2 flex items-center gap-1">
                <span>⚡</span> WARM INTENT
              </div>
            </div>

            {/* CONTACTED / CLIENTS */}
            <div className="glass-panel rounded-2xl p-4 border border-blue-500/30 shadow-lg flex flex-col justify-between">
              <div className="text-3xl font-extrabold text-blue-400">
                {stats?.contacted ?? leads.filter((l) => l.status === 'Contacted').length}
              </div>
              <div className="text-[11px] font-bold tracking-wider text-blue-300 uppercase mt-2">
                CONTACTED
              </div>
            </div>

            {/* CLOSED / CONVERTED */}
            <div className="glass-panel rounded-2xl p-4 border border-emerald-500/30 shadow-lg flex flex-col justify-between">
              <div className="text-3xl font-extrabold text-emerald-400">
                {stats?.closed ?? leads.filter((l) => l.status === 'Closed').length}
              </div>
              <div className="text-[11px] font-bold tracking-wider text-emerald-300 uppercase mt-2">
                CLOSED WON
              </div>
            </div>
          </div>

          {/* View Specific Content */}
          {viewMode === 'analytics' ? (
            <AnalyticsView stats={stats} leads={leads} />
          ) : viewMode === 'kanban' ? (
            <KanbanBoard
              leads={leads}
              onUpdateStatus={updateStatus}
              onToggleStar={toggleStar}
              onDeleteLead={deleteLead}
              onOpenAiProposal={(lead) => setSelectedProposalLead(lead)}
            />
          ) : (
            /* Table View with Filters & Search */
            <div className="space-y-4 animate-fade-in">
              {/* Filter Pills & Search */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
                  {FILTER_PILLS.map((pill) => (
                    <button
                      key={pill.id}
                      onClick={() => setStatus(pill.id)}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition-all border shrink-0 ${
                        status === pill.id
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                          : 'glass-card text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <div className="flex-1 md:w-72 relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs">🔍</span>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search lead, company, product..."
                      className="w-full glass-input rounded-xl pl-9 pr-4 py-2 text-xs placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={exportToCsv}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <span>📥</span> Export CSV
                  </button>
                </div>
              </div>

              {/* Main Leads Table */}
              <div className="glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center text-sm font-semibold text-slate-300">Loading lead records...</div>
                ) : leads.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-300 space-y-2">
                    <div className="text-3xl">📋</div>
                    <div className="font-bold text-slate-100 text-sm">No leads found in this view.</div>
                    <div className="text-xs text-slate-400">Click "+ Add Lead" or "Upload Excel" to add inquiries.</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="text-xs text-amber-400 uppercase tracking-wider bg-slate-950/80 border-b border-slate-800">
                          <th className="px-5 py-4 font-extrabold">LEAD DETAILS</th>
                          <th className="px-5 py-4 font-extrabold">PRODUCT / QUERY</th>
                          <th className="px-5 py-4 font-extrabold">LOCATION</th>
                          <th className="px-5 py-4 font-extrabold">AI SCORE</th>
                          <th className="px-5 py-4 font-extrabold">STATUS</th>
                          <th className="px-5 py-4 font-extrabold text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {leads.map((lead) => (
                          <React.Fragment key={lead._id}>
                            <tr
                              onClick={() => setExpanded(expanded === lead._id ? null : lead._id)}
                              className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                            >
                              {/* LEAD Column */}
                              <td className="px-5 py-4 max-w-[290px]">
                                <div className="font-extrabold text-slate-100 text-base group-hover:text-amber-400 transition-colors flex items-center gap-2">
                                  <button
                                    onClick={(e) => toggleStar(lead._id, e)}
                                    className="hover:text-amber-400 text-slate-500 focus:outline-none"
                                  >
                                    {lead.starred ? '⭐' : '☆'}
                                  </button>
                                  <span>{lead.senderName || 'Anonymous Inquiry'}</span>
                                </div>

                                {lead.senderCompany && (
                                  <div className="text-xs text-amber-400/90 font-semibold mt-0.5">
                                    🏢 {lead.senderCompany}
                                  </div>
                                )}

                                <div className="text-xs font-mono text-slate-300 mt-1">
                                  {lead.senderEmail ? (
                                    <span className="text-slate-300 font-semibold">✉️ {lead.senderEmail}</span>
                                  ) : (
                                    <span className="text-rose-400/80 text-[10px]">No Email Provided</span>
                                  )}
                                </div>

                                <div className="text-xs font-mono text-amber-300 font-bold mt-1">
                                  📞 {lead.senderMobile || 'N/A'}
                                </div>
                              </td>

                              {/* PRODUCT / MESSAGE Column */}
                              <td className="px-5 py-4 max-w-[280px]">
                                <div className="font-bold text-slate-100 text-sm">
                                  {lead.queryProductName || lead.productName || 'General Requirement'}
                                </div>
                                <div className="text-xs text-slate-300 font-normal mt-1 line-clamp-2 leading-relaxed bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                                  {lead.queryMessage || lead.subject || 'Requirement details provided.'}
                                </div>
                              </td>

                              {/* LOCATION Column */}
                              <td className="px-5 py-4 text-xs text-slate-300 font-medium">
                                📍 {lead.senderCity ? `${lead.senderCity}, ${lead.senderState || ''}` : lead.senderState || 'India'}
                              </td>

                              {/* AI SCORE Column */}
                              <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                {lead.aiClassification === 'Hot' || lead.aiScore >= 75 ? (
                                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm animate-pulse-glow">
                                    🔥 Hot ({lead.aiScore || 85})
                                  </span>
                                ) : lead.aiClassification === 'Warm' || lead.aiScore >= 40 ? (
                                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    ⚡ Warm ({lead.aiScore || 50})
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/40">
                                    ❄️ Cold ({lead.aiScore || 20})
                                  </span>
                                )}
                              </td>

                              {/* STATUS Column */}
                              <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={lead.status || 'New'}
                                  onChange={(e) => updateStatus(lead._id, e.target.value)}
                                  className="bg-slate-900 text-xs font-bold text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 focus:border-amber-500 focus:outline-none"
                                >
                                  <option value="New">New</option>
                                  <option value="Contacted">Contacted</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Closed">Closed (Won)</option>
                                  <option value="Lost">Lost</option>
                                </select>
                              </td>

                              {/* ACTIONS Column */}
                              <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end space-x-2">
                                  {/* AI Proposal Generator Button */}
                                  <button
                                    onClick={() => setSelectedProposalLead(lead)}
                                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
                                    title="AI Proposal Generator"
                                  >
                                    <span>✨ Proposal</span>
                                  </button>

                                  {/* Quick WhatsApp */}
                                  {lead.senderMobile && (
                                    <a
                                      href={`https://wa.me/${lead.senderMobile.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs transition-all"
                                      title="WhatsApp"
                                    >
                                      💬
                                    </a>
                                  )}

                                  {/* Delete */}
                                  <button
                                    onClick={(e) => deleteLead(lead._id, e)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs transition-colors"
                                    title="Delete"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
