import { Link } from 'react-router-dom';

const ORANGE = '#e96718';

// linkBase: '/view-request' or '/view-request-all' - which page the drill-down goes to
export function AbstractSummary({ data, linkBase = '/view-request', closedLinksEnabled = true }) {
  if (!data) return null;

  const openRow = data.open || {};
  const closedRow = data.closed || {};
  const totalRow = data.total || {};

  return (
    <div className="space-y-8">
      <SummarySection title="Open" total={openRow.Total} link={`${linkBase}?i=Open`}>
        <StatLink label="Pending" value={openRow.Pending} link={`${linkBase}?s=Pending&i=Open`} />
        <StatLink label="Spam" value={openRow.Spam} link={`${linkBase}?s=Spam&i=Open`} />
        <StatLink label="Incomplete" value={openRow.Incomplete} link={`${linkBase}?s=Incomplete&i=Open`} />
        <StatLink label="Not Verifiable" value={openRow.NotVerifiable} link={`${linkBase}?s=Not Verifiable&i=Open`} />
        <StatLink label="Action Taken" value={openRow.ActionTaken} link={`${linkBase}?s=Action Taken&i=Open`} />
      </SummarySection>

      <SummarySection
        title="Closed"
        total={closedRow.Total}
        link={closedLinksEnabled ? `${linkBase}?i=Closed` : null}
      >
        <StatLink label="Pending" value={closedRow.Pending} link={closedLinksEnabled ? `${linkBase}?s=Pending&i=Closed` : null} />
        <StatLink label="Spam" value={closedRow.Spam} link={closedLinksEnabled ? `${linkBase}?s=Spam&i=Closed` : null} />
        <StatLink label="Incomplete" value={closedRow.Incomplete} link={closedLinksEnabled ? `${linkBase}?s=Incomplete&i=Closed` : null} />
        <StatLink label="Not Verifiable" value={closedRow.NotVerifiable} link={closedLinksEnabled ? `${linkBase}?s=Not Verifiable&i=Closed` : null} />
        <StatLink label="Action Taken" value={closedRow.ActionTaken} link={closedLinksEnabled ? `${linkBase}?s=Action Taken&i=Closed` : null} />
      </SummarySection>

      <SummarySection title="Total">
        <Stat label="Total" value={totalRow.Total} />
        <Stat label="Pending" value={totalRow.Pending} />
        <Stat label="Spam" value={totalRow.Spam} />
        <Stat label="Incomplete" value={totalRow.Incomplete} />
        <Stat label="Not Verifiable" value={totalRow.NotVerifiable} />
        <Stat label="Action Taken" value={totalRow.ActionTaken} />
      </SummarySection>
    </div>
  );
}

function SummarySection({ title, total, link, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {total !== undefined && (
          link ? (
            <Link to={link} className="text-lg font-bold" style={{ color: ORANGE }}>
              {total}
            </Link>
          ) : (
            <span className="text-lg font-bold text-slate-700">{total}</span>
          )
        )}
      </div>
      <div className="grid grid-cols-5 gap-4">{children}</div>
    </div>
  );
}

function StatLink({ label, value, link }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      {link ? (
        <Link to={link} className="text-base font-bold" style={{ color: ORANGE }}>
          {value ?? 0}
        </Link>
      ) : (
        <span className="text-base font-bold text-slate-700">{value ?? 0}</span>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <span className="text-base font-bold text-slate-700">{value ?? 0}</span>
    </div>
  );
}
