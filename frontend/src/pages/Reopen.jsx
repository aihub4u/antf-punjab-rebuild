import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReopen } from '../hooks/useApi';

export default function Reopen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reopenMutation = useReopen(id);
  const [done, setDone] = useState(false);

  const handleConfirm = async () => {
    try {
      const result = await reopenMutation.mutateAsync();
      alert(result.message);
      setDone(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not reopen this complaint');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-xl font-semibold text-slate-800 mb-4">Reopen Complaint</h1>
      {done ? (
        <p className="text-slate-600">Status updated. You can close this tab or return to View Request.</p>
      ) : (
        <p className="text-slate-600 mb-4">Are you sure you want to reopen complaint #{id}?</p>
      )}
      <div className="flex gap-3 justify-center mt-4">
        {!done && (
          <button
            onClick={handleConfirm}
            disabled={reopenMutation.isPending}
            className="bg-[#3e1654] text-white px-5 py-2 rounded font-medium hover:bg-[#5b2478] disabled:opacity-50"
          >
            {reopenMutation.isPending ? 'Reopening...' : 'Confirm Reopen'}
          </button>
        )}
        <button
          onClick={() => navigate('/view-request')}
          className="bg-slate-200 text-slate-700 px-5 py-2 rounded font-medium hover:bg-slate-300"
        >
          {done ? 'Back to View Request' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}
