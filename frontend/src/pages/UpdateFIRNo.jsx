import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUpdateFirNumber } from '../hooks/useApi';

export default function UpdateFIRNo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const updateMutation = useUpdateFirNumber(id);

  const [firNo, setFirNo] = useState('');
  const [noOfAccused, setNoOfAccused] = useState('0');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!firNo && noOfAccused === '0') return setError('Enter value');

    try {
      const result = await updateMutation.mutateAsync({ firNo, noOfAccused });
      alert(result.message);
      navigate('/view-request');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold text-slate-800 mb-4">Update FIR Number</h1>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded p-2 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="coolinput">
          <label className="field-label">FIR No.</label>
          <input type="text" className="input" value={firNo} onChange={(e) => setFirNo(e.target.value)} />
        </div>

        <div className="coolinput">
          <label className="field-label">No. of Accused</label>
          <input
            type="number"
            min="0"
            className="input"
            value={noOfAccused}
            onChange={(e) => setNoOfAccused(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-[#3e1654] text-white px-5 py-2 rounded font-medium hover:bg-[#5b2478] disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Submit'}
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
