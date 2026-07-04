import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useViewRequest } from '../hooks/useApi';

const dateStr = (d) => d.toISOString().split('T')[0];
const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

const ACTION_LABELS = {
  close: [{ label: 'Close', to: (id) => `/close-status/${id}`, style: 'danger' }],
  forward_close: [
    { label: 'Forward', to: (id) => `/forward/${id}`, style: 'warning' },
    { label: 'Close', to: (id) => `/close-status/${id}`, style: 'danger' },
  ],
  forward_action: [
    { label: 'Forward', to: (id) => `/forward/${id}`, style: 'warning' },
    { label: 'Action', to: (id) => `/return/${id}`, style: 'danger' },
  ],
  action: [{ label: 'Action', to: (id) => `/return/${id}`, style: 'success' }],
  reopen: [{ label: 'ReOpen', to: (id) => `/reopen/${id}`, style: 'success' }],
};

const BADGE_STYLES = {
  danger: 'bg-red-600',
  warning: 'bg-amber-500 text-slate-900',
  success: 'bg-emerald-600',
  secondary: 'bg-slate-500',
};

export default function ViewRequest() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    status: '',
    fromDate: dateStr(oneYearAgo),
    toDate: dateStr(new Date()),
    cstatus: user?.designationId === 5 ? 'Open' : 'Open',
    ownership: user?.designationId === 5 ? 'HeadQuarter' : '',
    infoId: '',
    source: '99',
  });

  const { data, isLoading, error } = useViewRequest(filters);
  const isDesignation5 = user?.designationId === 5; // Cstatus/Ownership locked, mirrors old drpCstatus.Enabled = false
  const showSourceFilter = (user?.designationId === 4 && !user?.isANTF) || user?.departmentId === 2;

  const update = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-purple-900 mb-4">View Request</h1>

      <div className="bg-white rounded shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        <FilterField label="Status">
          <select className="input" value={filters.status} onChange={update('status')}>
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Spam">Spam</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Not Verifiable">Not Verifiable</option>
            <option value="Action Taken">Action Taken</option>
          </select>
        </FilterField>

        <FilterField label="Ownership">
          <select className="input" value={filters.ownership} onChange={update('ownership')} disabled={isDesignation5}>
            <option value="">All</option>
            <option value="HeadQuarter">Safe Punjab Control Room</option>
            <option value="District">District</option>
          </select>
        </FilterField>

        <FilterField label="Complaint Status">
          <select className="input" value={filters.cstatus} onChange={update('cstatus')} disabled={isDesignation5}>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </FilterField>

        {showSourceFilter && (
          <FilterField label="Source">
            <select className="input" value={filters.source} onChange={update('source')}>
              <option value="99">All</option>
              <option value="0">Safe Punjab</option>
              <option value="1">VDC</option>
            </select>
          </FilterField>
        )}

        <FilterField label="From">
          <input type="date" className="input" value={filters.fromDate} onChange={update('fromDate')} />
        </FilterField>
        <FilterField label="To">
          <input type="date" className="input" value={filters.toDate} onChange={update('toDate')} />
        </FilterField>
        <FilterField label="Info ID">
          <input type="text" className="input w-28" value={filters.infoId} onChange={update('infoId')} />
        </FilterField>
      </div>

      {isLoading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">Could not load requests.</div>}

      {data && data.rows.length === 0 && (
        <div className="text-slate-500">No data found</div>
      )}

      {data && data.rows.length > 0 && (
        <div className="bg-white rounded shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-purple-900 text-white">
              <tr>
                <th className="px-3 py-2 text-left">Information ID</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Complaint Status</th>
                <th className="px-3 py-2 text-left">Current Status</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">FIR Registered</th>
                <th className="px-3 py-2 text-left">FIR Document</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row['Information ID']} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <a
                      href={`/view-detail/${row['Information ID']}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-700 underline"
                    >
                      {row['Information ID']}
                    </a>
                  </td>
                  <td className="px-3 py-2">{row.Category || row.Cat}</td>
                  <td className="px-3 py-2">{row['Complaint Status']}</td>
                  <td className="px-3 py-2">
                    {row._showAeInfoLink ? (
                      <a href={`/ae-info/${row['Information ID']}`} target="_blank" rel="noreferrer" className="text-purple-700 underline">
                        {row['Complaint Status']}
                      </a>
                    ) : (
                      row.CurrentStatus
                    )}
                  </td>
                  <td className="px-3 py-2 space-x-1">
                    {(ACTION_LABELS[row._action?.type] || []).map((a) => (
                      <Link
                        key={a.label}
                        to={a.to(row['Information ID'])}
                        className={`inline-block text-white text-xs px-2 py-1 rounded ${BADGE_STYLES[row._action?.style || a.style]}`}
                      >
                        {a.label}
                      </Link>
                    ))}
                  </td>
                  <td className="px-3 py-2">
                    {row._showFirRegisteredLink && (
                      <a href={`/update-fir/${row['Information ID']}`} className="text-purple-700 underline">
                        Yes
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row._firDocumentType && (
                      <a href={row['Fir Document']} target="_blank" rel="noreferrer" className="text-purple-700 underline">
                        {row._firDocumentType}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
