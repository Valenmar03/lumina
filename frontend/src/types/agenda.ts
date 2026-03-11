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