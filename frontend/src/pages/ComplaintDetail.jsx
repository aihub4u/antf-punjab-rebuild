import { useSearchParams } from 'react-router-dom';
import { useComplaintDetail } from '../hooks/useApi';

export default function ComplaintDetail() {
  const [searchParams] = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());

  const { data, isLoading, error } = useComplaintDetail(params);

  const columns = data?.rows?.[0] ? Object.keys(data.rows[0]) : [];
  // Mirrors the old app: when Type=Open, hide columns 2 and 3 (typically close-related fields)
  const visibleColumns = params.type === 'Open' ? columns.filter((_, i) => i !== 2 && i !== 3) : columns;

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-[#3e1654] mb-4">
        Complaint Detail — {params.type}
      </h1>

      {isLoading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">Could not load detail.</div>}
      {data && data.rows.length === 0 && <div className="text-slate-500">No data found</div>}

      {data && data.rows.length > 0 && (
        <div className="bg-white rounded shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#500579] text-white">
              <tr>
                {visibleColumns.map((c) => (
                  <th key={c} className="px-3 py-2 text-left whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} className="border-t border-slate-100 odd:bg-[#f6e6ff]">
                  {visibleColumns.map((c) => (
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
