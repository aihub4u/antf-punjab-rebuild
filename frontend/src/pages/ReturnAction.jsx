import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReturnAction } from '../hooks/useApi';

const STATUS_OPTIONS = ['Action Taken', 'Spam', 'Incomplete', 'Not Verifiable'];

export default function ReturnAction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const returnMutation = useReturnAction(id);

  const [status, setStatus] = useState('0');
  const [isRelated, setIsRelated] = useState('1');
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (status === '0') return setError('Select Status');

    if (attachment && attachment.size >= 5 * 1024 * 1024) {
      return setError('Please upload a document smaller than 5 MB.');
    }

    const formData = new FormData();
    formData.append('currentStatus', status);
    formData.append('isRelated', isRelated);
    formData.append('remarks', remarks);
    if (attachment) formData.append('attachment', attachment);

    try {
      const result = await returnMutation.mutateAsync(formData);
      alert(result.message);
      navigate('/view-request');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-slate-800 mb-4">Action</h1>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded p-2 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="coolinput">
          <label className="field-label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="0">Select</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="coolinput">
          <label className="field-label">Is Related to You</label>
          <select className="input" value={isRelated} onChange={(e) => setIsRelated(e.target.value)}>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>

        <div className="coolinput">
          <label className="field-label">Remarks</label>
          <input type="text" className="input" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>

        <div className="coolinput">
          <label className="field-label">Attachment (jpg/png/pdf/mp4, max 5MB)</label>
          <input
            type="file"
            className="input"
            accept=".jpg,.jpeg,.png,.pdf,.mp4,.mpg,.mpeg"
            onChange={(e) => setAttachment(e.target.files[0] || null)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={returnMutation.isPending}
            className="bg-[#3e1654] text-white px-5 py-2 rounded font-medium hover:bg-[#5b2478] disabled:opacity-50"
          >
            {returnMutation.isPending ? 'Submitting...' : 'Submit'}
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
