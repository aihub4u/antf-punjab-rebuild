import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useDashboard } from '../hooks/useApi';

const SERIES = [
  { key: 'Spam', color: '#ef4444' },
  { key: 'Incomplete', color: '#f59e0b' },
  { key: 'NotVerifiable', color: '#8b5cf6' },
  { key: 'Pending', color: '#94a3b8' },
  { key: 'ActionTaken', color: '#10b981' },
];

export default function Dashboard() {
  const [filters, setFilters] = useState({ cstatus: 'Open', ownership: '' });
  const { data, isLoading, error } = useDashboard(filters);

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-purple-900 mb-4">Dashboard</h1>

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
        <div className="grid grid-cols-5 gap-4 mb-8">
          <SummaryCard label="Total" value={data.summary.Total} color="bg-purple-900" />
          <SummaryCard label="Spam" value={data.summary.Spam} color="bg-red-600" />
          <SummaryCard label="Incomplete" value={data.summary.Incomplete} color="bg-amber-500" />
          <SummaryCard label="Not Verifiable" value={data.summary.NotVerifiable} color="bg-violet-600" />
          <SummaryCard label="Action Taken" value={data.summary.ActionTaken} color="bg-emerald-600" />
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

function SummaryCard({ label, value, color }) {
  return (
    <div className={`${color} text-white rounded-lg p-4 text-center`}>
      <div className="text-2xl font-semibold">{value ?? '-'}</div>
      <div className="text-xs opacity-90 mt-1">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded shadow-sm p-4 mb-6">
      <h2 className="text-sm font-medium text-slate-700 mb-3">{title}</h2>
      {children}
    </div>
  );
}
