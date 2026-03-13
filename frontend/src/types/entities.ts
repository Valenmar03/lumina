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
  priceFinal?: number;
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


// AGENDA

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
