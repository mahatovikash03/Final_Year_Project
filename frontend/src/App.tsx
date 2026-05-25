import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ToastProvider    from './components/ui/ToastProvider';
import Landing          from './pages/Landing';
import Login            from './pages/Login';
import Register         from './pages/Register';
import ForgotPassword   from './pages/ForgotPassword';
import ResetPassword    from './pages/ResetPassword';
import Dashboard        from './pages/Dashboard';
import LogHealth        from './pages/LogHealth';
import Symptoms         from './pages/Symptoms';
import Analytics        from './pages/Analytics';
import Profile          from './pages/Profile';
import AIChat           from './pages/AIChat';
import Community        from './pages/Community';
import Wearables        from './pages/Wearables';
import Notifications    from './pages/Notifications';
import Habits           from './pages/Habits';
import SleepSchedule    from './pages/SleepSchedule';
import MoodTracker      from './pages/MoodTracker';
import Journal          from './pages/Journal';
import NutritionTracker from './pages/NutritionTracker';
import Reports          from './pages/Reports';
import NotFound         from './pages/NotFound';
import AdminPanel       from './pages/admin/AdminPanel';
import { useAuthStore } from './hooks/useAuth';

function Protected({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"                  element={<Landing />} />
          <Route path="/login"             element={<Login />} />
          <Route path="/register"          element={<Register />} />
          <Route path="/forgot-password"   element={<ForgotPassword />} />
          <Route path="/reset-password"    element={<ResetPassword />} />

          {/* Protected */}
          <Route path="/dashboard"   element={<Protected><Dashboard /></Protected>} />
          <Route path="/log"         element={<Protected><LogHealth /></Protected>} />
          <Route path="/symptoms"    element={<Protected><Symptoms /></Protected>} />
          <Route path="/analytics"   element={<Protected><Analytics /></Protected>} />
          <Route path="/profile"     element={<Protected><Profile /></Protected>} />
          <Route path="/ai-chat"     element={<Protected><AIChat /></Protected>} />
          <Route path="/community"   element={<Protected><Community /></Protected>} />
          <Route path="/wearables"   element={<Protected><Wearables /></Protected>} />
          <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
          <Route path="/habits"      element={<Protected><Habits /></Protected>} />
          <Route path="/sleep"       element={<Protected><SleepSchedule /></Protected>} />
          <Route path="/mood"        element={<Protected><MoodTracker /></Protected>} />
          <Route path="/journal"     element={<Protected><Journal /></Protected>} />
          <Route path="/nutrition"   element={<Protected><NutritionTracker /></Protected>} />
          <Route path="/reports"     element={<Protected><Reports /></Protected>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminOnly><AdminPanel /></AdminOnly>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
