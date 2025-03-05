import { LocalNotifications } from "@capacitor/local-notifications";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonLoading,
  IonPage,
  IonRange,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonToast,
} from "@ionic/react";
import {
  informationCircleOutline,
  locationOutline,
  notificationsOutline,
  playCircleOutline,
  volumeHighOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { TTSSettings } from "../types/ramadan";
import {
  getCurrentLocation as getDeviceLocation,
  requestLocationPermission,
} from "../utils/location";
import {
  NotificationSchedule,
  scheduleRamadanNotifications,
  setupNotifications,
  showFullTestNotifications,
} from "../utils/notifications";
import { calculatePrayerTimes } from "../utils/prayerTimes";
import { reminderService } from "../utils/reminderService";
import {
  getCoordinates,
  getDateAdjustment,
  getNotificationSettings,
  getTTSSettings,
  saveCoordinates,
  saveDateAdjustment,
  saveNotificationSettings,
  saveTTSSettings,
} from "../utils/storage";
import "./Settings.css";

const Settings: React.FC = () => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [sehriNotification, setSehriNotification] = useState(true);
  const [iftarNotification, setIftarNotification] = useState(true);
  const [ttsSettings, setTTSSettings] = useState<TTSSettings>(getTTSSettings());
  const [dateAdjustment, setDateAdjustment] = useState(getDateAdjustment());
  const [presentToast] = useIonToast();
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isTestingNotifications, setIsTestingNotifications] = useState(false);

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

  const testVoiceReminders = async () => {
    try {
      setIsTestingVoice(true);
      
      // Check if TTS is enabled
      if (!ttsSettings.enabled) {
        presentToast({
          message: "Voice reminders are disabled. Please enable them first.",
          duration: 3000,
          color: "warning",
        });
        return;
      }
      
      // Test the voice reminder
      const testMessage = "This is a test voice reminder for Ramadan. If you can hear this message, voice reminders are working correctly.";
      const success = await reminderService.testVoiceReminder(testMessage);
      
      if (success) {
        presentToast({
          message: "Voice reminder test successful!",
          duration: 3000,
          color: "success",
        });
      } else {
        presentToast({
          message: "Voice reminder test failed. Please check your device settings.",
          duration: 3000,
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error testing voice reminders:", error);
      presentToast({
        message: "An error occurred while testing voice reminders.",
        duration: 3000,
        color: "danger",
      });
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleTestNotifications = async () => {
    try {
      setIsTestingNotifications(true);
      await showFullTestNotifications();
      // Show success message to user
      presentToast({
        message: "Test notifications will appear in a few seconds!",
        duration: 3000,
        color: "success",
      });
    } catch (error) {
      console.error("Error testing notifications:", error);
      
      // Provide a more specific error message based on the error
      let errorMessage = "Failed to send test notifications. Please check permissions.";
      
      if (error instanceof Error) {
        if (error.message.includes("permission")) {
          errorMessage = "Notification permission is required. Please enable it in your device settings.";
        } else if (error.message.includes("identifier")) {
          errorMessage = "There was an issue with notification IDs. Please try again.";
        }
      }
      
      // Show error message to user
      presentToast({
        message: errorMessage,
        duration: 3000,
        color: "danger",
      });
    } finally {
      setIsTestingNotifications(false);
    }
  };

  const handleDateAdjustmentChange = (checked: boolean) => {
    const newConfig = {
      enabled: checked,
      daysToAdd: checked ? 1 : 0,
      reason: checked ? "Adjusted for Indian moon sighting practice" : "",
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

        <div className="ion-padding">
          {/* Location Settings Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={locationOutline} /> Location Settings
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Latitude</IonLabel>
                <IonInput
                  type="number"
                  value={latitude}
                  onIonChange={(e) => setLatitude(e.detail.value!)}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Longitude</IonLabel>
                <IonInput
                  type="number"
                  value={longitude}
                  onIonChange={(e) => setLongitude(e.detail.value!)}
                />
              </IonItem>

              <IonButton
                expand="block"
                onClick={getCurrentLocation}
                className="ion-margin-top"
              >
                <IonIcon icon={locationOutline} slot="start" />
                Get Current Location
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* Notification Settings Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={notificationsOutline} /> Notification Settings
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel>Sehri Notification</IonLabel>
                <IonToggle
                  checked={sehriNotification}
                  onIonChange={(e) =>
                    handleNotificationChange("sehri", e.detail.checked)
                  }
                />
              </IonItem>

              <IonItem>
                <IonLabel>Iftar Notification</IonLabel>
                <IonToggle
                  checked={iftarNotification}
                  onIonChange={(e) =>
                    handleNotificationChange("iftar", e.detail.checked)
                  }
                />
              </IonItem>
            </IonCardContent>
          </IonCard>

          {/* Voice Settings Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={volumeHighOutline} /> Voice Settings
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel>Enable Voice Reminders</IonLabel>
                <IonToggle
                  checked={ttsSettings.enabled}
                  onIonChange={(e) =>
                    handleTTSChange("enabled", e.detail.checked)
                  }
                />
              </IonItem>

              <IonItem>
                <IonLabel>Voice Language</IonLabel>
                <IonSelect
                  value={ttsSettings.language}
                  onIonChange={(e) =>
                    handleTTSChange("language", e.detail.value)
                  }
                >
                  <IonSelectOption value="en-IN">
                    Indian English
                  </IonSelectOption>
                  <IonSelectOption value="en-US">US English</IonSelectOption>
                  <IonSelectOption value="en-GB">British English</IonSelectOption>
                  <IonSelectOption value="ar-SA">Arabic</IonSelectOption>
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
                <IonLabel>Voice Pitch</IonLabel>
                <IonRange
                  value={ttsSettings.pitch}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onIonChange={(e) => handleTTSChange("pitch", e.detail.value)}
                />
              </IonItem>
              
              <IonButton
                expand="block"
                onClick={testVoiceReminders}
                disabled={!ttsSettings.enabled || isTestingVoice}
                className="ion-margin-vertical"
              >
                <IonIcon icon={volumeHighOutline} slot="start" />
                Test Voice Reminder
              </IonButton>
              
              <p className="settings-description">
                Voice reminders will be spoken aloud at Sehri and Iftar times. Make sure your device volume is turned up.
              </p>
            </IonCardContent>
          </IonCard>

          {/* Date Adjustment Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={informationCircleOutline} /> Date Adjustment
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel>Adjust dates for Indian moon sighting</IonLabel>
                <IonToggle
                  checked={dateAdjustment.enabled}
                  onIonChange={(e) =>
                    handleDateAdjustmentChange(e.detail.checked)
                  }
                />
              </IonItem>
              {dateAdjustment.enabled && (
                <div className="ion-padding-top">
                  <p className="settings-info">
                    <IonIcon icon={informationCircleOutline} />
                    Ramadan dates will be adjusted by adding one day to account
                    for Indian moon sighting practices.
                  </p>
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {/* Test Settings Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={playCircleOutline} /> Test Settings
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p className="settings-description">
                Test your notification and voice settings
              </p>

              <IonButton
                expand="block"
                onClick={testVoiceReminders}
                disabled={isTestingVoice}
                className="ion-margin-vertical"
              >
                <IonIcon icon={volumeHighOutline} slot="start" />
                Test Voice Reminders
              </IonButton>

              <IonButton
                expand="block"
                onClick={handleTestNotifications}
                disabled={isTestingNotifications}
                className="ion-margin-vertical"
              >
                <IonIcon icon={notificationsOutline} slot="start" />
                Test Notifications
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
      <IonLoading
        isOpen={isTestingVoice}
        message="Testing voice reminder..."
      />
      <IonLoading
        isOpen={isTestingNotifications}
        message="Sending test notifications..."
      />
    </IonPage>
  );
};

export default Settings;
