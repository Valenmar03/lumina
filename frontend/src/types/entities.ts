// ANALYTICS

export type AnalyticsResponse = {
  period: "week" | "month";
  from: string;
  to: string;
  summary: {
    totalAppointments: number;
    completedAppointments: number;
    totalRevenue: number;
    averageTicket: number;
    cancellationRate: number;
    noShowRate: number;
  };
  revenueByDay: Array<{ date: string; revenue: number }>;
  appointmentsByDay: Array<{ date: string; count: number }>;
  topServices: Array<{ name: string; count: number; percentage: number }>;
  peakHours: Array<{ hour: string; count: number }>;
  topProfessionals: Array<{ id: string; name: string; color: string | null; count: number }>;
  revenueByProfessional: Array<{ id: string; name: string; color: string | null; revenue: number }>;
  revenueByPaymentMethod: Array<{ method: string; label: string; count: number; percentage: number }>;
  appointmentsByDayOfWeek: Array<{ day: string; count: number }>;
};

// BUSINESS

export type Business = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  plan: "STARTER" | "PRO";
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  createdAt: string;
};

//CLIENT
export type Client = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  createdAt: string;
  visitsCount?: number;
  totalSpent?: number;
};

export type CreateClientPayload = {
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
};

export type UpdateClientPayload = {
  clientId: string;
  fullName?: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export type ClientAppointments = {
  id: string;
  startAt: string;
  status: string;
  totalPrice?: number;
  service?: {
    id: string;
    name: string;
  };
  professional?: {
    id: string;
    name: string;
    color?: string;
  };
}

//SERVICE
export type Service = {
  id: string;
  businessId: string;
  name: string;
  durationMin: number;
  basePrice: string;
  active: boolean;
  createdAt: string;
  description?: string
};


export type ServiceWithProfessional = {
  id: string;
  name: string;
  durationMin: number;
  basePrice: number;
  active: boolean;
  description?: string;
  professionalServices: {
    professional: {
      id: string;
      name: string;
      active: boolean;
      color?: string;
    };
  }[];
};


export type UpdateServicePayload = {
  serviceId: string;
  name?: string;
  description?: string;
  durationMin?: number;
  basePrice?: number;
  active?: boolean;
};

export type CreateServicePayload = {
  name: string;
  description?: string;
  durationMin: number;
  basePrice: number;
  active?: boolean;
};


//PROFESSIONAL - SERVICE

export type ProfessionalService = {
  professionalId: string;
  serviceId: string;
  businessId: string;
  createdAt: string;
  service: {
    id: string;
    businessId: string;
    name: string;
    durationMin: number;
    basePrice: string;
    active: boolean;
    createdAt: string;
  };
};

export type ProfessionalServicesResponse = {
  services: ProfessionalService[];
};

// AVAILABILITY

export type AvailabilitySlot = {
  startAt: string;
  endAt: string;
  label: string;
};

export type AvailabilityResponse = {
  date: string;
  professionalId: string;
  serviceId: string;
  stepMin: number;
  slots: AvailabilitySlot[];
};


// PROFESSIONAL

export type Professional = {
  id: string;
  businessId: string;
  name: string;
  color?: string | null;
  active: boolean;
  userId?: string | null;
};

export type CreateProfessionalResponse = {
  professional: Professional;
};

export type ScheduleBlock = {
  id: string;
  professionalId?: string;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
};


export type ProfessionalScheduleBlock = {
  id: string;
  businessId: string;
  professionalId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: string;
};

export type CreateProfessionalPayload = {
  name: string;
  color?: string;
  active?: boolean;
};

export type ProfessionalSchedulesResponse = {
  schedules: Record<number, ProfessionalScheduleBlock[]>;
};

export type UpdateProfessionalSchedulesPayload = {
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
};

export type ProfessionalUnavailability = {
  id: string;
  businessId: string;
  professionalId: string;
  startAt: string;
  endAt: string;
  reason?: string | null;
  createdAt: string;
};

export type ConflictingAppointment = {
  id: string;
  startAt: string;
  endAt: string;
  client: { fullName: string };
  service: { name: string };
};


// AGENDA

export type AgendaAppointment = {
  id: string;
  professionalId: string;
  totalPrice?: number
  professional?: {
    id: string;
    name: string;
    color?: string | null;
  };
  client: {
    id: string;
    fullName: string;
  };
  service: {
    id: string;
    name: string;
  };
  startAt: string;
  endAt: string;
  status?: AppointmentStatus;
  isPendingResolution?: boolean;
  depositAmount?: number | string | null;
  depositPaidAt?: string | null;
  depositMethod?: PaymentMethod;
  finalPaymentMethod?: PaymentMethod;
};

export type DailyAgendaResponse = {
  kind: "daily";
  date: string;
  professionalId?: string;
  range: {
    from: string;
    to: string;
  };
  scheduleBlocks?: ScheduleBlock[];
  scheduleBlocksByProfessional?: Record<string, ScheduleBlock[]>;
  appointments: AgendaAppointment[];
};

export type WeeklyAgendaResponse = {
  kind: "weekly";
  date: string;
  professionalId?: string;
  range: {
    from: string;
    to: string;
  };
  scheduleBlocksByDay?: Record<string, ScheduleBlock[]>;
  scheduleBlocksByProfessional?: Record<string, ScheduleBlock[]>;
  appointments: AgendaAppointment[];
};



// APPOINTMENTS

export const AppointmentStatus = {
  RESERVED: "RESERVED",
  DEPOSIT_PAID: "DEPOSIT_PAID",
  CANCELED: "CANCELED",
  NO_SHOW: "NO_SHOW",
  COMPLETED: "COMPLETED",
} as const;

export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export type AppointmentUiStatus =
  | AppointmentStatus
  | "PENDING_RESOLUTION";

export const appointmentStatusLabels: Record<AppointmentUiStatus, string> = {
  [AppointmentStatus.RESERVED]: "Reservado",
  [AppointmentStatus.DEPOSIT_PAID]: "Señado",
  [AppointmentStatus.CANCELED]: "Cancelado",
  [AppointmentStatus.NO_SHOW]: "No asistió",
  [AppointmentStatus.COMPLETED]: "Completado",
  PENDING_RESOLUTION: "Pendiente",
};

export const appointmentStatusColors: Record<AppointmentUiStatus, string> = {
  [AppointmentStatus.RESERVED]: "bg-blue-100 text-blue-700",
  [AppointmentStatus.DEPOSIT_PAID]: "bg-amber-100 text-amber-700",
  [AppointmentStatus.CANCELED]: "bg-red-100 text-red-700",
  [AppointmentStatus.NO_SHOW]: "bg-slate-100 text-slate-700",
  [AppointmentStatus.COMPLETED]: "bg-emerald-100 text-emerald-700",
  PENDING_RESOLUTION: "bg-violet-100 text-violet-700",
};

export type PaymentMethod = "CASH" | "TRANSFER" | "MERCADOPAGO" | "OTHER"

type Option<T> = {
  value: T;
  label: string;
};

export const paymentMethodOptions: Option<PaymentMethod>[] = [
  { value: "CASH", label: "Efectivo" },
  { value: "MERCADOPAGO", label: "Mercado Pago" },
  { value: "TRANSFER", label: "Transferencia Bancaria" },
  { value: "OTHER", label: "Otro" },
];