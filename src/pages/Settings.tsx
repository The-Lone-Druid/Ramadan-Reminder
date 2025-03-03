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
} from '@ionic/react';
import { locationOutline, notificationsOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { Coordinates } from 'adhan';
import { saveCoordinates, getCoordinates, saveNotificationSettings, getNotificationSettings } from '../utils/storage';
import { scheduleNotifications, checkNotificationPermissions } from '../utils/notifications';
import { calculatePrayerTimes } from '../utils/prayerTimes';
import './Settings.css';

const Settings: React.FC = () => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [sehriNotification, setSehriNotification] = useState(true);
  const [iftarNotification, setIftarNotification] = useState(true);
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
          saveCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          updateNotifications({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          presentToast({
            message: 'Location updated successfully!',
            duration: 2000,
            position: 'bottom',
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          presentToast({
            message: 'Error getting location. Please enter coordinates manually.',
            duration: 3000,
            position: 'bottom',
            color: 'danger',
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
        message: 'Please enter valid coordinates',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
      });
      return;
    }

    const coordinates: Coordinates = { latitude: lat, longitude: lng };
    saveCoordinates(coordinates);
    updateNotifications(coordinates);
    presentToast({
      message: 'Settings saved successfully!',
      duration: 2000,
      position: 'bottom',
    });
  };

  const updateNotifications = async (coordinates: Coordinates) => {
    if (sehriNotification || iftarNotification) {
      const hasPermission = await checkNotificationPermissions();
      if (!hasPermission) {
        presentToast({
          message: 'Please enable notifications in your device settings',
          duration: 3000,
          position: 'bottom',
          color: 'warning',
        });
        return;
      }

      const times = calculatePrayerTimes(new Date(), coordinates);
      await scheduleNotifications(times);
    }
  };

  const handleNotificationChange = (type: 'sehri' | 'iftar', checked: boolean) => {
    if (type === 'sehri') {
      setSehriNotification(checked);
    } else {
      setIftarNotification(checked);
    }

    saveNotificationSettings({
      sehri: type === 'sehri' ? checked : sehriNotification,
      iftar: type === 'iftar' ? checked : iftarNotification,
    });

    updateNotifications(getCoordinates());
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
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
              onIonChange={e => setLatitude(e.detail.value!)}
              onIonBlur={handleCoordinateChange}
            />
          </IonItem>
          
          <IonItem>
            <IonIcon icon={locationOutline} slot="start" />
            <IonLabel position="stacked">Longitude</IonLabel>
            <IonInput
              type="number"
              value={longitude}
              onIonChange={e => setLongitude(e.detail.value!)}
              onIonBlur={handleCoordinateChange}
            />
          </IonItem>

          <IonButton expand="block" onClick={getCurrentLocation} className="ion-margin">
            Get Current Location
          </IonButton>

          <IonItem>
            <IonIcon icon={notificationsOutline} slot="start" />
            <IonLabel>Sehri Notification</IonLabel>
            <IonToggle
              checked={sehriNotification}
              onIonChange={e => handleNotificationChange('sehri', e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={notificationsOutline} slot="start" />
            <IonLabel>Iftar Notification</IonLabel>
            <IonToggle
              checked={iftarNotification}
              onIonChange={e => handleNotificationChange('iftar', e.detail.checked)}
            />
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Settings; 