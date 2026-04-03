export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Política de Privacidad</h1>
          <p className="text-sm text-slate-500 mt-2">Última actualización: marzo 2026</p>
        </div>

        <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">1. Responsable del tratamiento</h2>
            <p>
              Caleio es el responsable del tratamiento de los datos personales recopilados a través de esta
              plataforma. Ante cualquier consulta podés contactarnos en{" "}
              <a href="mailto:hola@caleio.app" className="text-teal-600 underline">
                hola@caleio.app
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">2. Datos que recopilamos</h2>
            <ul className="list-disc list-inside ml-2 space-y-1 text-slate-600">
              <li>
                <strong className="text-slate-700">Datos de registro:</strong> nombre, email y contraseña del
                profesional o negocio.
              </li>
              <li>
                <strong className="text-slate-700">Datos de clientes finales:</strong> nombre, email y teléfono
                ingresados al crear o reservar un turno.
              </li>
              <li>
                <strong className="text-slate-700">Datos de uso:</strong> historial de turnos, servicios y
                métricas del negocio.
              </li>
              <li>
                <strong className="text-slate-700">Datos de pago:</strong> procesados íntegramente por
                MercadoPago. Caleio no almacena datos de tarjetas.
              </li>
              <li>
                <strong className="text-slate-700">Datos técnicos:</strong> dirección IP, tipo de navegador y
                cookies de sesión.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">3. Finalidad del tratamiento</h2>
            <ul className="list-disc list-inside ml-2 space-y-1 text-slate-600">
              <li>Proveer y mejorar el Servicio.</li>
              <li>Enviar recordatorios de turnos por WhatsApp y email.</li>
              <li>Procesar pagos y señas.</li>
              <li>
                Comunicar novedades relevantes del producto (con posibilidad de darse de baja).
              </li>
              <li>Cumplir obligaciones legales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">
              4. Compartición de datos con terceros
            </h2>
            <p className="mb-2">
              Caleio comparte datos únicamente con los siguientes proveedores necesarios para operar el
              Servicio:
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-slate-600">
              <li>
                <strong className="text-slate-700">MercadoPago</strong> — procesamiento de pagos.
              </li>
              <li>
                <strong className="text-slate-700">WhatsApp / Meta</strong> — envío de recordatorios
                automáticos.
              </li>
              <li>
                <strong className="text-slate-700">Proveedores de infraestructura cloud</strong> —
                almacenamiento y hosting.
              </li>
            </ul>
            <p className="mt-2">
              No vendemos ni cedemos datos personales a terceros con fines publicitarios.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">5. Almacenamiento y seguridad</h2>
            <p>
              Los datos se almacenan en servidores con cifrado en reposo y en tránsito (TLS). Aplicamos
              medidas técnicas y organizativas para proteger la información contra acceso no autorizado,
              pérdida o alteración.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">6. Retención de datos</h2>
            <p>
              Los datos se conservan mientras la cuenta esté activa. Al cancelar la cuenta, los datos son
              eliminados dentro de los 90 días, salvo obligación legal de retención.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">7. Derechos del usuario</h2>
            <p className="mb-2">
              De acuerdo con la{" "}
              <strong>Ley 25.326 de Protección de Datos Personales (Argentina)</strong>, tenés derecho a:
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-slate-600">
              <li>Acceder a tus datos personales.</li>
              <li>Rectificar datos inexactos.</li>
              <li>Solicitar la eliminación de tus datos.</li>
              <li>Oponerte al tratamiento para fines de marketing.</li>
            </ul>
            <p className="mt-2">
              Para ejercer estos derechos escribí a{" "}
              <a href="mailto:hola@caleio.app" className="text-teal-600 underline">
                hola@caleio.app
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">8. Cookies</h2>
            <p>
              Utilizamos cookies funcionales y de análisis. Podés consultar más información en nuestra{" "}
              <a href="/cookies" className="text-teal-600 underline">
                Política de Cookies
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">9. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta política ocasionalmente. Te notificaremos por email ante cambios
              significativos.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-xs text-slate-400">
          <a href="/terminos" className="hover:text-slate-600 underline underline-offset-2">
            Términos y Condiciones
          </a>
          <a href="/cookies" className="hover:text-slate-600 underline underline-offset-2">
            Política de Cookies
          </a>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Caleio — Todos los derechos reservados
        </div>
      </div>
    </div>
  );
}
