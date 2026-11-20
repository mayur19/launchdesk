import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CustomersPage } from './pages/customers/CustomersPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { PendingPage } from './pages/PendingPage';
import { NAV_ITEMS } from './routes/navigation';
import { RequireAuth } from './routes/RequireAuth';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        {NAV_ITEMS.filter((item) => item.ticket).map((item) => (
          <Route
            key={item.path}
            path={item.path.slice(1)}
            element={<PendingPage title={item.label} ticket={item.ticket!} />}
          />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
