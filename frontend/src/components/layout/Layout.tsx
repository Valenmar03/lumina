import { useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useBusiness } from "../../hooks/useBusiness";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  UserCircle,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  MessageCircle,
} from "lucide-react";
import type { NavItem } from "../../types/navigation";
import { appRoutes, routeTitles } from "../../app/routes.ts";
import ConfirmModal from "../ui/ConfirmModal";
import TrialBanner from "../billing/TrialBanner";

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", to: appRoutes.dashboard, icon: LayoutDashboard },
  { name: "Agenda", to: appRoutes.agenda, icon: Calendar },
  { name: "Profesionales", to: appRoutes.professionals, icon: Users },
  { name: "Servicios", to: appRoutes.services, icon: Scissors },
  { name: "Clientes", to: appRoutes.clients, icon: UserCircle },
  { name: "Análisis", to: appRoutes.analytics, icon: BarChart3 },
  { name: "Administración", to: appRoutes.businessSettings, icon: Settings },
];

function getPageTitle(pathname: string) {
  if (routeTitles[pathname]) return routeTitles[pathname];

  const matched = Object.entries(routeTitles).find(([route]) =>
    pathname.startsWith(route) && route !== "/"
  );

  return matched?.[1] ?? "Caleio";
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();

  const currentPageTitle = useMemo(() => {
    return getPageTitle(location.pathname);
  }, [location.pathname]);

  const { data: businessData } = useBusiness();
  const businessName = businessData?.business?.name;

  const isPro = user?.role === "PRO";
  const visibleNavItems = isPro
    ? NAV_ITEMS.filter((item) =>
        ([appRoutes.dashboard, appRoutes.agenda, appRoutes.clients] as string[]).includes(item.to)
      )
    : NAV_ITEMS;

  const displayName = user?.username ?? user?.email ?? "?";
  const initial = displayName[0].toUpperCase();

  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <style>{`
        :root {
          --brand: #0D9488;
          --brand-light: #CCFBF1;
          --brand-dark: #0F766E;
        }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-dvh bg-white border-r border-slate-200 flex flex-col transition-all duration-300 overflow-hidden
          ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          ${desktopCollapsed ? "lg:translate-x-0 lg:w-16" : "lg:translate-x-0 lg:w-64"}`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-slate-100 shrink-0 transition-all duration-300 ${desktopCollapsed ? "lg:justify-center lg:px-0 px-5" : "px-5"}`}>
          <div className={`flex items-center gap-2.5 min-w-0`}>
            <img src="/logo.png" alt="Caleio" className="w-10 h-10 object-contain shrink-0" />
            <span className={`text-lg font-semibold text-slate-800 tracking-tight whitespace-nowrap transition-all duration-300 ${desktopCollapsed ? "lg:hidden" : ""}`}>
              Caleio
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1.5 rounded-md hover:bg-slate-100"
            type="button"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === appRoutes.dashboard}
                onClick={() => setSidebarOpen(false)}
                title={desktopCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    desktopCollapsed ? "lg:justify-center lg:px-0" : ""
                  } ${
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-teal-600" : "text-slate-400"}`}
                    />
                    <span className={`whitespace-nowrap transition-all duration-300 ${desktopCollapsed ? "lg:hidden" : ""}`}>
                      {item.name}
                    </span>
                    {isActive && !desktopCollapsed && (
                      <ChevronRight className="w-4 h-4 ml-auto text-teal-400 lg:block hidden" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Soporte */}
        <div className={`px-2 py-2 shrink-0 ${desktopCollapsed ? "" : ""}`}>
          <a
            href="https://wa.me/541138853213?text=Hola%2C%20necesito%20ayuda%20con%20Caleio"
            target="_blank"
            rel="noopener noreferrer"
            title={desktopCollapsed ? "Soporte por WhatsApp" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors ${desktopCollapsed ? "lg:justify-center lg:px-0" : ""}`}
          >
            <MessageCircle className="w-4.5 h-4.5 shrink-0" />
            <span className={`whitespace-nowrap ${desktopCollapsed ? "lg:hidden" : ""}`}>
              ¿Necesitás ayuda?
            </span>
          </a>
        </div>

        {/* Logout */}
        <div className="px-2 py-3 border-t border-slate-100 shrink-0">
          <button
            onClick={() => setConfirmLogout(true)}
            type="button"
            title={desktopCollapsed ? "Cerrar sesión" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-700 w-full transition-colors cursor-pointer ${desktopCollapsed ? "lg:justify-center lg:px-0" : ""}`}
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            <span className={`whitespace-nowrap ${desktopCollapsed ? "lg:hidden" : ""}`}>
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden transition-all duration-300 ${desktopCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
        <header className="h-14 lg:h-16 flex items-center justify-between px-4 lg:px-6 bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile open */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 lg:hidden"
              type="button"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            {/* Desktop toggle */}
            <button
              onClick={() => setDesktopCollapsed((v) => !v)}
              className="hidden lg:flex p-2 -ml-2 rounded-lg hover:bg-slate-100 cursor-pointer"
              type="button"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <img src="/logo.png" alt="Caleio" className="w-6 h-6 object-contain" />
              <span className="font-semibold text-slate-800 text-sm">Caleio</span>
            </div>

            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-slate-800">
                {currentPageTitle}
              </h1>
              {businessName && (
                <p className="text-xs text-slate-400 mt-0.5">{businessName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden lg:block text-sm text-slate-500 font-medium truncate max-w-40">
              {displayName}
            </span>
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-semibold shrink-0 select-none">
              {initial}
            </div>
          </div>
        </header>

        <TrialBanner />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <ConfirmModal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => logout()}
        title="Cerrar sesión"
        description="¿Estás seguro de que querés cerrar sesión?"
        confirmLabel="Cerrar sesión"
      />
    </div>
  );
}
