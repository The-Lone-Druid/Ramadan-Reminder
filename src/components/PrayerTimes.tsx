import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonIcon } from "@ionic/react";
import { sunnyOutline, moonOutline } from "ionicons/icons";
import { format } from "date-fns";
import { RamadanData } from "../types/ramadan";

interface PrayerTimesProps {
  data: RamadanData | null;
}

const PrayerTimes: React.FC<PrayerTimesProps> = ({ data }) => {
  if (!data) return null;

  const todayTimes = data.prayerTimes[0];

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Today's Prayer Times</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonItem lines="none">
          <IonIcon icon={moonOutline} slot="start" />
          <IonLabel>
            <h2>Sehri Ends</h2>
            <p>{format(todayTimes.sehri, "h:mm a")}</p>
          </IonLabel>
        </IonItem>
        <IonItem lines="none">
          <IonIcon icon={sunnyOutline} slot="start" />
          <IonLabel>
            <h2>Iftar Time</h2>
            <p>{format(todayTimes.iftar, "h:mm a")}</p>
          </IonLabel>
        </IonItem>
      </IonCardContent>
    </IonCard>
  );
};

export default PrayerTimes; 