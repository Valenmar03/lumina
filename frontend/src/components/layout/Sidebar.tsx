import { Link } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r">

      <div className="p-6 font-bold text-lg">
        Caleio
      </div>

      <nav className="flex flex-col gap-2 p-4">

        <Link to="/" className="hover:bg-slate-100 p-2 rounded">
          Agenda
        </Link>

        <Link to="/professionals" className="hover:bg-slate-100 p-2 rounded">
          Professionals
        </Link>

        <Link to="/services" className="hover:bg-slate-100 p-2 rounded">
          Services
        </Link>

        <Link to="/clients" className="hover:bg-slate-100 p-2 rounded">
          Clients
        </Link>

      </nav>

    </aside>
  );
}