import { format, parseISO } from "date-fns";
import { AlertCircle, Check, CheckCircle2, Clock3, Trash2, UserX2 } from "lucide-react";
import {
  appointmentStatusLabels,
  paymentMethodOptions,
  type AgendaAppointment,
  type AppointmentUiStatus,
} from "../../types/entities";
import type { ReactNode } from "react";

type StatusUi = {
  label: string;
  badgeClasses: string;
  icon: ReactNode;
};

const statusUiMap: Record<AppointmentUiStatus, StatusUi> = {
  RESERVED: {
    label: appointmentStatusLabels.RESERVED,
    badgeClasses: "border-cyan-200 bg-cyan-50 text-cyan-700",
    icon: <Clock3 className="h-3.5 w-3.5" />,
  },
  DEPOSIT_PAID: {
    label: appointmentStatusLabels.DEPOSIT_PAID,
    badgeClasses: "border-teal-200 bg-teal-50 text-teal-700",
    icon: <Check className="h-3.5 w-3.5" />,
  },
  CANCELED: {
    label: appointmentStatusLabels.CANCELED,
    badgeClasses: "border-red-200 bg-red-50 text-red-700",
    icon: <Trash2 className="h-3.5 w-3.5" />,
  },
  NO_SHOW: {
    label: appointmentStatusLabels.NO_SHOW,
    badgeClasses: "border-amber-200 bg-amber-50 text-amber-700",
    icon: <UserX2 className="h-3.5 w-3.5" />,
  },
  COMPLETED: {
    label: appointmentStatusLabels.COMPLETED,
    badgeClasses: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  PENDING_RESOLUTION: {
    label: appointmentStatusLabels.PENDING_RESOLUTION,
    badgeClasses: "border-violet-200 bg-violet-50 text-violet-700",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
};

function getStatusUi(status?: AppointmentUiStatus): StatusUi {
  if (!status) {
    return {
      label: "Sin estado",
      badgeClasses: "border-slate-200 bg-slate-50 text-slate-700",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    };
  }

  return statusUiMap[status];
}

type Props = {
  appointment: AgendaAppointment;
  effectiveStatus: AppointmentUiStatus | undefined;
  isCanceled: boolean;
  isCompleted: boolean;
};

export default function SummaryDetail({
  appointment,
  effectiveStatus,
  isCanceled,
  isCompleted,
}: Props) {
  const currentStatusUi = getStatusUi(effectiveStatus);

  const depositMethodLabel = paymentMethodOptions.find(
    (option) => option.value === appointment?.depositMethod
  )?.label;

  const finalPaymentMethodLabel = paymentMethodOptions.find(
    (option) => option.value === appointment?.finalPaymentMethod
  )?.label;

  const totalPrice = Number(appointment.totalPrice ?? 0);
  const depositAmount = Number(appointment.depositAmount ?? 0);
  const remainingAmount = Math.max(totalPrice - depositAmount, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-800">Resumen del turno</p>

          <p className="text-sm text-slate-600">
            {appointment.client.fullName} · {appointment.service.name} ·{" "}
            {format(parseISO(appointment.startAt), "dd/MM/yyyy HH:mm")}
          </p>

          <div className="mt-2 space-y-1">
            <p className="text-sm text-slate-600">
              Precio del servicio:{" "}
              <span className="font-semibold text-slate-800">
                ${totalPrice.toLocaleString("es-AR")}
              </span>
            </p>

            {depositAmount > 0 && (
              <p className="text-sm text-slate-600">
                Seña registrada:{" "}
                <span className="font-semibold text-teal-700">
                  ${depositAmount.toLocaleString("es-AR")}
                </span>
                {depositMethodLabel && <> - {depositMethodLabel}</>}
              </p>
            )}

            <p className="text-sm text-slate-600">
              Saldo restante:{" "}
              <span className="font-semibold text-emerald-700">
                ${remainingAmount.toLocaleString("es-AR")}
              </span>
              {finalPaymentMethodLabel && <> - {finalPaymentMethodLabel}</>}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${currentStatusUi.badgeClasses}`}
        >
          {currentStatusUi.icon}
          {currentStatusUi.label}
        </span>
      </div>

      {isCanceled && (
        <p className="mt-3 text-xs text-red-600">
          Este turno está cancelado. No se puede editar.
        </p>
      )}

      {isCompleted && (
        <p className="mt-3 text-xs text-emerald-700">
          Este turno está completado. No se puede editar.
        </p>
      )}
    </div>
  );
}