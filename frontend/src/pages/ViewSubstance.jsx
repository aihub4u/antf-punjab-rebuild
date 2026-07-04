import { useParams } from 'react-router-dom';
import { useSubstance } from '../hooks/useApi';

export default function ViewSubstance() {
  const { id } = useParams();
  const { data, isLoading, error } = useSubstance(id);

  const columns = data?.[0] ? Object.keys(data[0]).filter((k) => k !== 'InformationID') : [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold text-slate-800 mb-4">Substance Records</h1>

      {isLoading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">Could not load substance records.</div>}
      {data && data.length === 0 && <div className="text-slate-500">No data found</div>}

      {data && data.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#500579] text-white">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-3 py-2 text-left whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-t border-slate-100 odd:bg-[#f6e6ff]">
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
