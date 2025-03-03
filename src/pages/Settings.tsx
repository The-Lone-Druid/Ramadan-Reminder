import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonInput,
  IonButton,
  IonIcon,
  useIonToast,
  IonRange,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import {
  locationOutline,
  notificationsOutline,
  playCircleOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { Coordinates } from "adhan";
import {
  saveCoordinates,
  getCoordinates,
  saveNotificationSettings,
  getNotificationSettings,
  getTTSSettings,
  saveTTSSettings,
} from "../utils/storage";
import {
  scheduleNotifications,
  checkNotificationPermissions,
} from "../utils/notifications";
import { calculatePrayerTimes } from "../utils/prayerTimes";
import { TTSSettings } from "../types/ramadan";
import { reminderService } from "../utils/reminderService";
import "./Settings.css";

const Settings: React.FC = () => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [sehriNotification, setSehriNotification] = useState(true);
  const [iftarNotification, setIftarNotification] = useState(true);
  const [ttsSettings, setTTSSettings] = useState<TTSSettings>(getTTSSettings());
  const [presentToast] = useIonToast();

  useEffect(() => {
    // Load saved settings
    const coordinates = getCoordinates();
    setLatitude(coordinates.latitude.toString());
    setLongitude(coordinates.longitude.toString());

    const notificationSettings = getNotificationSettings();
    setSehriNotification(notificationSettings.sehri);
    setIftarNotification(notificationSettings.iftar);
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude.toString();
          const newLng = position.coords.longitude.toString();
          setLatitude(newLat);
          setLongitude(newLng);
          saveCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          updateNotifications({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          presentToast({
            message: "Location updated successfully!",
            duration: 2000,
            position: "bottom",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          presentToast({
            message:
              "Error getting location. Please enter coordinates manually.",
            duration: 3000,
            position: "bottom",
            color: "danger",
          });
        }
      );
    }
  };

  const handleCoordinateChange = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      presentToast({
        message: "Please enter valid coordinates",
        duration: 3000,
        position: "bottom",
        color: "danger",
      });
      return;
    }

    const coordinates: Coordinates = { latitude: lat, longitude: lng };
    saveCoordinates(coordinates);
    updateNotifications(coordinates);
    presentToast({
      message: "Settings saved successfully!",
      duration: 2000,
      position: "bottom",
    });
  };

  const updateNotifications = async (coordinates: Coordinates) => {
    if (sehriNotification || iftarNotification) {
      const hasPermission = await checkNotificationPermissions();
      if (!hasPermission) {
        presentToast({
          message: "Please enable notifications in your device settings",
          duration: 3000,
          position: "bottom",
          color: "warning",
        });
        return;
      }

      const times = calculatePrayerTimes(new Date(), coordinates);
      await scheduleNotifications(times);
    }
  };

  const handleNotificationChange = (
    type: "sehri" | "iftar",
    checked: boolean
  ) => {
    if (type === "sehri") {
      setSehriNotification(checked);
    } else {
      setIftarNotification(checked);
    }

    saveNotificationSettings({
      sehri: type === "sehri" ? checked : sehriNotification,
      iftar: type === "iftar" ? checked : iftarNotification,
    });

    updateNotifications(getCoordinates());
  };

  const handleTTSChange = (key: keyof TTSSettings, value: any) => {
    const newSettings = {
      ...ttsSettings,
      [key]: value,
    };
    setTTSSettings(newSettings);
    saveTTSSettings(newSettings);
  };

  const testVoiceReminders = () => {
    reminderService.testReminders();
  };

  const testNotifications = async () => {
    const times = calculatePrayerTimes(new Date(), getCoordinates());
    await scheduleNotifications(times);
    presentToast({
      message: "Test notifications scheduled!",
      duration: 2000,
      position: "bottom",
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Settings</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonList className="ion-padding">
          <IonItem>
            <IonIcon icon={locationOutline} slot="start" />
            <IonLabel position="stacked">Latitude</IonLabel>
            <IonInput
              type="number"
              value={latitude}
              onIonChange={(e) => setLatitude(e.detail.value!)}
              onIonBlur={handleCoordinateChange}
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={locationOutline} slot="start" />
            <IonLabel position="stacked">Longitude</IonLabel>
            <IonInput
              type="number"
              value={longitude}
              onIonChange={(e) => setLongitude(e.detail.value!)}
              onIonBlur={handleCoordinateChange}
            />
          </IonItem>

          <IonButton
            expand="block"
            onClick={getCurrentLocation}
            className="ion-margin"
          >
            Get Current Location
          </IonButton>

          <IonItem>
            <IonIcon icon={notificationsOutline} slot="start" />
            <IonLabel>Sehri Notification</IonLabel>
            <IonToggle
              checked={sehriNotification}
              onIonChange={(e) =>
                handleNotificationChange("sehri", e.detail.checked)
              }
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={notificationsOutline} slot="start" />
            <IonLabel>Iftar Notification</IonLabel>
            <IonToggle
              checked={iftarNotification}
              onIonChange={(e) =>
                handleNotificationChange("iftar", e.detail.checked)
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel>Voice Settings</IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>Enable Voice Reminders</IonLabel>
            <IonToggle
              checked={ttsSettings.enabled}
              onIonChange={(e) => handleTTSChange("enabled", e.detail.checked)}
            />
          </IonItem>
          <IonItem>
            <IonLabel>Voice Language</IonLabel>
            <IonSelect
              value={ttsSettings.language}
              onIonChange={(e) => handleTTSChange("language", e.detail.value)}
            >
              <IonSelectOption value="en-IN">Indian English</IonSelectOption>
              <IonSelectOption value="en-US">US English</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel>Voice Volume</IonLabel>
            <IonRange
              value={ttsSettings.volume}
              min={0}
              max={1}
              step={0.1}
              onIonChange={(e) => handleTTSChange("volume", e.detail.value)}
            />
          </IonItem>
          <IonItem>
            <IonLabel>Speech Rate</IonLabel>
            <IonRange
              value={ttsSettings.rate}
              min={0.5}
              max={2}
              step={0.1}
              onIonChange={(e) => handleTTSChange("rate", e.detail.value)}
            />
          </IonItem>
          <IonItem>
            <IonLabel>Speech Pitch</IonLabel>
            <IonRange
              value={ttsSettings.pitch}
              min={0.5}
              max={2}
              step={0.1}
              onIonChange={(e) => handleTTSChange("pitch", e.detail.value)}
            />
          </IonItem>

          <IonCard className="ion-margin-top">
            <IonCardContent>
              <h2>Test Settings</h2>
              <p>Test your notification and voice settings</p>

              <IonButton
                expand="block"
                onClick={testVoiceReminders}
                className="ion-margin-vertical"
              >
                <IonIcon icon={playCircleOutline} slot="start" />
                Test Voice Reminders
              </IonButton>

              <IonButton
                expand="block"
                onClick={testNotifications}
                className="ion-margin-vertical"
              >
                <IonIcon icon={notificationsOutline} slot="start" />
                Test Notifications
              </IonButton>
            </IonCardContent>
          </IonCard>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
