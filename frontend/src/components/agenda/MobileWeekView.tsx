import type { AgendaAppointment } from "../../types/agenda";
import MobileDayView from "./MobileDayView";

type Props = {
  selectedDay: Date;
  appointments: AgendaAppointment[];
  HOURS: number[];
  selectedProfessionalId: string;
  handleSlotClick: (
    date: Date,
    time: string,
    professionalId?: string,
  ) => void;
  handleAppointmentClick: (appointment: AgendaAppointment) => void;
};

export default function MobileWeekView(props: Props) {
  return <MobileDayView {...props} date={props.selectedDay} />;
}