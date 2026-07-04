import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDistrictWiseAbstract } from '../hooks/useApi';

const dateStr = (d) => d.toISOString().split('T')[0];
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const COLUMNS = [
  'District',
  'Total Complaint Related with Police verifiable',
  'Final Reply Received',
  'Total FIR Registered',
  'Total Complaints Related with Police verifiable',
  'Final Replies Received',
  'Total FIRs Registered',
  'Pending for more than 15 days',
];

export default function DistrictWiseAbstract() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    isVdc: searchParams.get('isVdc') || '0',
    fromDate: dateStr(yesterday),
    toDate: dateStr(yesterday),
  });

  const { data, isLoading, error } = useDistrictWiseAbstract(filters);
  const update = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-[#3e1654] mb-4">District Wise Abstract</h1>

      <div className="bg-white rounded shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        <Field label="Source">
          <select className="input" value={filters.isVdc} onChange={update('isVdc')}>
            <option value="0">Safe Punjab</option>
            <option value="1">VDC</option>
          </select>
        </Field>
        <Field label="From">
          <input type="date" className="input" value={filters.fromDate} onChange={update('fromDate')} />
        </Field>
        <Field label="To">
          <input type="date" className="input" value={filters.toDate} onChange={update('toDate')} />
        </Field>
      </div>

      {isLoading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">Could not load the abstract report.</div>}
      {data && data.rows.length === 0 && <div className="text-slate-500">No data found</div>}

      {data && data.rows.length > 0 && (
        <div className="bg-white rounded shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#500579] text-white">
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c} className="px-3 py-2 text-left whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} className={`border-t border-slate-100 ${row.District === 'Total' ? 'font-semibold bg-slate-50' : i % 2 === 1 ? 'bg-[#f6e6ff]' : ''}`}>
                  {COLUMNS.map((c) => (
                    <td key={c} className="px-3 py-2">
                      {c !== 'District' && row._links?.[c] ? (
                        <DrilldownLink link={row._links[c]} value={row[c]} filters={filters} />
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
      to={`/reports/vdc-abstract-detail?${params}`}
      target="_blank"
      className="inline-block bg-slate-500 text-white text-xs px-2 py-1 rounded"
    >
      {value}
    </Link>
  );
}

function Field({ label, children }) {
  return (
    <div className="coolinput">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
