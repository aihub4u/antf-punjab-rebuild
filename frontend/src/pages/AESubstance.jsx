import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSaveSubstance } from '../hooks/useApi';

const SUBSTANCE_OPTIONS = ['Lahan', 'Heroin'];
const MULTI_SUBSTANCE_OPTIONS = ['MI', 'GM'];

const emptyRow = () => ({ substance: '', quantity: '', multiSubstance: '' });

export default function AESubstance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const saveMutation = useSaveSubstance(id);

  const [type, setType] = useState('');
  const [status, setStatus] = useState('1');
  const [rows, setRows] = useState([emptyRow()]);
  const [error, setError] = useState('');

  const updateRow = (index, field, value) => {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => setRows((r) => [...r, emptyRow()]);
  const removeRow = (index) => setRows((r) => (r.length > 1 ? r.filter((_, i) => i !== index) : r));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!type) return setError('Type is mandatory, please select Type');
    for (const row of rows) {
      if (!row.substance) return setError('Substance is mandatory');
      if (row.quantity === '') return setError('Quantity is mandatory');
    }

    try {
      const result = await saveMutation.mutateAsync({ type, status, rows });
      alert(result.message);
      navigate('/view-request');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-slate-800 mb-4">Add Substance</h1>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded p-2 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="coolinput">
            <label className="field-label">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Select</option>
              <option value="Commercial">Commercial</option>
              <option value="Non-commercial">Non-commercial</option>
            </select>
          </div>

          <div className="coolinput">
            <label className="field-label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="1">Active</option>
              <option value="0">In Active</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 text-xs font-semibold text-slate-500 mb-2">
            <div>Substance</div>
            <div>Quantity</div>
            <div>Multi Substance</div>
            <div></div>
          </div>
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 mb-2 items-center">
              <select
                className="input"
                value={row.substance}
                onChange={(e) => updateRow(i, 'substance', e.target.value)}
              >
                <option value="">Select</option>
                {SUBSTANCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                className="input"
                value={row.quantity}
                onChange={(e) => updateRow(i, 'quantity', e.target.value)}
              />
              <select
                className="input"
                value={row.multiSubstance}
                onChange={(e) => updateRow(i, 'multiSubstance', e.target.value)}
              >
                <option value="">Select</option>
                {MULTI_SUBSTANCE_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="flex gap-1">
                {i === rows.length - 1 && (
                  <button type="button" onClick={addRow} className="text-emerald-600 font-bold text-lg px-2">+</button>
                )}
                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(i)} className="text-red-600 font-bold text-lg px-2">−</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="bg-[#3e1654] text-white px-5 py-2 rounded font-medium hover:bg-[#5b2478] disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Submit'}
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
