'use client';

import React, { useState, useTransition } from 'react';
import { fetchDemandAnalyticsAction } from './actions';
import type { DemandOverviewData } from '@/lib/demandAnalytics';
import {
  TrendingUp, Search, Home, Users, MapPin,
  Calendar, RefreshCw, AlertCircle, Sparkles, Filter,
  ShieldAlert, CheckCircle2, ChevronRight, BarChart3, PieChart, Clock
} from 'lucide-react';

interface Props {
  initialData: DemandOverviewData;
  availableLocalities: string[];
}

export default function DemandAnalyticsClient({ initialData, availableLocalities }: Props) {
  const [data, setData] = useState<DemandOverviewData>(initialData);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [selectedLocality, setSelectedLocality] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'flats' | 'flatmates' | 'logs'>('overview');
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (newDays: number, newLoc: string) => {
    setTimeRange(newDays);
    setSelectedLocality(newLoc);
    startTransition(async () => {
      const res = await fetchDemandAnalyticsAction(newDays, newLoc);
      if (res.success && res.data) {
        setData(res.data);
      }
    });
  };

  const maxTimeseriesVal = Math.max(
    ...data.timeseries.map(t => Math.max(t.flatSearches, t.flatmateSearches, t.propertyViews)),
    1
  );

  const maxLocalityCount = Math.max(...data.topLocalities.map(l => l.searchCount), 1);
  const maxBudgetCount = Math.max(...data.budgetBuckets.map(b => b.count), 1);

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Demand Intelligence & Search Analytics</h1>
              <p className="text-xs text-slate-500">Real-time demand telemetry from tenant search queries, filter patterns, and listing views.</p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Locality Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <MapPin className="h-3.5 w-3.5 text-brand-primary" />
            <select
              value={selectedLocality}
              onChange={(e) => handleFilterChange(timeRange, e.target.value)}
              className="bg-transparent font-semibold outline-none cursor-pointer text-slate-800"
            >
              <option value="all">All Pune Localities</option>
              {availableLocalities.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            {[
              { label: '7D', days: 7 },
              { label: '30D', days: 30 },
              { label: '90D', days: 90 },
              { label: 'All Time', days: 0 },
            ].map((t) => (
              <button
                key={t.days}
                type="button"
                onClick={() => handleFilterChange(t.days, selectedLocality)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === t.days
                    ? 'bg-white text-brand-primary shadow-xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleFilterChange(timeRange, selectedLocality)}
            disabled={isPending}
            className="p-2 border rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin text-brand-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Level Metric KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Searches</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600"><Search className="h-4 w-4" /></span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{data.totalSearches.toLocaleString()}</p>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-2">
            <span className="text-blue-600 font-bold">{data.flatSearches} Flats</span>
            <span>•</span>
            <span className="text-purple-600 font-bold">{data.flatmateSearches} Flatmates</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Seeker Budget</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Home className="h-4 w-4" /></span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">₹{data.averageBudget.toLocaleString()}<span className="text-xs font-semibold text-slate-400">/mo</span></p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-2">Based on active filter ranges</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top In-Demand Area</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600"><MapPin className="h-4 w-4" /></span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2 truncate">
            {data.topLocalities[0]?.locality || '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            {data.topLocalities[0] ? `${data.topLocalities[0].searchCount} searches (${data.topLocalities[0].avgBudget ? `₹${data.topLocalities[0].avgBudget.toLocaleString()} avg` : 'high intent'})` : 'No locality searches logged yet'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unmet Demand (0-Matches)</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600"><AlertCircle className="h-4 w-4" /></span>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{data.zeroMatchSearches.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-2">Searches where supply was exhausted</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b flex items-center space-x-1 overflow-x-auto text-xs font-bold">
        {[
          { key: 'overview', label: 'Overview & Search Trends', icon: BarChart3 },
          { key: 'flats', label: 'Flats & Housing Demand', icon: Home },
          { key: 'flatmates', label: 'Flatmate Compatibility Matrix', icon: Users },
          { key: 'logs', label: 'Live Search Telemetry Feed', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-brand-primary text-brand-primary bg-brand-primary/5 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & TRENDS */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Daily Activity Timeseries Chart */}
          <div className="bg-white p-6 rounded-2xl border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-primary" />
                  Search & Engagement Velocity
                </h3>
                <p className="text-xs text-slate-500">Daily search inquiries and property listing impression trends.</p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-semibold">
                <div className="flex items-center space-x-1.5 text-blue-600">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span>Flats</span>
                </div>
                <div className="flex items-center space-x-1.5 text-purple-600">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span>Flatmates</span>
                </div>
                <div className="flex items-center space-x-1.5 text-emerald-600">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span>Property Views</span>
                </div>
              </div>
            </div>

            {/* Custom Interactive SVG / Bar Trend Graph */}
            {data.timeseries.length > 0 ? (
              <div className="space-y-2 pt-4">
                <div className="h-44 w-full flex items-end gap-2 sm:gap-4 px-2">
                  {data.timeseries.map((pt) => {
                    const flatH = (pt.flatSearches / maxTimeseriesVal) * 100;
                    const flatmateH = (pt.flatmateSearches / maxTimeseriesVal) * 100;
                    const viewH = (pt.propertyViews / maxTimeseriesVal) * 100;
                    return (
                      <div key={pt.date} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-12 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                          {pt.date}: {pt.flatSearches} Flats, {pt.flatmateSearches} Flatmates, {pt.propertyViews} Views
                        </div>

                        {/* Stacked / Grouped Bars */}
                        <div className="w-full flex items-end justify-center space-x-0.5 h-full">
                          <div
                            style={{ height: `${Math.max(4, flatH)}%` }}
                            className="w-1/3 bg-blue-500 hover:bg-blue-600 rounded-t transition-all"
                          />
                          <div
                            style={{ height: `${Math.max(4, flatmateH)}%` }}
                            className="w-1/3 bg-purple-500 hover:bg-purple-600 rounded-t transition-all"
                          />
                          <div
                            style={{ height: `${Math.max(4, viewH)}%` }}
                            className="w-1/3 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all"
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 truncate max-w-[36px]">{pt.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No timeseries telemetry data recorded yet for the selected period.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Demanded Localities Leaderboard */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-brand-primary" />
                Locality Demand Ranking (Searches & Budgets)
              </h3>
              <div className="space-y-3">
                {data.topLocalities.map((loc, idx) => {
                  const widthPct = Math.round((loc.searchCount / maxLocalityCount) * 100);
                  return (
                    <div key={loc.locality} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                          {loc.locality}
                        </span>
                        <div className="flex items-center space-x-3 text-[11px]">
                          <span className="font-bold text-slate-700">{loc.searchCount} searches</span>
                          <span className="text-brand-primary font-bold">₹{loc.avgBudget.toLocaleString()} avg</span>
                          {loc.zeroMatchCount > 0 && (
                            <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold text-[9px]">
                              {loc.zeroMatchCount} shortage
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, widthPct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {data.topLocalities.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">No locality data available yet.</div>
                )}
              </div>
            </div>

            {/* Supply vs Demand Shortage Watchlist */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center text-rose-700">
                <ShieldAlert className="mr-2 h-4 w-4 text-rose-600" />
                Supply Shortage Watchlist
              </h3>
              <p className="text-xs text-slate-500">
                Areas where prospective tenants search frequently but encounter zero active matches. Onboard owners here first!
              </p>
              <div className="divide-y space-y-2">
                {data.supplyGaps.map((gap) => (
                  <div key={gap.locality} className="pt-2 first:pt-0 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{gap.locality}</span>
                      <span className="text-[10px] text-slate-400">
                        {gap.searchVolume} searches total
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 text-xs font-extrabold px-2 py-0.5 rounded-lg">
                        {gap.zeroResultsCount} zero-results ({gap.gapScore}%)
                      </span>
                    </div>
                  </div>
                ))}
                {data.supplyGaps.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No severe supply-demand gaps detected currently.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FLATS HOUSING DEMAND */}
      {activeTab === 'flats' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BHK Demand Breakdown */}
            <div className="bg-white p-6 rounded-2xl border shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                <Home className="mr-2 h-4 w-4 text-brand-primary" />
                BHK Configuration Preferences
              </h3>
              <p className="text-xs text-slate-500">Distribution of room layouts searched by tenants.</p>
              <div className="space-y-3 pt-2">
                {data.bhkDistribution.map((b) => (
                  <div key={b.bhk} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800">{b.bhk}</span>
                      <span className="text-brand-primary">{b.percentage}% ({b.count} searches)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, b.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Budget Brackets */}
            <div className="bg-white p-6 rounded-2xl border shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                <BarChart3 className="mr-2 h-4 w-4 text-brand-primary" />
                Price Budget Histogram
              </h3>
              <p className="text-xs text-slate-500">Rent willingness brackets across Pune search queries.</p>
              <div className="space-y-3 pt-2">
                {data.budgetBuckets.map((b) => {
                  const widthPct = Math.round((b.count / maxBudgetCount) * 100);
                  return (
                    <div key={b.range} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800">{b.range}</span>
                        <span className="text-emerald-700">{b.percentage}% ({b.count})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, widthPct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Amenity & Feature Filter Demand */}
          <div className="bg-white p-6 rounded-2xl border shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <Sparkles className="mr-2 h-4 w-4 text-brand-primary" />
              Applied Feature & Policy Filter Demand
            </h3>
            <p className="text-xs text-slate-500">Percentage of prospective tenants filtering explicitly for these property features:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
              {[
                { label: 'Zero Brokerage', pct: data.filterDemand.zeroBrokerage, color: 'emerald' },
                { label: 'Pets Allowed', pct: data.filterDemand.petAllowed, color: 'blue' },
                { label: 'Parking Attached', pct: data.filterDemand.parking, color: 'indigo' },
                { label: 'Power Backup', pct: data.filterDemand.powerBackup, color: 'amber' },
                { label: 'EV Charging', pct: data.filterDemand.evCharging, color: 'teal' },
                { label: 'Fiber Internet', pct: data.filterDemand.fiberAvailable, color: 'sky' },
                { label: 'Verified Only', pct: data.filterDemand.verifiedOnly, color: 'purple' },
              ].map((f) => (
                <div key={f.label} className="p-4 bg-slate-50 border rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">{f.label}</span>
                  <span className="text-xl font-black text-slate-900 block">{f.pct}%</span>
                  <span className="text-[9px] text-slate-400 block font-medium">of searches</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FLATMATE COMPATIBILITY MATRIX */}
      {activeTab === 'flatmates' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Shifts & User Types */}
            <div className="bg-white p-6 rounded-2xl border shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                <Clock className="mr-2 h-4 w-4 text-brand-primary" />
                Work Shifts & Profile Types
              </h3>
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shift Demand:</span>
                {data.lifestyleDemand.shifts.map((s) => (
                  <div key={s.label} className="flex justify-between items-center text-xs font-medium p-2 bg-slate-50 rounded-lg">
                    <span>{s.label}</span>
                    <span className="font-bold text-brand-primary">{s.count} requests</span>
                  </div>
                ))}

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pt-2">User Category:</span>
                {data.lifestyleDemand.userTypes.map((u) => (
                  <div key={u.label} className="flex justify-between items-center text-xs font-medium p-2 bg-slate-50 rounded-lg">
                    <span>{u.label}</span>
                    <span className="font-bold text-purple-600">{u.count} requests</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Vibe & Cleanliness */}
            <div className="bg-white p-6 rounded-2xl border shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                <Users className="mr-2 h-4 w-4 text-brand-primary" />
                Social Vibe & Cleanliness
              </h3>
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Social Interaction:</span>
                {data.lifestyleDemand.socialTypes.map((s) => (
                  <div key={s.label} className="flex justify-between items-center text-xs font-medium p-2 bg-slate-50 rounded-lg">
                    <span>{s.label}</span>
                    <span className="font-bold text-emerald-600">{s.count} requests</span>
                  </div>
                ))}

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pt-2">Cleanliness Priority:</span>
                {data.lifestyleDemand.cleanliness.map((c) => (
                  <div key={c.label} className="flex justify-between items-center text-xs font-medium p-2 bg-slate-50 rounded-lg">
                    <span>{c.label}</span>
                    <span className="font-bold text-indigo-600">{c.count} requests</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Food Habits & Diets */}
            <div className="bg-white p-6 rounded-2xl border shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                <Sparkles className="mr-2 h-4 w-4 text-brand-primary" />
                Dietary Compatibility Demand
              </h3>
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Food Preferences:</span>
                {data.lifestyleDemand.foodPreferences.map((f) => (
                  <div key={f.label} className="flex justify-between items-center text-xs font-medium p-2 bg-slate-50 rounded-lg">
                    <span>{f.label}</span>
                    <span className="font-bold text-amber-600">{f.count} requests</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE SEARCH LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border shadow-xs overflow-hidden animate-fadeIn">
          <div className="p-5 border-b flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                Recent Search Telemetry Queries ({data.recentLogs.length})
              </h3>
              <p className="text-xs text-slate-500">Live feed of incoming search inquiries and listing impressions.</p>
            </div>
          </div>

          <div className="divide-y overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Target Area / Locality</th>
                  <th className="py-3 px-4">BHK / Budget</th>
                  <th className="py-3 px-4">Matches</th>
                  <th className="py-3 px-4">Filter Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.recentLogs.map((log) => {
                  const isFlat = log.type === 'flat_search';
                  const isFlatmate = log.type === 'flatmate_search';
                  return (
                    <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider ${
                          isFlat ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          isFlatmate ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {log.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {log.localityName || log.searchAreaLabel || 'City-Wide'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{log.bhkConfig || 'Any BHK'}</span>
                        {log.rentAmount && (
                          <span className="block text-[10px] text-slate-500">Up to ₹{log.rentAmount.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${log.resultsCount === 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {log.resultsCount} results
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs truncate">
                        {log.searchParams?.flatmatePreferences ? (
                          <span>{log.searchParams.flatmatePreferences.userType || 'Any'} • {log.searchParams.flatmatePreferences.shift || 'Any Shift'}</span>
                        ) : log.searchParams?.zeroBrokerage ? (
                          <span className="text-emerald-700 font-semibold">Zero Brokerage</span>
                        ) : (
                          <span>Standard search</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {data.recentLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No search events recorded yet. Search activity will show here in real-time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
