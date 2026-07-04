import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Info, AlertTriangle, AlertCircle, XCircle, ListChecks } from 'lucide-react';
import { useDashboard } from '../hooks/useApi';

const SERIES = [
  { key: 'Spam', color: '#ef4444' },
  { key: 'Incomplete', color: '#f59e0b' },
  { key: 'NotVerifiable', color: '#8b5cf6' },
  { key: 'Pending', color: '#94a3b8' },
  { key: 'ActionTaken', color: '#10b981' },
];

// Matches the original app's .bg-pending/.bg-spam/.bg-incomplete/.bg-not-verifiable/.bg-action
// card styling exactly: tinted background, 2px colored border, colored icon, orange number.
const CARD_STYLES = {
  pending: { bg: '#FFFBEB', border: '#F59E0B', icon: '#F59E0B' },
  spam: { bg: '#FEF2F2', border: '#EF4444', icon: '#EF4444' },
  incomplete: { bg: '#F5F7FF', border: '#6366F1', icon: '#6366F1' },
  notVerifiable: { bg: '#F9FAFB', border: '#6B7280', icon: '#6B7280' },
  action: { bg: '#ECFDF5', border: '#10B981', icon: '#10B981' },
};

const ORANGE = '#e96718';

export default function Dashboard() {
  const [filters, setFilters] = useState({ cstatus: 'Open', ownership: '' });
  const { data, isLoading, error } = useDashboard(filters);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <h1 className="text-xl font-semibold text-slate-800 mb-4">Dashboard</h1>

      <div className="flex gap-3 mb-6">
        <select
          className="input w-48"
          value={filters.cstatus}
          onChange={(e) => setFilters((f) => ({ ...f, cstatus: e.target.value }))}
        >
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
        <select
          className="input w-64"
          value={filters.ownership}
          onChange={(e) => setFilters((f) => ({ ...f, ownership: e.target.value }))}
        >
          <option value="">All</option>
          <option value="HeadQuarter">Safe Punjab Control Room</option>
          <option value="District">District</option>
        </select>
      </div>

      {isLoading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">Could not load dashboard data.</div>}

      {data?.summary && (
        <div className="flex flex-wrap gap-3 mb-8">
          <SummaryCard label="Total Information" value={data.summary.Total} style={CARD_STYLES.pending} Icon={Info} />
          <SummaryCard label="Spam Information" value={data.summary.Spam} style={CARD_STYLES.spam} Icon={AlertTriangle} />
          <SummaryCard label="Incomplete Information" value={data.summary.Incomplete} style={CARD_STYLES.incomplete} Icon={AlertCircle} />
          <SummaryCard label="Not Verifiable" value={data.summary.NotVerifiable} style={CARD_STYLES.notVerifiable} Icon={XCircle} />
          <SummaryCard label="Action Taken" value={data.summary.ActionTaken} style={CARD_STYLES.action} Icon={ListChecks} />
        </div>
      )}

      {data?.districtWise?.length > 0 && (
        <ChartCard title="District Information Analysis">
          <ResponsiveContainer width="100%" height={Math.max(300, data.districtWise.length * 28)}>
            <BarChart data={data.districtWise} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="District" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {data?.categoryWise?.length > 0 && (
        <ChartCard title="Category Information Analysis">
          <ResponsiveContainer width="100%" height={Math.max(300, data.categoryWise.length * 28)}>
            <BarChart data={data.categoryWise} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="Category" width={150} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

function SummaryCard({ label, value, style, Icon }) {
  return (
    <div
      className="relative flex-1 min-w-[180px] rounded-2xl p-4 transition-transform hover:scale-[1.03]"
      style={{
        backgroundColor: style.bg,
        border: `2px solid ${style.border}`,
        boxShadow: '5px 5px 6px rgba(0,0,0,0.06)',
      }}
    >
      <span className="font-bold text-sm text-slate-700">{label}</span>
      <h4 className="mt-2 mb-1 text-xl font-bold" style={{ color: ORANGE }}>
        {value ?? 0}
      </h4>
      <Icon
        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60"
        size={32}
        style={{ color: style.icon }}
      />
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}
