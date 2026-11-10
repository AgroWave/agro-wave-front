import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router";
import { AuthLayout } from "../components/layout/AuthLayout";
import { AppShell } from "../components/layout/AppShell";
import { ConfirmEmailView } from "../features/auth/ConfirmEmailView";
import { ForgotPasswordForm } from "../features/auth/ForgotPasswordForm";
import { LoginForm } from "../features/auth/LoginForm";
import { RegisterForm } from "../features/auth/RegisterForm";
import { ResetPasswordForm } from "../features/auth/ResetPasswordForm";
import { useAuthStore } from "../features/auth/useAuthStore";
import { DemsPage } from "../features/dem/DemsPage";
import { ProfilesPage } from "../features/profiles/ProfilesPage";
import { ScenarioEditorPage } from "../features/scenarios/ScenarioEditorPage";
import { ScenariosPage } from "../features/scenarios/ScenariosPage";
import { SimulationComparePage } from "../features/simulations/SimulationComparePage";
import { SimulationDetailPage } from "../features/simulations/SimulationDetailPage";
import { SimulationsPage } from "../features/simulations/SimulationsPage";
import { ProtectedRoute, PublicOnlyRoute } from "./guards";

function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  return (
    <AuthLayout>
      <LoginForm
        onSuccess={(authToken, authUser) => {
          setAuth(authToken, authUser);
          navigate("/profiles");
        }}
        onNavigateRegister={() => navigate("/register")}
        onNavigateForgotPassword={() => navigate("/forgot-password")}
      />
    </AuthLayout>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  return (
    <AuthLayout>
      <RegisterForm onNavigateLogin={() => navigate("/login")} />
    </AuthLayout>
  );
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  return (
    <AuthLayout>
      <ForgotPasswordForm onNavigateLogin={() => navigate("/login")} />
    </AuthLayout>
  );
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token = "" } = useParams();

  return (
    <AuthLayout>
      <ResetPasswordForm
        token={token}
        onNavigateLogin={() => navigate("/login")}
      />
    </AuthLayout>
  );
}

function ConfirmEmailPage() {
  const navigate = useNavigate();
  const { token = "" } = useParams();

  return (
    <AuthLayout>
      <ConfirmEmailView
        token={token}
        onNavigateLogin={() => navigate("/login")}
      />
    </AuthLayout>
  );
}

/**
 * Main application router defining routes, guards, and layout compositions.
 * @returns Application routing hierarchy.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <PublicOnlyRoute>
              <ResetPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/confirm-email/:token"
          element={
            <PublicOnlyRoute>
              <ConfirmEmailPage />
            </PublicOnlyRoute>
          }
        />

        {/* Protected App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/simulations" replace />} />
          <Route path="profiles" element={<ProfilesPage />} />
          <Route path="simulations" element={<SimulationsPage />} />
          <Route path="simulations/compare" element={<SimulationComparePage />} />
          <Route path="simulations/:id" element={<SimulationDetailPage />} />
          <Route path="scenarios" element={<ScenariosPage />} />
          <Route path="scenarios/new" element={<ScenarioEditorPage />} />
          <Route path="scenarios/:id" element={<ScenarioEditorPage />} />
          <Route path="dem" element={<DemsPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

