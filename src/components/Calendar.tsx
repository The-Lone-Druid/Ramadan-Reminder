import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonIcon } from "@ionic/react";
import { format, isSameDay } from "date-fns";
import { calendarOutline, star } from "ionicons/icons";
import { getCurrentRamadanDates } from "../utils/dates";
import "./Calendar.css";

interface RamadanData {
  prayerTimes: {
    date: Date;
    sehri: Date;
    iftar: Date;
  }[];
}

interface CalendarProps {
  data: RamadanData | null;
}

const Calendar: React.FC<CalendarProps> = ({ data }) => {
  if (!data) return null;

  const today = new Date();
  const ramadanDates = getCurrentRamadanDates();

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={calendarOutline} className="calendar-icon" />
          Ramadan Calendar {ramadanDates.YEAR}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <div className="calendar-header">
                <span>Date</span>
                <span>Sehri</span>
                <span>Iftar</span>
              </div>
            </IonCol>
          </IonRow>
          {data.prayerTimes.map((day, index) => {
            const isCurrentDay = isSameDay(day.date, today);
            return (
              <IonRow key={index}>
                <IonCol size="12">
                  <div className={`calendar-row ${isCurrentDay ? 'current-day' : ''}`}>
                    <span className="date-cell">
                      {isCurrentDay && <IonIcon icon={star} className="current-day-icon" />}
                      {format(day.date, "MMM d")}
                      {isCurrentDay && <span className="today-badge">Today</span>}
                    </span>
                    <span className={`time-cell ${isCurrentDay ? 'current-day-time' : ''}`}>
                      {format(day.sehri, "h:mm a")}
                    </span>
                    <span className={`time-cell ${isCurrentDay ? 'current-day-time' : ''}`}>
                      {format(day.iftar, "h:mm a")}
                    </span>
                  </div>
                </IonCol>
              </IonRow>
            );
          })}
        </IonGrid>
      </IonCardContent>
    </IonCard>
  );
};

export default Calendar; 