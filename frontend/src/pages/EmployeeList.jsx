import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmployees, useDeleteEmployees } from '../hooks/useApi';

export default function EmployeeList() {
  const [filters, setFilters] = useState({ name: '', mobileNo: '', designation: '' });
  const [selected, setSelected] = useState(new Set());
  const { data: employees, isLoading, error } = useEmployees(filters);
  const deleteMutation = useDeleteEmployees();

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = (checked) => {
    setSelected(checked ? new Set(employees.map((e) => e.ID)) : new Set());
  };

  const handleDelete = async () => {
    if (selected.size === 0) return alert('Kindly Select Record');
    if (!confirm(`Delete ${selected.size} selected employee(s)?`)) return;
    const result = await deleteMutation.mutateAsync([...selected]);
    alert(result.message);
    setSelected(new Set());
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold text-[#3e1654]">Employees</h1>
        <Link to="/employees/new" className="bg-[#3e1654] text-white px-4 py-2 rounded text-sm font-medium">
          + Add Employee
        </Link>
      </div>

      <div className="bg-white rounded shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        <Field label="Name">
          <input className="input" value={filters.name} onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Mobile No">
          <input className="input" value={filters.mobileNo} onChange={(e) => setFilters((f) => ({ ...f, mobileNo: e.target.value }))} />
        </Field>
        <Field label="Designation">
          <input className="input" value={filters.designation} onChange={(e) => setFilters((f) => ({ ...f, designation: e.target.value }))} />
        </Field>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
        >
          Delete Selected
        </button>
      </div>

      {isLoading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">Could not load employees.</div>}
      {employees && employees.length === 0 && <div className="text-slate-500">No data found</div>}

      {employees && employees.length > 0 && (
        <div className="bg-white rounded shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#500579] text-white">
              <tr>
                <th className="px-3 py-2">
                  <input type="checkbox" onChange={(e) => toggleAll(e.target.checked)} />
                </th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Designation</th>
                <th className="px-3 py-2 text-left">Mobile No</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Mapping</th>
                <th className="px-3 py-2 text-left">Edit</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.ID} className="border-t border-slate-100 odd:bg-[#f6e6ff]">
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={selected.has(emp.ID)} onChange={() => toggle(emp.ID)} />
                  </td>
                  <td className="px-3 py-2">{emp.Name || emp.contactname}</td>
                  <td className="px-3 py-2">{emp.Designation}</td>
                  <td className="px-3 py-2">{emp.MobileNo}</td>
                  <td className="px-3 py-2">{emp.EmailID}</td>
                  <td className="px-3 py-2">{emp.Status}</td>
                  <td className="px-3 py-2">
                    {emp._foodInspectorMapping && (
                      <>
                        <Link to={`/employees/${emp.ID}/map-fps`} className="text-purple-700 underline mr-2">
                          {emp._foodInspectorMapping.alreadyMapped ? 'Map' : 'Map Now'}
                        </Link>
                        {emp._foodInspectorMapping.alreadyMapped && (
                          <Link to={`/employees/${emp.ID}/view-fps`} className="text-purple-700 underline">
                            View
                          </Link>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/employees/${emp.ID}`} className="text-purple-700 underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="coolinput">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
