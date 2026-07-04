import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChangePassword } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const changePasswordMutation = useChangePassword();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!oldPassword) return setError('Enter your current password');
    if (newPassword !== confirmPassword) return setError('New password and confirm password do not match');

    try {
      const result = await changePasswordMutation.mutateAsync({ oldPassword, newPassword });
      alert(result.message);
      logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold text-slate-800 mb-4">Change Password</h1>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded p-2 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="coolinput">
          <label className="field-label">Old Password</label>
          <input
            type="password"
            className="input"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoFocus
          />
        </div>

        <div className="coolinput">
          <label className="field-label">New Password</label>
          <input
            type="password"
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">
            8+ characters, at least one letter, one number, and one of @$!%*#?&
          </p>
        </div>

        <div className="coolinput">
          <label className="field-label">Confirm New Password</label>
          <input
            type="password"
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="bg-[#3e1654] text-white px-5 py-2 rounded font-medium hover:bg-[#5b2478] disabled:opacity-50"
          >
            {changePasswordMutation.isPending ? 'Saving...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/my-account')}
            className="bg-slate-200 text-slate-700 px-5 py-2 rounded font-medium hover:bg-slate-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
