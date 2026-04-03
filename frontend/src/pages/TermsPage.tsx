export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Términos y Condiciones</h1>
          <p className="text-sm text-slate-500 mt-2">Última actualización: marzo 2026</p>
        </div>

        <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">1. Aceptación de los términos</h2>
            <p>
              Al registrarse y utilizar Caleio ("el Servicio"), usted acepta quedar vinculado por estos
              Términos y Condiciones. Si no está de acuerdo con alguna parte, no debe utilizar el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">2. Descripción del Servicio</h2>
            <p>
              Caleio es una plataforma web de gestión de turnos, agenda y clientes orientada a profesionales
              y negocios. Permite la reserva online de turnos, el cobro de señas mediante MercadoPago y el
              envío de recordatorios automáticos por WhatsApp y email.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">3. Registro y cuenta</h2>
            <p>
              Para acceder al Servicio debe crear una cuenta con datos verídicos y mantener la
              confidencialidad de sus credenciales. Usted es responsable de toda actividad realizada desde
              su cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">4. Plan y facturación</h2>
            <p className="mb-2">
              Caleio ofrece un período de prueba gratuito de <strong>14 días</strong> sin necesidad de
              tarjeta de crédito. Finalizado el período de prueba, el acceso al Servicio requiere la
              contratación de un plan pago. Los precios vigentes se muestran en la página de precios. El
              cobro es mensual y se realiza por adelantado.
            </p>
            <p>
              Puede cancelar su suscripción en cualquier momento desde la configuración de su cuenta. No se
              realizan reembolsos por períodos parciales.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">5. Uso aceptable</h2>
            <p>
              El usuario se compromete a no utilizar el Servicio para actividades ilegales, envío de spam,
              suplantación de identidad ni ningún uso que perjudique a terceros o a la integridad de la
              plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">6. Propiedad intelectual</h2>
            <p>
              Todo el contenido, diseño, código y marca de Caleio son propiedad de sus titulares. El uso
              del Servicio no otorga ninguna licencia sobre dichos elementos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">7. Limitación de responsabilidad</h2>
            <p>
              Caleio no será responsable por daños indirectos, lucro cesante ni pérdida de datos derivados
              del uso o imposibilidad de uso del Servicio. La responsabilidad total de Caleio no superará el
              importe abonado por el usuario en los últimos 3 meses.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">8. Modificaciones</h2>
            <p>
              Caleio puede modificar estos Términos en cualquier momento. Los cambios serán notificados por
              email con al menos <strong>15 días</strong> de anticipación. El uso continuado del Servicio
              implica la aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">9. Ley aplicable</h2>
            <p>
              Estos Términos se rigen por las leyes de la República Argentina. Ante cualquier controversia,
              las partes se someten a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de
              Buenos Aires.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">10. Contacto</h2>
            <p>
              Para consultas sobre estos Términos escribí a{" "}
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
