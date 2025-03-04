import React from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
} from "@ionic/react";
import { useRamadanData } from "../hooks/useRamadanData";
import { isRamadan, getCurrentRamadanDates } from "../utils/dates";
import { format } from "date-fns";
import Skeleton from "../components/Skeleton";
import {
  calendarOutline,
  moonOutline,
  timeOutline,
  informationCircleOutline,
  todayOutline,
} from "ionicons/icons";
import "./Home.css";

const Home: React.FC = () => {
  const { data, loading, error, refresh } = useRamadanData();
  const isRamadanActive = isRamadan();
  const ramadanDates = getCurrentRamadanDates();

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refresh();
    event.detail.complete();
  };

  const getProgressPercentage = () => {
    if (!data || !isRamadanActive) return 0;
    return Math.round((data.currentDay / data.totalDays) * 100);
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Ramadan {ramadanDates.YEAR}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="home-container">
            <Skeleton type="ramadan-info" />
            <Skeleton type="calendar" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error || !data) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Ramadan {ramadanDates.YEAR}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="home-container">
            <IonCard>
              <IonCardContent>
                <div className="error-message">
                  <IonIcon
                    icon={informationCircleOutline}
                    color="warning"
                    size="large"
                    className="error-icon"
                  />
                  <p>{error || "Unable to load prayer times"}</p>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ramadan {ramadanDates.YEAR}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-container">
          {/* Analytics Card */}
          <IonCard className="analytics-card">
            <IonCardContent>
              <div className="analytics-header">
                <div className="analytics-title">
                  <IonIcon icon={moonOutline} />
                  <h2>Ramadan Progress</h2>
                </div>
                {ramadanDates.dateAdjustment && (
                  <div className="date-badge">
                    <IonIcon icon={informationCircleOutline} />
                    <span>Dates Adjusted</span>
                  </div>
                )}
              </div>

              <div className="analytics-grid">
                <div className="analytics-item">
                  <IonIcon icon={todayOutline} />
                  <div className="analytics-content">
                    <span className="analytics-label">Current Day</span>
                    <span className="analytics-value">
                      {data?.prayerTimes.find((day) => day.isToday)
                        ?.dayNumber || 0}
                    </span>
                  </div>
                </div>

                <div className="analytics-item">
                  <IonIcon icon={calendarOutline} />
                  <div className="analytics-content">
                    <span className="analytics-label">Total Days</span>
                    <span className="analytics-value">
                      {data?.totalDays || 30}
                    </span>
                  </div>
                </div>

                <div className="analytics-item">
                  <IonIcon icon={timeOutline} />
                  <div className="analytics-content">
                    <span className="analytics-label">Progress</span>
                    <span className="analytics-value">
                      {getProgressPercentage()}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>

              <div className="date-range">
                <div>
                  <span className="date-label">Starts</span>
                  <span className="date-value">
                    {format(
                      data?.prayerTimes[0].date || ramadanDates.START,
                      "MMMM d, yyyy"
                    )}
                  </span>
                </div>
                <div>
                  <span className="date-label">Ends</span>
                  <span className="date-value">
                    {format(
                      data?.prayerTimes[data.prayerTimes.length - 1].date ||
                        ramadanDates.END,
                      "MMMM d, yyyy"
                    )}
                  </span>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Prayer Times Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Today's Fasting Times</IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="ion-margin-top">
              {data?.prayerTimes.find((day) => day.isToday) ? (
                <div className="prayer-times-grid">
                  <div className="prayer-time">
                    <span className="time-label">Sehri</span>
                    <span className="time-value">
                      {format(
                        data.prayerTimes.find((day) => day.isToday)!.sehri,
                        "hh:mm a"
                      )}
                    </span>
                  </div>
                  <div className="prayer-time">
                    <span className="time-label">Iftar</span>
                    <span className="time-value">
                      {format(
                        data.prayerTimes.find((day) => day.isToday)!.iftar,
                        "hh:mm a"
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="no-times">
                  Prayer times will be displayed during Ramadan
                </p>
              )}
            </IonCardContent>
          </IonCard>

          {/* Calendar Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Calendar</IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="ion-margin-top">
              <div className="calendar-grid">
                {data?.prayerTimes.map((day) => (
                  <div
                    key={day.dayNumber}
                    className={`calendar-day ${
                      day.isToday ? "current-day" : ""
                    }`}
                  >
                    <div className="day-number">{day.dayNumber}</div>
                    <div className="day-date">{format(day.date, "MMM d")}</div>
                  </div>
                ))}
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
