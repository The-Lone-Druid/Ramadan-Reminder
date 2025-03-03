import { IonCard, IonCardHeader, IonCardContent, IonGrid, IonRow, IonCol } from "@ionic/react";
import "./Skeleton.css";

interface SkeletonProps {
  type: "ramadan-info" | "prayer-times" | "calendar";
}

const Skeleton: React.FC<SkeletonProps> = ({ type }) => {
  if (type === "ramadan-info") {
    return (
      <IonCard className="skeleton-card">
        <IonCardHeader>
          <div className="skeleton-header">
            <div className="skeleton-icon"></div>
            <div className="skeleton-title"></div>
          </div>
        </IonCardHeader>
        <IonCardContent>
          <div className="skeleton-status">
            <div className="skeleton-text"></div>
            <div className="skeleton-text"></div>
          </div>
          <IonGrid>
            <IonRow>
              <IonCol size="6">
                <div className="skeleton-info-item">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-info-content">
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text"></div>
                  </div>
                </div>
              </IonCol>
              <IonCol size="6">
                <div className="skeleton-info-item">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-info-content">
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text"></div>
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>
    );
  }

  if (type === "prayer-times") {
    return (
      <IonCard className="skeleton-card">
        <IonCardHeader>
          <div className="skeleton-header">
            <div className="skeleton-icon"></div>
            <div className="skeleton-title"></div>
          </div>
        </IonCardHeader>
        <IonCardContent>
          <div className="skeleton-prayer-times">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="skeleton-prayer-item">
                <div className="skeleton-icon"></div>
                <div className="skeleton-text"></div>
              </div>
            ))}
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard className="skeleton-card">
      <IonCardHeader>
        <div className="skeleton-header">
          <div className="skeleton-icon"></div>
          <div className="skeleton-title"></div>
        </div>
      </IonCardHeader>
      <IonCardContent>
        <div className="skeleton-calendar-header">
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
        </div>
        <div className="skeleton-calendar-rows">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="skeleton-calendar-row">
              <div className="skeleton-text"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text"></div>
            </div>
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default Skeleton; 