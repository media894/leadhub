import React from 'react';

export default function AnalyticsView({ stats, leads = [] }) {
  const totalLeads = leads.length || stats?.totalLeads || 0;

  // Calculate Date-Based Lead Counts
  const now = new Date();
  
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const todayLeadsCount = leads.filter((l) => {
    const d = new Date(l.createdAt || l.queryTime || Date.now());
    return d >= startOfToday;
  }).length;

  const weekLeadsCount = leads.filter((l) => {
    const d = new Date(l.createdAt || l.queryTime || Date.now());
    return d >= startOfWeek;
  }).length;

  const monthLeadsCount = leads.filter((l) => {
    const d = new Date(l.createdAt || l.queryTime || Date.now());
    return d >= startOfMonth;
  }).length;

  const yearLeadsCount = leads.filter((l) => {
    const d = new Date(l.createdAt || l.queryTime || Date.now());
    return d >= startOfYear;
  }).length;

  // AI Quality Breakdown
  const hotLeads = leads.filter((l) => l.aiClassification === 'Hot' || (l.aiScore && l.aiScore >= 75)).length;
  const warmLeads = leads.filter((l) => l.aiClassification === 'Warm' || (l.aiScore && l.aiScore >= 40 && l.aiScore < 75)).length;
  const coldLeads = leads.filter((l) => l.aiClassification === 'Cold' || (l.aiScore && l.aiScore < 40)).length;

  const hotPct = totalLeads ? Math.round((hotLeads / totalLeads) * 100) : 0;
  const warmPct = totalLeads ? Math.round((warmLeads / totalLeads) * 100) : 0;
  const coldPct = totalLeads ? Math.round((coldLeads / totalLeads) * 100) : 0;

  // Pipeline Status breakdown
  const newLeadsCount = leads.filter((l) => !l.status || l.status === 'New').length;
  const contactedCount = leads.filter((l) => l.status === 'Contacted').length;
  const inProgressCount = leads.filter((l) => l.status === 'In Progress').length;
  const closedCount = leads.filter((l) => l.status === 'Closed').length;

  // Max value for bar scaling
  const maxPeriodCount = Math.max(todayLeadsCount, weekLeadsCount, monthLeadsCount, yearLeadsCount, 1);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* 1. Time-Based Lead Overview Header (Today, Week, Month, Year) */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-100 flex items-center space-x-2 mb-1">
          <span>📅</span>
          <span>Time-Based Lead Analytics</span>
        </h2>
        <p className="text-xs text-slate-400">Track how many IndiaMART leads arrived Today, This Week, This Month, and This Year</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Leads */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 relative overflow-hidden group hover:border-amber-500 transition-all">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Today's Leads</span>
            <span className="text-lg p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">⚡</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-3xl font-black text-slate-100">{todayLeadsCount}</h3>
            <span className="text-xs font-semibold text-amber-300">Received Today</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Inquiries since 12:00 AM</p>
        </div>

        {/* This Week's Leads */}
        <div className="glass-panel p-5 rounded-2xl border border-blue-500/30 relative overflow-hidden group hover:border-blue-500 transition-all">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">This Week</span>
            <span className="text-lg p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">🗓️</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-3xl font-black text-slate-100">{weekLeadsCount}</h3>
            <span className="text-xs font-semibold text-blue-300">This Week</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Last 7 days volume</p>
        </div>

        {/* This Month's Leads */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 relative overflow-hidden group hover:border-emerald-500 transition-all">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">This Month</span>
            <span className="text-lg p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">📆</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-3xl font-black text-slate-100">{monthLeadsCount}</h3>
            <span className="text-xs font-semibold text-emerald-300">This Month</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Current calendar month</p>
        </div>

        {/* This Year's Leads */}
        <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 relative overflow-hidden group hover:border-purple-500 transition-all">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">This Year (2026)</span>
            <span className="text-lg p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">📊</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-3xl font-black text-slate-100">{yearLeadsCount || totalLeads}</h3>
            <span className="text-xs font-semibold text-purple-300">Total Year</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Cumulative yearly total</p>
        </div>
      </div>

      {/* 2. Visual Lead Comparison Bar Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="mb-4">
          <h3 className="text-base font-extrabold text-slate-100 flex items-center space-x-2">
            <span>📊</span>
            <span>Lead Volume Comparison Chart</span>
          </h3>
          <p className="text-xs text-slate-400">Comparing lead counts across different timeframes</p>
        </div>

        <div className="grid grid-cols-4 gap-4 items-end h-44 pt-6 pb-2 px-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          {/* Today Bar */}
          <div className="flex flex-col items-center h-full justify-end group">
            <span className="text-xs font-bold text-amber-400 mb-1">{todayLeadsCount}</span>
            <div
              className="w-full max-w-[60px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-xl transition-all duration-500 shadow-lg shadow-amber-500/20 group-hover:brightness-125"
              style={{ height: `${Math.max((todayLeadsCount / maxPeriodCount) * 100, 12)}%` }}
            />
            <span className="text-xs font-semibold text-slate-300 mt-2">Today</span>
          </div>

          {/* Week Bar */}
          <div className="flex flex-col items-center h-full justify-end group">
            <span className="text-xs font-bold text-blue-400 mb-1">{weekLeadsCount}</span>
            <div
              className="w-full max-w-[60px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl transition-all duration-500 shadow-lg shadow-blue-500/20 group-hover:brightness-125"
              style={{ height: `${Math.max((weekLeadsCount / maxPeriodCount) * 100, 12)}%` }}
            />
            <span className="text-xs font-semibold text-slate-300 mt-2">This Week</span>
          </div>

          {/* Month Bar */}
          <div className="flex flex-col items-center h-full justify-end group">
            <span className="text-xs font-bold text-emerald-400 mb-1">{monthLeadsCount}</span>
            <div
              className="w-full max-w-[60px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl transition-all duration-500 shadow-lg shadow-emerald-500/20 group-hover:brightness-125"
              style={{ height: `${Math.max((monthLeadsCount / maxPeriodCount) * 100, 12)}%` }}
            />
            <span className="text-xs font-semibold text-slate-300 mt-2">This Month</span>
          </div>

          {/* Year Bar */}
          <div className="flex flex-col items-center h-full justify-end group">
            <span className="text-xs font-bold text-purple-400 mb-1">{yearLeadsCount || totalLeads}</span>
            <div
              className="w-full max-w-[60px] bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-xl transition-all duration-500 shadow-lg shadow-purple-500/20 group-hover:brightness-125"
              style={{ height: `${Math.max(((yearLeadsCount || totalLeads) / maxPeriodCount) * 100, 12)}%` }}
            />
            <span className="text-xs font-semibold text-slate-300 mt-2">This Year</span>
          </div>
        </div>
      </div>

      {/* 3. AI Quality Breakdown & Pipeline Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: AI Lead Quality Breakdown */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center space-x-2">
              <span>🎯</span>
              <span>AI Quality Intent Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400">Classified automatically by Google Gemini AI</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around py-4 gap-6">
            {/* SVG Donut Chart */}
            <div className="relative w-44 h-44">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-rose-500 transition-all duration-1000"
                  strokeDasharray={`${hotPct}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-500 transition-all duration-1000"
                  strokeDasharray={`${warmPct}, 100`}
                  strokeDashoffset={`-${hotPct}`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-slate-600 transition-all duration-1000"
                  strokeDasharray={`${coldPct}, 100`}
                  strokeDashoffset={`-${hotPct + warmPct}`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-100">{totalLeads}</span>
                <span className="text-[10px] text-slate-400 font-medium">TOTAL LEADS</span>
              </div>
            </div>

            {/* Legend Stats */}
            <div className="space-y-3 w-full sm:w-auto">
              <div className="flex items-center justify-between sm:justify-start space-x-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-xs font-semibold text-rose-200">🔥 Hot Intent</span>
                </div>
                <span className="text-xs font-bold text-slate-100">{hotLeads} ({hotPct}%)</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start space-x-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-amber-200">⚡ Warm Intent</span>
                </div>
                <span className="text-xs font-bold text-slate-100">{warmLeads} ({warmPct}%)</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start space-x-4 p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500" />
                  <span className="text-xs font-semibold text-slate-300">❄️ Cold Inquiry</span>
                </div>
                <span className="text-xs font-bold text-slate-100">{coldLeads} ({coldPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Funnel Progress: Pipeline Conversion Stage */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center space-x-2">
              <span>📈</span>
              <span>Lead Conversion Stage Funnel</span>
            </h3>
            <p className="text-xs text-slate-400">Progression from raw IndiaMART inquiries to deals closed</p>
          </div>

          <div className="space-y-4 my-auto">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-400 font-bold">1. New Leads Received</span>
                <span className="text-slate-200 font-bold">{newLeadsCount} Leads</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
                  style={{ width: `${totalLeads ? Math.max((newLeadsCount / totalLeads) * 100, 8) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-blue-400 font-bold">2. Outreach Contacted</span>
                <span className="text-slate-200 font-bold">{contactedCount} Leads</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-700"
                  style={{ width: `${totalLeads ? Math.max((contactedCount / totalLeads) * 100, 8) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-purple-400 font-bold">3. Proposal In Negotiation</span>
                <span className="text-slate-200 font-bold">{inProgressCount} Leads</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${totalLeads ? Math.max((inProgressCount / totalLeads) * 100, 8) : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-emerald-400 font-bold">4. Deals Closed (Won)</span>
                <span className="text-slate-200 font-bold">{closedCount} Leads</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                  style={{ width: `${totalLeads ? Math.max((closedCount / totalLeads) * 100, 8) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
