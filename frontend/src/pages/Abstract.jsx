import { useAbstract } from '../hooks/useApi';
import { AbstractSummary } from '../components/AbstractSummary';

export default function Abstract() {
  const { data, isLoading, error } = useAbstract();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Abstract</h1>

      {isLoading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">Could not load summary.</div>}

      {/* Note: original app's Abstract.aspx links to ViewRequestAll.aspx (an
          admin-wide, non-contact-filtered request list), which hasn't been
          rebuilt yet - these links currently go to /view-request instead. */}
      <AbstractSummary data={data} linkBase="/view-request" />
    </div>
  );
}
