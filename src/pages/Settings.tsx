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
  IonCardHeader,
  IonCardTitle,
} from "@ionic/react";
import {
  locationOutline,
  notificationsOutline,
  playCircleOutline,
  informationCircleOutline,
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
  getDateAdjustment,
  saveDateAdjustment,
} from "../utils/storage";
import {
  setupNotifications,
  scheduleRamadanNotifications,
  NotificationSchedule,
} from "../utils/notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { calculatePrayerTimes } from "../utils/prayerTimes";
import { TTSSettings } from "../types/ramadan";
import { reminderService } from "../utils/reminderService";
import {
  requestLocationPermission,
  getCurrentLocation as getDeviceLocation,
} from "../utils/location";
import "./Settings.css";

const Settings: React.FC = () => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [sehriNotification, setSehriNotification] = useState(true);
  const [iftarNotification, setIftarNotification] = useState(true);
  const [ttsSettings, setTTSSettings] = useState<TTSSettings>(getTTSSettings());
  const [dateAdjustment, setDateAdjustment] = useState(getDateAdjustment());
  const [presentToast] = useIonToast();

  useEffect(() => {
    const initializeSettings = async () => {
      try {
        // Load saved settings
        const coordinates = getCoordinates();
        if (coordinates) {
          setLatitude(coordinates.latitude.toString());
          setLongitude(coordinates.longitude.toString());
        } else {
          setLatitude("");
          setLongitude("");
        }

        const notificationSettings = getNotificationSettings();
        setSehriNotification(notificationSettings.sehri);
        setIftarNotification(notificationSettings.iftar);

        // Request permissions immediately
        const permResult = await LocalNotifications.checkPermissions();
        if (permResult.display !== "granted") {
          const requestResult = await LocalNotifications.requestPermissions();
          if (requestResult.display === "granted") {
            // Setup notifications if permission was just granted
            await setupNotifications();
            if (notificationSettings.sehri || notificationSettings.iftar) {
              // Only schedule notifications if we have valid coordinates
              if (coordinates) {
                // Calculate prayer times and schedule notifications
                const times = calculatePrayerTimes(new Date(), coordinates);
                const schedule: NotificationSchedule = {
                  sehriTime: times.sehri,
                  iftarTime: times.iftar,
                  dayNumber: 1,
                };
                await scheduleRamadanNotifications([schedule]);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error initializing settings:", error);
        presentToast({
          message: "Error initializing settings. Please try again.",
          duration: 3000,
          position: "bottom",
          color: "danger",
        });
      }
    };

    initializeSettings();
  }, [presentToast]);

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        presentToast({
          message:
            "Location permission is required. Please enable it in your device settings.",
          duration: 3000,
          position: "bottom",
          color: "warning",
        });
        return;
      }

      const location = await getDeviceLocation();

      if (location.error) {
        presentToast({
          message: location.error,
          duration: 3000,
          position: "bottom",
          color: "danger",
        });
        return;
      }

      setLatitude(location.latitude.toString());
      setLongitude(location.longitude.toString());
      saveCoordinates({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      updateNotifications(location.latitude, location.longitude);
      presentToast({
        message: "Location updated successfully!",
        duration: 2000,
        position: "bottom",
        color: "success",
      });
    } catch (error) {
      console.error("Error getting location:", error);
      presentToast({
        message: "Error getting location. Please try again.",
        duration: 3000,
        position: "bottom",
        color: "danger",
      });
    }
  };

  const handleCoordinateChange = () => {
    if (!latitude || !longitude) {
      presentToast({
        message: "Please enter both latitude and longitude",
        duration: 3000,
        position: "bottom",
        color: "danger",
      });
      return;
    }

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
    updateNotifications(lat, lng);
    presentToast({
      message: "Settings saved successfully!",
      duration: 2000,
      position: "bottom",
      color: "success",
    });
  };

  const updateNotifications = async (latitude: number, longitude: number) => {
    if (sehriNotification || iftarNotification) {
      // First check permissions
      const permResult = await LocalNotifications.checkPermissions();

      // If not granted, request permissions
      if (permResult.display !== "granted") {
        const requestResult = await LocalNotifications.requestPermissions();
        if (requestResult.display !== "granted") {
          presentToast({
            message:
              "Notifications permission is required. Please enable it in your device settings.",
            duration: 3000,
            position: "bottom",
            color: "warning",
          });
          return;
        }
      }

      // Setup notifications first
      const setupSuccess = await setupNotifications();
      if (!setupSuccess) {
        presentToast({
          message: "Failed to setup notifications",
          duration: 3000,
          position: "bottom",
          color: "danger",
        });
        return;
      }

      // Calculate prayer times and schedule notifications
      const times = calculatePrayerTimes(new Date(), { latitude, longitude });
      const schedule: NotificationSchedule = {
        sehriTime: times.sehri,
        iftarTime: times.iftar,
        dayNumber: 1, // For testing purposes
      };

      const scheduleSuccess = await scheduleRamadanNotifications([schedule]);
      if (!scheduleSuccess) {
        presentToast({
          message: "Failed to schedule notifications",
          duration: 3000,
          position: "bottom",
          color: "danger",
        });
        return;
      }

      presentToast({
        message: "Notifications scheduled successfully",
        duration: 2000,
        position: "bottom",
        color: "success",
      });
    }
  };

  const handleNotificationChange = async (
    type: "sehri" | "iftar",
    checked: boolean
  ) => {
    // If enabling notifications, check and request permissions first
    if (checked) {
      const permResult = await LocalNotifications.checkPermissions();
      if (permResult.display !== "granted") {
        const requestResult = await LocalNotifications.requestPermissions();
        if (requestResult.display !== "granted") {
          presentToast({
            message:
              "Notifications permission is required. Please enable it in your device settings.",
            duration: 3000,
            position: "bottom",
            color: "warning",
          });
          return;
        }
      }
    }

    if (type === "sehri") {
      setSehriNotification(checked);
    } else {
      setIftarNotification(checked);
    }

    saveNotificationSettings({
      sehri: type === "sehri" ? checked : sehriNotification,
      iftar: type === "iftar" ? checked : iftarNotification,
    });

    if (checked) {
      updateNotifications(parseFloat(latitude), parseFloat(longitude));
    }
  };

  const handleTTSChange = (
    key: keyof TTSSettings,
    value: number | string | boolean | { lower: number; upper: number }
  ) => {
    const newSettings = {
      ...ttsSettings,
      [key]:
        typeof value === "object" && "lower" in value ? value.lower : value,
    };
    setTTSSettings(newSettings);
    saveTTSSettings(newSettings);
  };

  const testVoiceReminders = () => {
    reminderService.testReminders();
  };

  const testNotifications = async () => {
    // First check and request permissions if needed
    const permResult = await LocalNotifications.checkPermissions();
    if (permResult.display !== "granted") {
      const requestResult = await LocalNotifications.requestPermissions();
      if (requestResult.display !== "granted") {
        presentToast({
          message: "Notifications permission is required for testing.",
          duration: 3000,
          position: "bottom",
          color: "warning",
        });
        return;
      }
    }

    // Create a test schedule for immediate notification
    const testSchedule: NotificationSchedule = {
      sehriTime: new Date(Date.now() + 10000), // 10 seconds from now
      iftarTime: new Date(Date.now() + 20000), // 20 seconds from now
      dayNumber: 1,
    };

    const setupSuccess = await setupNotifications();
    if (!setupSuccess) {
      presentToast({
        message: "Failed to setup notifications",
        duration: 3000,
        position: "bottom",
        color: "danger",
      });
      return;
    }

    await scheduleRamadanNotifications([testSchedule]);

    presentToast({
      message: "Test notifications scheduled! Check in 10-20 seconds.",
      duration: 2000,
      position: "bottom",
      color: "success",
    });
  };

  const handleDateAdjustmentChange = (checked: boolean) => {
    const newConfig = {
      enabled: checked,
      daysToAdd: checked ? 1 : 0,
      reason: checked ? 'Adjusted for Indian moon sighting practice' : '',
    };
    
    setDateAdjustment(newConfig);
    saveDateAdjustment(newConfig);
    
    // Refresh data after changing date adjustment
    window.location.reload();
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

          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Date Adjustment</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel>Adjust dates for Indian moon sighting</IonLabel>
                <IonToggle
                  checked={dateAdjustment.enabled}
                  onIonChange={e => handleDateAdjustmentChange(e.detail.checked)}
                />
              </IonItem>
              {dateAdjustment.enabled && (
                <p className="ion-padding-start ion-padding-top">
                  <IonIcon icon={informationCircleOutline} /> 
                  Ramadan dates will be adjusted by adding one day to account for Indian moon sighting practices.
                </p>
              )}
            </IonCardContent>
          </IonCard>

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
