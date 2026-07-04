import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDistrictWiseReport } from '../hooks/useApi';

const dateStr = (d) => d.toISOString().split('T')[0];

// Columns shown per report type - mirrors the old app's per-type Cells[x].Visible logic,
// but driven by column name instead of position.
const COLUMNS_BY_TYPE = {
  1: ['District', 'Total', 'Pending', 'Spam', 'Incomplete', 'Not Verifiable', 'Action Taken'],
  2: ['District', 'Total', 'Open', 'Closed'],
  3: ['District', 'Total', 'Open', 'Closed'],
};

export default function DistrictWiseReport() {
  const [filters, setFilters] = useState({
    type: '1',
    fromDate: '2024-08-20',
    toDate: dateStr(new Date()),
    source: '99',
    actionResult: '0',
  });

  const { data, isLoading, error } = useDistrictWiseReport(filters);
  const update = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const columns = COLUMNS_BY_TYPE[filters.type];

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-purple-900 mb-4">District Wise Report</h1>

      <div className="bg-white rounded shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        {/* Update 3 (CR): Action Result filter, only meaningful for Information Status Wise */}
        {filters.type === '1' && (
          <Field label="Action Result">
            <select className="input" value={filters.actionResult} onChange={update('actionResult')}>
              <option value="0">All</option>
              <option value="Already in Jail">In Jail</option>
              <option value="Incorrect Input">Incorrect Input</option>
              <option value="Evidence not found/Under surveillance">Evidence not found/Under surveillance</option>
            </select>
          </Field>
        )}

        <Field label="Report Type">
          <select className="input" value={filters.type} onChange={update('type')}>
            <option value="1">Information Status Wise</option>
            <option value="2">Complaint Status Wise</option>
            <option value="3">Health Department Wise</option>
          </select>
        </Field>

        <Field label="From">
          <input type="date" className="input" value={filters.fromDate} onChange={update('fromDate')} />
        </Field>
        <Field label="To">
          <input type="date" className="input" value={filters.toDate} onChange={update('toDate')} />
        </Field>

        {filters.type === '2' && (
          <Field label="Source">
            <select className="input" value={filters.source} onChange={update('source')}>
              <option value="99">All</option>
              <option value="0">Safe Punjab</option>
              <option value="1">VDC</option>
            </select>
          </Field>
        )}
      </div>

      {isLoading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">Could not load the report.</div>}

      {data && data.rows.length === 0 && <div className="text-slate-500">No data found</div>}

      {data && data.rows.length > 0 && (
        <div className="bg-white rounded shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-purple-900 text-white">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-3 py-2 text-left">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} className={`border-t border-slate-100 ${row.District === 'Total' ? 'font-semibold bg-slate-50' : ''}`}>
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-2">
                      {c === 'Open' && row._openLink ? (
                        <DrilldownLink link={row._openLink} value={row.Open} filters={filters} />
                      ) : c === 'Closed' && row._closedLink ? (
                        <DrilldownLink link={row._closedLink} value={row.Closed} filters={filters} />
                      ) : (
                        row[c]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DrilldownLink({ link, value, filters }) {
  const params = new URLSearchParams({
    type: link.type,
    isVdc: link.isVdc,
    districtId: link.districtId,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });
  return (
    <Link
      to={`/reports/complaint-detail?${params}`}
      target="_blank"
      className="inline-block bg-slate-500 text-white text-xs px-2 py-1 rounded"
    >
      {value}
    </Link>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
