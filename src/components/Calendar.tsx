import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonIcon } from "@ionic/react";
import { format, isToday, isSameDay } from "date-fns";
import { RamadanData } from "../types/ramadan";
import { calendarOutline, star } from "ionicons/icons";
import "./Calendar.css";

interface CalendarProps {
  data: RamadanData | null;
}

const Calendar: React.FC<CalendarProps> = ({ data }) => {
  if (!data) return null;

  const today = new Date();

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={calendarOutline} className="calendar-icon" />
          Ramadan Calendar 2025
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