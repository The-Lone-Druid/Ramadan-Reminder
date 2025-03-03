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
  timeOutline,
  calendarClearOutline,
} from "ionicons/icons";
import { StatusBar, Style } from "@capacitor/status-bar";
import { App as CapacitorApp } from "@capacitor/app";
import { useEffect } from "react";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import PrayerTimes from "./pages/PrayerTimes";
import Calendar from "./pages/Calendar";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
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

setupIonicReact({
  mode: "md",
});

const App: React.FC = () => {
  useEffect(() => {
    const setupStatusBar = async () => {
      try {
        const info = await CapacitorApp.getInfo();
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

    setupStatusBar();
  }, []);

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
