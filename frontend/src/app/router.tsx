import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { Layout } from "../components/layout/Layout.tsx";
import DashboardPage from "../pages/DashboardPage.tsx";
import AgendaPage from "../pages/AgendaPage.tsx";
import ProfessionalsPage from "../pages/ProfessionalsPage.tsx";
import ServicesPage from "../pages/ServicesPage.tsx";
import ClientsPage from "../pages/ClientsPage.tsx";
import LoginPage from "../pages/LoginPage.tsx";
import RegisterPage from "../pages/RegisterPage.tsx";
import VerifyEmailPage from "../pages/VerifyEmailPage.tsx";
import ForgotPasswordPage from "../pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "../pages/ResetPasswordPage.tsx";
import BusinessSettingsPage from "../pages/BusinessSettingsPage.tsx";
import AnalyticsPage from "../pages/AnalyticsPage.tsx";
import BookingPage from "../pages/BookingPage.tsx";
import BookingPaymentSuccessPage from "../pages/BookingPaymentSuccessPage.tsx";
import BookingPaymentFailurePage from "../pages/BookingPaymentFailurePage.tsx";
import BookingPaymentPendingPage from "../pages/BookingPaymentPendingPage.tsx";
import { useAuth } from "../hooks/useAuth.ts";

function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const slug = localStorage.getItem("lastSlug");
    return <Navigate to={slug ? `/login/${slug}` : "/login"} replace />;
  }

  return <Outlet />;
}

function OwnerRoute() {
  const { user } = useAuth();
  if (user?.role === "PRO") return <Navigate to="/agenda" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/login/:slug",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/verificar-email",
    element: <VerifyEmailPage />,
  },
  {
    path: "/olvide-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/resetear-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/reservar/:slug",
    element: <BookingPage />,
  },
  {
    path: "/reservar/:slug/pago-exitoso",
    element: <BookingPaymentSuccessPage />,
  },
  {
    path: "/reservar/:slug/pago-fallido",
    element: <BookingPaymentFailurePage />,
  },
  {
    path: "/reservar/:slug/pago-pendiente",
    element: <BookingPaymentPendingPage />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "agenda", element: <AgendaPage /> },
          { path: "clients", element: <ClientsPage /> },
          {
            element: <OwnerRoute />,
            children: [
              { path: "professionals", element: <ProfessionalsPage /> },
              { path: "services", element: <ServicesPage /> },
              { path: "analytics", element: <AnalyticsPage /> },
              { path: "business-settings", element: <BusinessSettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
