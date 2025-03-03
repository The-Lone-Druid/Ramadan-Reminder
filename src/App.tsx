import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route } from "react-router-dom";
import {
  settingsOutline,
  homeOutline,
  calendarClearOutline,
  timeOutline,
} from "ionicons/icons";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Calendar from "./pages/Calendar";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect } from "react";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.css";
import "./theme/tabs.css";
import PrayerTimes from "./pages/PrayerTimes";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.ramadanreminder.app";
const MARKET_URL = "market://details?id=com.ramadanreminder.app";
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    setupStatusBar();
    checkForUpdate();

    // Set up periodic update checks
    const updateInterval = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL);
    return () => clearInterval(updateInterval);
  }, []);

  const setupStatusBar = async () => {
    try {
      const info = await CapApp.getInfo();
      // Check if not running on web
      if (info.name !== "web") {
        // Show status bar and set style
        await StatusBar.show();
        await StatusBar.setStyle({ style: Style.Dark });

        // Set status bar background color and overlay
        await StatusBar.setBackgroundColor({ color: "#1f1f1f" });
        await StatusBar.setOverlaysWebView({ overlay: false });
      }
    } catch (error) {
      console.error("Error setting up status bar:", error);
    }
  };

  const checkForUpdate = async () => {
    try {
      const lastUpdateCheck = localStorage.getItem('lastUpdateCheck');
      const now = Date.now();

      // Only check once per day
      if (lastUpdateCheck && now - parseInt(lastUpdateCheck) < UPDATE_CHECK_INTERVAL) {
        return;
      }

      // Store the check time
      localStorage.setItem('lastUpdateCheck', now.toString());

      // Add listener for app url open (handles Play Store return)
      CapApp.addListener("appUrlOpen", (data) => {
        console.log("App opened with URL:", data);
      });

      // Check if Play Store is available
      try {
        await Browser.open({ url: MARKET_URL });
        await Browser.close();
      } catch (error) {
        console.log('Play Store check failed:', error);
        return; // Don't show update prompt if Play Store isn't accessible
      }

      // If we get here, show update prompt
      const confirmed = window.confirm(
        "A new version of Ramadan Reminder might be available. Would you like to check for updates?"
      );

      if (confirmed) {
        try {
          // Try opening in Play Store app first
          await Browser.open({ url: MARKET_URL });
        } catch {
          // Fallback to web URL if Play Store app isn't available
          await Browser.open({ url: PLAY_STORE_URL });
        }
      }
    } catch (error) {
      console.error("Error in update check:", error);
    }
  };

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/home">
              <Home />
            </Route>
            <Route exact path="/calendar">
              <Calendar />
            </Route>
            <Route exact path="/prayer-times">
              <PrayerTimes />
            </Route>
            <Route path="/settings">
              <Settings />
            </Route>
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="home" href="/home">
              <IonIcon icon={homeOutline} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>
            <IonTabButton tab="calendar" href="/calendar">
              <IonIcon icon={calendarClearOutline} />
              <IonLabel>Calendar</IonLabel>
            </IonTabButton>
            <IonTabButton tab="prayer-times" href="/prayer-times">
              <IonIcon icon={timeOutline} />
              <IonLabel>Prayer Times</IonLabel>
            </IonTabButton>
            <IonTabButton tab="settings" href="/settings">
              <IonIcon icon={settingsOutline} />
              <IonLabel>Settings</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
