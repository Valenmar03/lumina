export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Política de Cookies</h1>
          <p className="text-sm text-slate-500 mt-2">Última actualización: marzo 2026</p>
        </div>

        <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo para
              recordar preferencias, mantener sesiones activas y recopilar información de uso.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Cookies que utilizamos</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-600">
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Finalidad</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-800">Sesión</td>
                    <td className="px-4 py-3 text-slate-600">Mantener la sesión iniciada en la aplicación.</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">Sesión</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-800">Preferencias</td>
                    <td className="px-4 py-3 text-slate-600">
                      Recordar configuración de país y moneda seleccionada.
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">30 días</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-800">Analíticas</td>
                    <td className="px-4 py-3 text-slate-600">
                      Medir el tráfico y comportamiento en el sitio para mejorar el producto.
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">12 meses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Cookies de terceros</h2>
            <p className="mb-2">
              Algunos servicios integrados en Caleio pueden instalar sus propias cookies:
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-slate-600">
              <li>
                <strong className="text-slate-700">MercadoPago</strong> — para el procesamiento seguro de
                pagos.
              </li>
              <li>
                <strong className="text-slate-700">Meta / WhatsApp</strong> — para el envío de recordatorios.
              </li>
            </ul>
            <p className="mt-2">
              Estos terceros tienen sus propias políticas de cookies sobre las que Caleio no tiene control.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Cómo gestionar las cookies</h2>
            <p className="mb-3">
              Podés configurar tu navegador para bloquear o eliminar cookies. Ten en cuenta que desactivar
              ciertas cookies puede afectar el funcionamiento de la plataforma.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Chrome", href: "https://support.google.com/chrome/answer/95647" },
                { label: "Firefox", href: "https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" },
                { label: "Safari", href: "https://support.apple.com/es-es/guide/safari/sfri11471/mac" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-teal-300 hover:text-teal-700 transition-colors"
                >
                  {label} →
                </a>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Contacto</h2>
            <p>
              Para consultas sobre esta política escribí a{" "}
              <a href="mailto:hola@caleio.app" className="text-teal-600 underline">
                hola@caleio.app
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-xs text-slate-400">
          <a href="/privacidad" className="hover:text-slate-600 underline underline-offset-2">
            Política de Privacidad
          </a>
          <a href="/terminos" className="hover:text-slate-600 underline underline-offset-2">
            Términos y Condiciones
          </a>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Caleio — Todos los derechos reservados
        </div>
      </div>
    </div>
  );
}
