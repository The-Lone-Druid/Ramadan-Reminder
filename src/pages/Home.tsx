import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonNote,
  IonAlert,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react";
import { sunnyOutline, moonOutline, calendarOutline } from "ionicons/icons";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { calculatePrayerTimes, TimingType } from "../utils/prayerTimes";
import { getCoordinates, saveCoordinates } from "../utils/storage";
import { getCurrentRamadanDay, isRamadan, RAMADAN_2025 } from "../utils/dates";
import {
  requestLocationPermission,
  getCurrentLocation,
} from "../utils/location";
import "./Home.css";
import { useRamadanData } from "../hooks/useRamadanData";
import RamadanInfo from "../components/RamadanInfo";
import PrayerTimes from "../components/PrayerTimes";
import Calendar from "../components/Calendar";
import Skeleton from "../components/Skeleton";

const Home: React.FC = () => {
  const { data, loading, error, refresh } = useRamadanData();
  const [times, setTimes] = useState<TimingType | null>(null);
  const [ramadanDay, setRamadanDay] = useState<number | null>(null);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          setLocationError(
            "Location permission is required for accurate prayer times"
          );
          setShowLocationAlert(true);
          return;
        }

        const location = await getCurrentLocation();
        if (!location) {
          setLocationError(
            "Unable to get your location. Please check your device settings."
          );
          setShowLocationAlert(true);
          return;
        }

        saveCoordinates(location);
        const todayTimes = calculatePrayerTimes(new Date(), location);
        setTimes(todayTimes);
        setRamadanDay(getCurrentRamadanDay());
      } catch (error) {
        setLocationError("An error occurred while getting your location");
        setShowLocationAlert(true);
      }
    };

    initializeLocation();
  }, []);

  const getRamadanStatus = () => {
    if (!isRamadan()) {
      const today = new Date();
      if (today < RAMADAN_2025.START) {
        return `Ramadan starts on ${format(
          RAMADAN_2025.START,
          "EEEE, MMMM d, yyyy"
        )}`;
      } else {
        return "Ramadan has ended. See you next year!";
      }
    }
    return `Ramadan Day ${ramadanDay}`;
  };

  const handleRefresh = async (event: CustomEvent) => {
    await refresh();
    event.detail.complete();
  };

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Ramadan App</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="error-message">
            <p>{error}</p>
            <button onClick={refresh}>Try Again</button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ramadan App</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <>
            <Skeleton type="ramadan-info" />
            <Skeleton type="prayer-times" />
            <Skeleton type="calendar" />
          </>
        ) : (
          <div className="home-container">
            <RamadanInfo data={data} />
            <PrayerTimes data={data} />
            <Calendar data={data} />
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;
