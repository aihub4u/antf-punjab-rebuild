import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
      <h1 className="text-3xl font-semibold text-slate-800 mb-2">Page Not Found</h1>
      <p className="text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="bg-[#3e1654] text-white px-5 py-2 rounded font-medium hover:bg-[#5b2478]">
        Go to Dashboard
      </Link>
    </div>
  );
}
