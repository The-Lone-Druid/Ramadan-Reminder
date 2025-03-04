import React from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
} from "@ionic/react";
import {
  locationOutline,
  notificationsOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from "ionicons/icons";
import { PermissionStatus } from "../utils/permissions";

interface PermissionsModalProps {
  isOpen: boolean;
  permissions: PermissionStatus;
  onRequestPermissions: () => Promise<void>;
  onClose: () => void;
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  permissions,
  onRequestPermissions,
  onClose,
}) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>App Permissions</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="ion-padding">
          <h2>Welcome to Ramadan Reminder!</h2>
          <p>
            To provide you with accurate prayer times and reminders, we need the
            following permissions:
          </p>

          <IonList>
            <IonItem>
              <IonIcon icon={locationOutline} slot="start" />
              <IonLabel>
                <h2>Location</h2>
                <p>Required for accurate prayer times based on your location</p>
              </IonLabel>
              <IonIcon
                color={permissions.location ? "success" : "danger"}
                icon={
                  permissions.location
                    ? checkmarkCircleOutline
                    : closeCircleOutline
                }
                slot="end"
              />
            </IonItem>

            <IonItem>
              <IonIcon icon={notificationsOutline} slot="start" />
              <IonLabel>
                <h2>Notifications</h2>
                <p>Required for Sehri and Iftar reminders</p>
              </IonLabel>
              <IonIcon
                color={permissions.notifications ? "success" : "danger"}
                icon={
                  permissions.notifications
                    ? checkmarkCircleOutline
                    : closeCircleOutline
                }
                slot="end"
              />
            </IonItem>
          </IonList>

          {(!permissions.location || !permissions.notifications) && (
            <IonNote color="danger" className="ion-padding">
              Some permissions are not granted. The app may not work correctly
              without these permissions.
            </IonNote>
          )}

          <div className="ion-padding">
            {!permissions.location || !permissions.notifications ? (
              <IonButton expand="block" onClick={onRequestPermissions}>
                Grant Permissions
              </IonButton>
            ) : (
              <IonButton expand="block" onClick={onClose}>
                Continue
              </IonButton>
            )}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PermissionsModal;
