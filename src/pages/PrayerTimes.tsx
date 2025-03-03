import React from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from "@ionic/react";
import { sunnyOutline, moonOutline, timeOutline } from "ionicons/icons";
import { format } from "date-fns";
import { useRamadanData } from "../hooks/useRamadanData";
import Skeleton from "../components/Skeleton";
import "./PrayerTimes.css";

const PrayerTimes: React.FC = () => {
  const { data, loading, refresh } = useRamadanData();

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refresh();
    event.detail.complete();
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Prayer Times</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="prayer-times-container">
            <Skeleton type="prayer-times" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const todaysPrayerTimes = data?.prayerTimes.find((day) => day.isToday);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Prayer Times</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="prayer-times-container">
          {/* Obligatory Prayers Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={timeOutline} /> Obligatory Prayers
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="ion-margin-top">
              <div className="prayer-times-grid">
                <div className="prayer-time-item">
                  <span className="prayer-name">Fajr</span>
                  <span className="prayer-time">
                    {todaysPrayerTimes
                      ? format(todaysPrayerTimes.fajr, "hh:mm a")
                      : "--:--"}
                  </span>
                </div>
                <div className="prayer-time-item">
                  <span className="prayer-name">Dhuhr</span>
                  <span className="prayer-time">
                    {todaysPrayerTimes
                      ? format(todaysPrayerTimes.dhuhr, "hh:mm a")
                      : "--:--"}
                  </span>
                </div>
                <div className="prayer-time-item">
                  <span className="prayer-name">Asr</span>
                  <span className="prayer-time">
                    {todaysPrayerTimes
                      ? format(todaysPrayerTimes.asr, "hh:mm a")
                      : "--:--"}
                  </span>
                </div>
                <div className="prayer-time-item">
                  <span className="prayer-name">Maghrib</span>
                  <span className="prayer-time">
                    {todaysPrayerTimes
                      ? format(todaysPrayerTimes.maghrib, "hh:mm a")
                      : "--:--"}
                  </span>
                </div>
                <div className="prayer-time-item">
                  <span className="prayer-name">Isha</span>
                  <span className="prayer-time">
                    {todaysPrayerTimes
                      ? format(todaysPrayerTimes.isha, "hh:mm a")
                      : "--:--"}
                  </span>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Sun Times Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={sunnyOutline} /> Sun Times
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="ion-margin-top">
              <div className="sun-times-grid">
                <div className="prayer-time-item">
                  <span className="prayer-name">Sunrise</span>
                  <span className="prayer-time">
                    {todaysPrayerTimes
                      ? format(todaysPrayerTimes.sunrise, "hh:mm a")
                      : "--:--"}
                  </span>
                </div>
                <div className="prayer-time-item">
                  <span className="prayer-name">Sunset</span>
                  <span className="prayer-time">
                    {todaysPrayerTimes
                      ? format(todaysPrayerTimes.sunset, "hh:mm a")
                      : "--:--"}
                  </span>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Nafil Times Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={moonOutline} /> Nafil Prayer Times
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="ion-margin-top">
              <div className="nafil-times-grid">
                <div className="prayer-time-item">
                  <span className="prayer-name">Ishraq</span>
                  <span className="prayer-time">
                    {todaysPrayerTimes
                      ? format(
                          new Date(
                            todaysPrayerTimes.sunrise.getTime() + 20 * 60000
                          ),
                          "hh:mm a"
                        )
                      : "--:--"}
                  </span>
                  <span className="prayer-note">20 mins after sunrise</span>
                </div>
                <div className="prayer-time-item">
                  <span className="prayer-name">Chasht</span>
                  <span className="prayer-time">
                    {todaysPrayerTimes
                      ? format(
                          new Date(
                            todaysPrayerTimes.sunrise.getTime() + 45 * 60000
                          ),
                          "hh:mm a"
                        )
                      : "--:--"}
                  </span>
                  <span className="prayer-note">45 mins after sunrise</span>
                </div>
                <div className="prayer-time-item">
                  <span className="prayer-name">Awwabin</span>
                  <span className="prayer-time">
                    {todaysPrayerTimes
                      ? format(
                          new Date(
                            todaysPrayerTimes.maghrib.getTime() + 20 * 60000
                          ),
                          "hh:mm a"
                        )
                      : "--:--"}
                  </span>
                  <span className="prayer-note">20 mins after maghrib</span>
                </div>
                <div className="prayer-time-item">
                  <span className="prayer-name">Tahajjud</span>
                  <span className="prayer-time">Last 1/3 of night</span>
                  <span className="prayer-note">
                    Best time for night prayer
                  </span>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PrayerTimes;
