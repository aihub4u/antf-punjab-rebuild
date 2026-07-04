import { useSearchParams } from 'react-router-dom';
import { useVdcAbstractDetail } from '../hooks/useApi';

export default function VdcAbstractDetail() {
  const [searchParams] = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());

  const { data, isLoading, error } = useVdcAbstractDetail(params);
  const columns = data?.rows?.[0] ? Object.keys(data.rows[0]) : [];

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-purple-900 mb-4">Abstract Detail — {params.type}</h1>

      {isLoading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">Could not load detail.</div>}
      {data && data.rows.length === 0 && <div className="text-slate-500">No data found</div>}

      {data && data.rows.length > 0 && (
        <div className="bg-white rounded shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-purple-900 text-white">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-3 py-2 text-left whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-2 whitespace-nowrap">{String(row[c] ?? '')}</td>
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
