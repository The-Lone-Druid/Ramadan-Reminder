import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  IonSkeletonText,
  IonAccordionGroup,
  IonAccordion,
} from "@ionic/react";
import { format, isBefore, startOfDay } from "date-fns";
import { useEffect, useState } from "react";
import { calculatePrayerTimes, TimingType } from "../utils/prayerTimes";
import { getCoordinates } from "../utils/storage";
import { getRamadanDates } from "../utils/dates";
import "./Calendar.css";

interface DayTiming extends TimingType {
  date: Date;
  dayNumber: number;
  isToday: boolean;
}

const Calendar: React.FC = () => {
  const [timings, setTimings] = useState<DayTiming[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateMonthTimings = () => {
    setIsLoading(true);
    setError(null);
    const coordinates = getCoordinates();
    const ramadanDates = getRamadanDates();

    if (!coordinates) {
      setError(
        "Location not set. Please set your location in Settings to view prayer times."
      );
      setIsLoading(false);
      return;
    }

    const days = ramadanDates.map(({ date, dayNumber, isToday }) => {
      const times = calculatePrayerTimes(date, coordinates);
      return {
        ...times,
        date,
        dayNumber,
        isToday,
      };
    });

    setTimings(days);
    setIsLoading(false);
  };

  useEffect(() => {
    calculateMonthTimings();
  }, []);

  const handleRefresh = (event: CustomEvent) => {
    calculateMonthTimings();
    event.detail.complete();
  };

  const renderSkeletonCard = () => (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonSkeletonText animated style={{ width: "60%" }} />
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonItem lines="none">
          <IonLabel>
            <h2>
              <IonSkeletonText animated style={{ width: "40%" }} />
            </h2>
            <p>
              <IonSkeletonText animated style={{ width: "30%" }} />
            </p>
          </IonLabel>
        </IonItem>
        <IonItem lines="none">
          <IonLabel>
            <h2>
              <IonSkeletonText animated style={{ width: "40%" }} />
            </h2>
            <p>
              <IonSkeletonText animated style={{ width: "30%" }} />
            </p>
          </IonLabel>
        </IonItem>
      </IonCardContent>
    </IonCard>
  );

  const renderDayCard = (timing: DayTiming) => (
    <IonCard
      key={timing.dayNumber}
      className={timing.isToday ? "today-card" : ""}
    >
      <IonCardHeader>
        <IonCardTitle>
          Day {timing.dayNumber} - {format(timing.date, "EEEE, MMMM d")}
          {timing.isToday && (
            <IonBadge color="primary" className="ion-margin-start">
              Today
            </IonBadge>
          )}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonItem lines="none">
          <IonLabel>
            <h2>Sehri Ends</h2>
            <p>{format(timing.sehri, "h:mm a")}</p>
          </IonLabel>
        </IonItem>
        <IonItem lines="none">
          <IonLabel>
            <h2>Iftar Time</h2>
            <p>{format(timing.iftar, "h:mm a")}</p>
          </IonLabel>
        </IonItem>
      </IonCardContent>
    </IonCard>
  );

  const renderPastDaysList = (pastDays: DayTiming[]) => (
    <IonAccordionGroup expand="inset">
      <IonAccordion value="past-days">
        <IonItem slot="header">
          <IonLabel>
            <h2>Past Days</h2>
            <h5>{pastDays.length} days completed</h5>
          </IonLabel>
        </IonItem>
        <div className="ion-padding" slot="content">
          {pastDays.map((timing) => (
            <IonItem key={timing.dayNumber} className="past-day-item">
              <IonLabel>
                <h2>
                  Day {timing.dayNumber} - {format(timing.date, "MMM d")}
                </h2>
                <p>
                  Sehri: {format(timing.sehri, "h:mm a")} | Iftar:{" "}
                  {format(timing.iftar, "h:mm a")}
                </p>
              </IonLabel>
            </IonItem>
          ))}
        </div>
      </IonAccordion>
    </IonAccordionGroup>
  );

  const today = startOfDay(new Date());
  const pastDays = timings.filter((timing) => isBefore(timing.date, today));
  const futureDays = timings.filter((timing) => !isBefore(timing.date, today));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ramadan Calendar</IonTitle>
          {/* <IonButtons slot="end">
            <IonButton onClick={testReminders}>
              <IonIcon slot="icon-only" icon={notificationsOutline} />
            </IonButton>
            <IonButton onClick={() => reminderService.stopSpeaking()}>
              <IonIcon slot="icon-only" icon={notificationsOutline} />
            </IonButton>
          </IonButtons> */}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Ramadan Calendar</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="calendar-container">
          {error ? (
            <IonCard>
              <IonCardContent>
                <IonItem lines="none">
                  <IonLabel color="danger">{error}</IonLabel>
                </IonItem>
              </IonCardContent>
            </IonCard>
          ) : isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>{renderSkeletonCard()}</div>
            ))
          ) : (
            <>
              {pastDays.length > 0 && renderPastDaysList(pastDays)}
              {futureDays.map(renderDayCard)}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Calendar;
