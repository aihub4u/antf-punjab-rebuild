import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import CloseStatus from './pages/CloseStatus';
import ViewRequest from './pages/ViewRequest';
import Dashboard from './pages/Dashboard';
import DistrictWiseReport from './pages/DistrictWiseReport';
import DistrictWiseAbstract from './pages/DistrictWiseAbstract';
import ComplaintDetail from './pages/ComplaintDetail';
import VdcAbstractDetail from './pages/VdcAbstractDetail';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';

const queryClient = new QueryClient();

// Placeholder pages - each gets built out as its own milestone.
function Placeholder({ name }) {
  return <div className="p-8 text-slate-500">{name} — coming next</div>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/abstract"
              element={<ProtectedRoute><Placeholder name="Abstract" /></ProtectedRoute>}
            />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/view-request"
              element={<ProtectedRoute><ViewRequest /></ProtectedRoute>}
            />
            <Route
              path="/my-account"
              element={<ProtectedRoute><Placeholder name="My Account" /></ProtectedRoute>}
            />
            <Route
              path="/change-password"
              element={<ProtectedRoute><Placeholder name="Change Password" /></ProtectedRoute>}
            />
            <Route
              path="/close-status/:id"
              element={<ProtectedRoute><CloseStatus /></ProtectedRoute>}
            />
            <Route
              path="/reports/district-wise"
              element={<ProtectedRoute><DistrictWiseReport /></ProtectedRoute>}
            />
            <Route
              path="/reports/district-wise-abstract"
              element={<ProtectedRoute><DistrictWiseAbstract /></ProtectedRoute>}
            />
            <Route
              path="/reports/complaint-detail"
              element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>}
            />
            <Route
              path="/reports/vdc-abstract-detail"
              element={<ProtectedRoute><VdcAbstractDetail /></ProtectedRoute>}
            />
            <Route
              path="/employees"
              element={<ProtectedRoute><EmployeeList /></ProtectedRoute>}
            />
            <Route
              path="/employees/new"
              element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>}
            />
            <Route
              path="/employees/:id"
              element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>}
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
