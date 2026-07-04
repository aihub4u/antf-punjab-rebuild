import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMyAccountAbstract } from '../hooks/useApi';
import { AbstractSummary } from '../components/AbstractSummary';

export default function MyAccount() {
  const { user } = useAuth();
  const { data, isLoading, error } = useMyAccountAbstract();

  // Original app only shows this page's summary to ContactID 1 or
  // DesignationID 3 (District Head) - everyone else just sees their profile.
  const canSeeSummary = user?.designationId === 3;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">My Account</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <ProfileField label="Name" value={user?.name} />
          <ProfileField label="Designation" value={user?.designation} />
          <ProfileField label="Mobile No" value={user?.mobileNo} />
          <ProfileField label="Email" value={user?.emailId} />
          <ProfileField label="Department" value={user?.departmentName} />
          <ProfileField label="District" value={user?.districtName} />
        </div>
        <Link
          to="/change-password"
          className="inline-block mt-4 bg-[#3e1654] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#5b2478]"
        >
          Change Password
        </Link>
      </div>

      {canSeeSummary && (
        <>
          {isLoading && <div className="text-slate-500">Loading...</div>}
          {error && <div className="text-red-600">Could not load summary.</div>}
          <AbstractSummary
            data={data}
            linkBase="/view-request"
            closedLinksEnabled={data?.isDesignation4 ?? false}
          />
        </>
      )}
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-slate-800">{value || '—'}</div>
    </div>
  );
}
