export type Client = {
  id: string;
  businessId: string;
  fullName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
};

export type Service = {
  id: string;
  businessId: string;
  name: string;
  durationMin: number;
  basePrice: string;
  active: boolean;
  createdAt: string;
};

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

export type Professional = {
  id: string;
  businessId: string;
  name: string;
  color?: string | null;
  active: boolean;
};

export type AgendaAppointment = {
  id: string;
  professionalId: string;
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
  status?: string;
  isPendingResolution?: boolean;
};

export type ScheduleBlock = {
  id: string;
  professionalId?: string;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
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

export type ProfessionalScheduleBlock = {
  id: string;
  businessId: string;
  professionalId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: string;
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