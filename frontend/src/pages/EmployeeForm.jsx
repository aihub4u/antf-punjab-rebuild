import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useEmployee,
  useSaveEmployee,
  useDesignations,
  useOfficeTypes,
  useOffices,
} from '../hooks/useApi';

export default function EmployeeForm() {
  const { id } = useParams(); // undefined when adding a new employee
  const navigate = useNavigate();

  const { data: existing } = useEmployee(id);
  const { data: designations } = useDesignations();
  const { data: officeTypes } = useOfficeTypes();
  const saveMutation = useSaveEmployee(id);

  const [form, setForm] = useState({
    name: '',
    designationId: '0',
    officeType: '',
    divisionId: '0',
    districtId: '0',
    tehsilId: '0',
    villageId: '0',
    mobileNo: '',
    emailId: '',
    status: '1',
  });
  const [formError, setFormError] = useState('');

  // Office hierarchy - each level only fetches once its parent is selected,
  // matching the old Division_changed/District_changed/tehsil_changed cascade.
  const { data: divisions } = useOffices('0', 'Division');
  const { data: districts } = useOffices(form.divisionId, 'District');
  const { data: tehsils } = useOffices(form.districtId, 'Tehsil');
  const { data: villages } = useOffices(form.tehsilId, 'Village');

  // Prefill when editing
  useEffect(() => {
    if (existing) {
      setForm((f) => ({
        ...f,
        name: existing.contactname,
        designationId: String(existing.designationid),
        officeType: existing.OfficeType,
        divisionId: existing.Off3 || existing.Off2 || existing.Off1 || existing.OfficeID || '0',
        districtId: existing.Off2 || existing.Off1 || (existing.OfficeType === 'District' ? existing.OfficeID : '0'),
        tehsilId: existing.Off1 || (existing.OfficeType === 'Tehsil' ? existing.OfficeID : '0'),
        villageId: existing.OfficeType === 'Village' ? existing.OfficeID : '0',
        mobileNo: existing.MobileNo,
        emailId: existing.EmailID,
        status: String(existing.Status),
      }));
    }
  }, [existing]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const requiresDivision = form.officeType && form.officeType !== 'HQ';
  const requiresDistrict = requiresDivision && form.officeType !== 'Division';
  const requiresTehsil = requiresDistrict && form.officeType !== 'District';
  const requiresVillage = requiresTehsil && form.officeType !== 'Tehsil';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) return setFormError('Kindly enter Name');

    try {
      const result = await saveMutation.mutateAsync(form);
      alert(result.message);
      navigate('/employees');
    } catch (err) {
      setFormError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-lg font-semibold text-purple-900 mb-4">
        {id ? 'Edit Employee' : 'Add Employee'}
      </h1>

      {formError && <div className="bg-red-50 text-red-700 text-sm rounded p-2 mb-4">{formError}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name">
            <input className="input" value={form.name} onChange={update('name')} autoFocus />
          </Field>

          <Field label="Designation">
            <select className="input" value={form.designationId} onChange={update('designationId')}>
              <option value="0">Select</option>
              {(designations || []).map((d) => (
                <option key={d.DesignationID} value={d.DesignationID}>{d.Designation}</option>
              ))}
            </select>
          </Field>

          <Field label="Office Type">
            <select className="input" value={form.officeType} onChange={update('officeType')}>
              <option value="">Select</option>
              {(officeTypes || []).map((t) => (
                <option key={t.OfficeType} value={t.OfficeType}>{t.OfficeType}</option>
              ))}
            </select>
          </Field>

          {requiresDivision && (
            <Field label="Division">
              <select
                className="input"
                value={form.divisionId}
                onChange={(e) => setForm((f) => ({ ...f, divisionId: e.target.value, districtId: '0', tehsilId: '0', villageId: '0' }))}
              >
                <option value="0">Select</option>
                {(divisions || []).map((o) => (
                  <option key={o.officeID} value={o.officeID}>{o.officeName}</option>
                ))}
              </select>
            </Field>
          )}

          {requiresDistrict && (
            <Field label="District">
              <select
                className="input"
                value={form.districtId}
                onChange={(e) => setForm((f) => ({ ...f, districtId: e.target.value, tehsilId: '0', villageId: '0' }))}
                disabled={form.divisionId === '0'}
              >
                <option value="0">Select</option>
                {(districts || []).map((o) => (
                  <option key={o.officeID} value={o.officeID}>{o.officeName}</option>
                ))}
              </select>
            </Field>
          )}

          {requiresTehsil && (
            <Field label="Tehsil">
              <select
                className="input"
                value={form.tehsilId}
                onChange={(e) => setForm((f) => ({ ...f, tehsilId: e.target.value, villageId: '0' }))}
                disabled={form.districtId === '0'}
              >
                <option value="0">Select</option>
                {(tehsils || []).map((o) => (
                  <option key={o.officeID} value={o.officeID}>{o.officeName}</option>
                ))}
              </select>
            </Field>
          )}

          {requiresVillage && (
            <Field label="Village">
              <select
                className="input"
                value={form.villageId}
                onChange={update('villageId')}
                disabled={form.tehsilId === '0'}
              >
                <option value="0">Select</option>
                {(villages || []).map((o) => (
                  <option key={o.officeID} value={o.officeID}>{o.officeName}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Mobile No">
            <input className="input" value={form.mobileNo} onChange={update('mobileNo')} />
          </Field>
          <Field label="Email">
            <input type="email" className="input" value={form.emailId} onChange={update('emailId')} />
          </Field>
          <Field label="Status">
            <select className="input" value={form.status} onChange={update('status')}>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </Field>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="bg-purple-900 text-white px-5 py-2 rounded font-medium hover:bg-purple-800 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="bg-slate-200 text-slate-700 px-5 py-2 rounded font-medium hover:bg-slate-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
