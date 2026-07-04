import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAeInfoCategories, useUpdateAeInfo, useDistricts } from '../hooks/useApi';

// Categories that require a subcategory to be selected, matching the old
// app's hardcoded CategoryID list (6, 14, 20, 37, 43).
const REQUIRES_SUBCATEGORY = ['6', '14', '20', '37', '43'];

export default function AEInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: categories } = useAeInfoCategories();
  const updateMutation = useUpdateAeInfo(id);
  const { data: districts } = useDistricts();

  const [categoryId, setCategoryId] = useState('0');
  const [subCategoryId, setSubCategoryId] = useState('0');
  const [districtId, setDistrictId] = useState('0');
  const [error, setError] = useState('');

  const { data: subCategories } = useAeInfoCategories(categoryId);
  const subCategoryRequired = REQUIRES_SUBCATEGORY.includes(categoryId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (categoryId === '0') return setError('Select Category');
    if (subCategoryRequired && subCategoryId === '0') return setError('Select SubCategory');

    try {
      const result = await updateMutation.mutateAsync({ categoryId, subCategoryId, districtId });
      alert(result.message);
      navigate('/view-request');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold text-slate-800 mb-4">Reclassify Complaint</h1>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded p-2 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="coolinput">
          <label className="field-label">Category</label>
          <select
            className="input"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubCategoryId('0');
            }}
          >
            <option value="0">Select Category</option>
            {(categories || []).map((c) => (
              <option key={c.CategoryID} value={c.CategoryID}>{c.Category}</option>
            ))}
          </select>
        </div>

        <div className="coolinput">
          <label className="field-label">Sub Category</label>
          <select className="input" value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)}>
            <option value="0">Select SubCategory</option>
            {(subCategories || []).map((c) => (
              <option key={c.CategoryID} value={c.CategoryID}>{c.Category}</option>
            ))}
          </select>
        </div>

        <div className="coolinput">
          <label className="field-label">District</label>
          <select className="input" value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
            <option value="0">Select District</option>
            {(districts || []).map((d) => (
              <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictEng}</option>
            ))}
          </select>
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
