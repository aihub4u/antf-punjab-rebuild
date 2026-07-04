import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useComplaintInfo,
  useDistricts,
  usePoliceStations,
  useCloseComplaint,
} from '../hooks/useApi';

const STATUS_OPTIONS = ['Spam', 'Incomplete', 'Not Verifiable', 'Action Taken'];

export default function CloseStatus() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error: loadError } = useComplaintInfo(id);
  const { data: districts } = useDistricts();
  const closeMutation = useCloseComplaint(id);

  const [status, setStatus] = useState('0');
  const [actionResult, setActionResult] = useState('0');
  const [remarksOption, setRemarksOption] = useState('0');
  const [remarksOther, setRemarksOther] = useState('');
  const [freeTextRemarks, setFreeTextRemarks] = useState('');
  const [isFIR, setIsFIR] = useState('0');
  const [firDate, setFirDate] = useState('');
  const [accused, setAccused] = useState('');
  const [firDistrictId, setFirDistrictId] = useState('0');
  const [firStationId, setFirStationId] = useState('0');
  const [attachment, setAttachment] = useState(null);
  const [formError, setFormError] = useState('');

  const { data: policeStations } = usePoliceStations(firDistrictId);

  // Prefill current status once complaint data loads (mirrors old Page_Load)
  useEffect(() => {
    if (data?.info?.CurrentStatus) {
      setStatus(data.info.CurrentStatus);
    }
  }, [data]);

  // Update 2: drop "FIR Registered" from Action Result options when IS FIR = No
  const actionResultOptions = (data?.actionResultOptions || []).filter(
    (opt) => isFIR === '1' || opt !== 'FIR Registered'
  );

  // Update 4: canned remarks list depends on Status
  const cannedOptions = data?.cannedRemarks?.[status] || null;
  const usesCannedRemarks = STATUS_OPTIONS.includes(status);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (status === '0') return setFormError('Please select a Status');
    if (status === 'Action Taken' && actionResult === '0')
      return setFormError('Please select an Action Result');
    if (usesCannedRemarks && remarksOption === '0')
      return setFormError('Please select Remarks');
    if (usesCannedRemarks && remarksOption === 'Other' && !remarksOther.trim())
      return setFormError('Please enter the remarks');
    if (isFIR === '1' && (!firDate || !accused || firDistrictId === '0' || firStationId === '0'))
      return setFormError('FIR Date, No. of People Accused, District and Police Station are all required');

    const formData = new FormData();
    formData.append('currentStatus', status);
    formData.append('isFIR', isFIR);
    formData.append('freeTextRemarks', freeTextRemarks);
    if (usesCannedRemarks) {
      formData.append('remarksOption', remarksOption);
      formData.append('remarksOther', remarksOther);
    }
    if (status === 'Action Taken') formData.append('actionResult', actionResult);
    if (isFIR === '1') {
      formData.append('firDate', firDate);
      formData.append('noOfPeopleAccused', accused);
      formData.append('firDistrictId', firDistrictId);
      formData.append('firStationId', firStationId);
    }
    if (attachment) formData.append('attachment', attachment);

    try {
      const result = await closeMutation.mutateAsync(formData);
      alert(result.message);
      navigate('/view-request');
    } catch (err) {
      setFormError(err.response?.data?.error || 'Something went wrong');
    }
  };

  if (isLoading) return <div className="p-8 text-slate-500">Loading...</div>;
  if (loadError)
    return <div className="p-8 text-red-600">Could not load this complaint. It may not exist.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-lg font-semibold text-purple-900 mb-4">Close Status</h1>

      {formError && (
        <div className="bg-red-50 text-red-700 text-sm rounded p-2 mb-4">{formError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Status */}
          <Field label="Status">
            <select
              className="input"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setRemarksOption('0');
                setActionResult('0');
              }}
            >
              <option value="0">Select</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          {/* IS FIR */}
          <Field label="IS FIR">
            <select className="input" value={isFIR} onChange={(e) => setIsFIR(e.target.value)}>
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </Field>

          {/* Update 1 & 2: Action Result - only when Status = Action Taken */}
          {status === 'Action Taken' && (
            <Field label="Action Result">
              <select className="input" value={actionResult} onChange={(e) => setActionResult(e.target.value)}>
                <option value="0">Select</option>
                {actionResultOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </Field>
          )}

          {/* Update 5: FIR fields - only when IS FIR = Yes */}
          {isFIR === '1' && (
            <>
              <Field label="FIR Date">
                <input
                  type="date"
                  className="input"
                  value={firDate}
                  onChange={(e) => setFirDate(e.target.value)}
                />
              </Field>
              <Field label="No. of People Accused">
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={accused}
                  onChange={(e) => setAccused(e.target.value)}
                />
              </Field>
              <Field label="District">
                <select
                  className="input"
                  value={firDistrictId}
                  onChange={(e) => {
                    setFirDistrictId(e.target.value);
                    setFirStationId('0');
                  }}
                >
                  <option value="0">Select</option>
                  {(districts || []).map((d) => (
                    <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictEng}</option>
                  ))}
                </select>
              </Field>
              <Field label="Police Station">
                <select
                  className="input"
                  value={firStationId}
                  onChange={(e) => setFirStationId(e.target.value)}
                  disabled={firDistrictId === '0'}
                >
                  <option value="0">Select</option>
                  {(policeStations || []).map((p) => (
                    <option key={p.PoliceStationID} value={p.PoliceStationID}>
                      {p.PoliceStationName}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          {/* Update 4: Remarks - canned dropdown or free text */}
          {usesCannedRemarks ? (
            <>
              <Field label="Remarks">
                <select
                  className="input"
                  value={remarksOption}
                  onChange={(e) => setRemarksOption(e.target.value)}
                >
                  <option value="0">Select</option>
                  {(cannedOptions || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  {status === 'Action Taken' && <option value="Other">Other</option>}
                </select>
              </Field>
              {remarksOption === 'Other' && (
                <Field label="Other Remarks">
                  <input
                    type="text"
                    className="input"
                    value={remarksOther}
                    onChange={(e) => setRemarksOther(e.target.value)}
                  />
                </Field>
              )}
            </>
          ) : (
            <Field label="Remarks">
              <input
                type="text"
                className="input"
                value={freeTextRemarks}
                onChange={(e) => setFreeTextRemarks(e.target.value)}
              />
            </Field>
          )}

          <Field label="Attachment (jpg/png/pdf/mp4)">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.mp4,.mpg,.mpeg"
              onChange={(e) => setAttachment(e.target.files[0] || null)}
            />
          </Field>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={closeMutation.isPending}
            className="bg-purple-900 text-white px-5 py-2 rounded font-medium hover:bg-purple-800 disabled:opacity-50"
          >
            {closeMutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/view-request')}
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
