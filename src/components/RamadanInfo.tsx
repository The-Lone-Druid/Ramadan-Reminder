import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import { format } from "date-fns";
import { RamadanData } from "../types/ramadan";
import { isRamadan, RAMADAN_2025 } from "../utils/dates";
import { calendarNumberOutline, timeOutline, moonOutline } from "ionicons/icons";
import "./RamadanInfo.css";

interface RamadanInfoProps {
  data: RamadanData | null;
}

const RamadanInfo: React.FC<RamadanInfoProps> = ({ data }) => {
  if (!data) return null;

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
    return `Ramadan Day ${data.currentDay}`;
  };

  const getDaysRemaining = () => {
    if (!isRamadan()) {
      if (new Date() < RAMADAN_2025.START) {
        const days = Math.ceil((RAMADAN_2025.START.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return `${days} days until Ramadan`;
      }
      return "Ramadan has ended";
    }
    return `${data.totalDays - data.currentDay} days remaining`;
  };

  return (
    <IonCard className="ramadan-info-card">
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={moonOutline} className="ramadan-icon" />
          Ramadan Status
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="status-section">
          <h2 className="status-title">{getRamadanStatus()}</h2>
          <p className="status-subtitle">{getDaysRemaining()}</p>
        </div>
        
        <IonGrid className="info-grid">
          <IonRow>
            <IonCol size="6">
              <div className="info-item">
                <IonIcon icon={calendarNumberOutline} className="info-icon" />
                <div className="info-content">
                  <span className="info-label">Current Day</span>
                  <span className="info-value">{data.currentDay}</span>
                </div>
              </div>
            </IonCol>
            <IonCol size="6">
              <div className="info-item">
                <IonIcon icon={timeOutline} className="info-icon" />
                <div className="info-content">
                  <span className="info-label">Total Days</span>
                  <span className="info-value">{data.totalDays}</span>
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonCardContent>
    </IonCard>
  );
};

export default RamadanInfo;
