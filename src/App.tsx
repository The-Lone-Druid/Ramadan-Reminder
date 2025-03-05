import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { StatusBar, Style } from "@capacitor/status-bar";
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
import {
  calendarClearOutline,
  homeOutline,
  settingsOutline,
  timeOutline,
} from "ionicons/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Redirect, Route } from "react-router-dom";
import Calendar from "./pages/Calendar";
import Home from "./pages/Home";
import Settings from "./pages/Settings";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/display.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";

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
import { Preferences } from "@capacitor/preferences";
import PermissionsModal from "./components/PermissionsModal";
import PrayerTimes from "./pages/PrayerTimes";
import "./theme/tabs.css";
import "./theme/variables.css";
import { removeNotificationListeners } from "./utils/notifications";
import {
  checkPermissions,
  PermissionStatus,
  requestPermissions,
} from "./utils/permissions";
import { reminderService } from "./utils/reminderService";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.ramadanreminder.app";
const MARKET_URL = "market://details?id=com.ramadanreminder.app";
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const PERMISSIONS_STORAGE_KEY = "ramadan-permissions-granted";
const NAVIGATION_DEBOUNCE_MS = 300; // Debounce time for navigation actions

setupIonicReact({
  // Add ripple effects: false to improve performance
  rippleEffect: false,
  // Reduce motion for better performance
  animated: true,
});

const App: React.FC = () => {
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissions, setPermissions] = useState<PermissionStatus>({
    location: false,
    notifications: false,
  });
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  
  // Use refs to track component mount state and pending operations
  const isMountedRef = useRef(true);
  const pendingOperationsRef = useRef<AbortController[]>([]);
  const lastNavigationRef = useRef<number>(0);
  
  // Helper to create and track abort controllers
  const createAbortController = useCallback(() => {
    const controller = new AbortController();
    pendingOperationsRef.current.push(controller);
    return controller;
  }, []);
  
  // Helper to update permissions state safely
  const updatePermissions = useCallback((newPermissions: PermissionStatus) => {
    if (isMountedRef.current) {
      setPermissions(newPermissions);
    }
  }, []);
  
  // Helper to update permission checked state safely
  const updatePermissionsChecked = useCallback((checked: boolean) => {
    if (isMountedRef.current) {
      setPermissionsChecked(checked);
    }
  }, []);
  
  // Helper to update modal visibility safely
  const updateModalVisibility = useCallback((visible: boolean) => {
    if (isMountedRef.current) {
      setShowPermissionsModal(visible);
    }
  }, []);

  const checkInitialPermissions = useCallback(async () => {
    try {
      const controller = createAbortController();
      
      // First check if we've already stored that permissions were granted
      const storedPermissions = await Preferences.get({ key: PERMISSIONS_STORAGE_KEY });
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) return;
      
      const permissionsGranted = storedPermissions.value === 'true';
      
      if (permissionsGranted) {
        // Double-check that permissions are still granted
        const currentPermissions = await checkPermissions();
        
        // Check if operation was aborted
        if (controller.signal.aborted || !isMountedRef.current) return;
        
        if (currentPermissions.location && currentPermissions.notifications) {
          // All permissions are still granted
          updatePermissions(currentPermissions);
          updatePermissionsChecked(true);
          
          // Remove this controller from pending operations
          pendingOperationsRef.current = pendingOperationsRef.current.filter(c => c !== controller);
          return;
        }
      }
      
      // If we get here, we need to check permissions normally
      const currentPermissions = await checkPermissions();
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) return;
      
      updatePermissions(currentPermissions);
      updatePermissionsChecked(true);

      // Show modal if any permission is missing
      if (!currentPermissions.location || !currentPermissions.notifications) {
        updateModalVisibility(true);
      } else {
        // Store that permissions were granted
        await Preferences.set({ key: PERMISSIONS_STORAGE_KEY, value: 'true' });
      }
      
      // Remove this controller from pending operations
      pendingOperationsRef.current = pendingOperationsRef.current.filter(c => c !== controller);
    } catch (error) {
      console.error("Error checking permissions:", error);
      if (isMountedRef.current) {
        updatePermissionsChecked(true);
        updateModalVisibility(true);
      }
    }
  }, [createAbortController, updatePermissions, updatePermissionsChecked, updateModalVisibility]);

  const refresh = useCallback(() => {
    // Debounce navigation actions to prevent rapid navigation
    const now = Date.now();
    if (now - lastNavigationRef.current < NAVIGATION_DEBOUNCE_MS) {
      console.log("Navigation action debounced");
      return;
    }
    lastNavigationRef.current = now;
    
    window.location.reload();
  }, []);

  const handleRequestPermissions = useCallback(async () => {
    try {
      const controller = createAbortController();
      
      const newPermissions = await requestPermissions();
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) return;
      
      updatePermissions(newPermissions);
      
      // Close modal if all permissions are granted
      if (newPermissions.location && newPermissions.notifications) {
        updateModalVisibility(false);
        
        // Store that permissions were granted
        await Preferences.set({ key: PERMISSIONS_STORAGE_KEY, value: 'true' });
        
        // Check if operation was aborted
        if (controller.signal.aborted || !isMountedRef.current) return;
        
        // Refresh data to get accurate prayer times with new location
        refresh();
      }
      
      // Remove this controller from pending operations
      pendingOperationsRef.current = pendingOperationsRef.current.filter(c => c !== controller);
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  }, [createAbortController, updatePermissions, updateModalVisibility, refresh]);

  const setupStatusBar = useCallback(async () => {
    try {
      const controller = createAbortController();
      
      const info = await CapApp.getInfo();
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) return;
      
      // Check if not running on web
      if (info.name !== "web") {
        // Show status bar and set style
        await StatusBar.show();
        await StatusBar.setStyle({ style: Style.Dark });

        // Set status bar background color and overlay
        await StatusBar.setBackgroundColor({ color: "#1f1f1f" });
        await StatusBar.setOverlaysWebView({ overlay: false });
      }
      
      // Remove this controller from pending operations
      pendingOperationsRef.current = pendingOperationsRef.current.filter(c => c !== controller);
    } catch (error) {
      console.error("Error setting up status bar:", error);
    }
  }, [createAbortController]);

  const checkForUpdate = useCallback(async () => {
    try {
      const controller = createAbortController();
      
      const lastUpdateCheck = localStorage.getItem("lastUpdateCheck");
      const now = Date.now();

      // Only check once per day
      if (
        lastUpdateCheck &&
        now - parseInt(lastUpdateCheck) < UPDATE_CHECK_INTERVAL
      ) {
        return;
      }

      // Store the check time
      localStorage.setItem("lastUpdateCheck", now.toString());

      // Add listener for app url open (handles Play Store return)
      const urlListener = await CapApp.addListener("appUrlOpen", (data) => {
        console.log("App opened with URL:", data);
      });
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) {
        urlListener.remove();
        return;
      }

      // Check if Play Store is available
      try {
        await Browser.open({ url: MARKET_URL });
        await Browser.close();
      } catch (error) {
        console.log("Play Store check failed:", error);
        
        // Remove this controller from pending operations
        pendingOperationsRef.current = pendingOperationsRef.current.filter(c => c !== controller);
        return; // Don't show update prompt if Play Store isn't accessible
      }
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) {
        urlListener.remove();
        return;
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
      
      // Remove this controller from pending operations
      pendingOperationsRef.current = pendingOperationsRef.current.filter(c => c !== controller);
    } catch (error) {
      console.error("Error in update check:", error);
    }
  }, [createAbortController]);

  useEffect(() => {
    isMountedRef.current = true;
    
    setupStatusBar();
    checkForUpdate();
    checkInitialPermissions();

    // Set up periodic update checks
    const updateInterval = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL);
    
    return () => {
      isMountedRef.current = false;
      
      // Abort all pending operations when component unmounts
      pendingOperationsRef.current.forEach(controller => {
        controller.abort();
      });
      pendingOperationsRef.current = [];
      
      clearInterval(updateInterval);
      removeNotificationListeners();
      
      // Clean up reminderService
      reminderService.destroy();
    };
  }, [setupStatusBar, checkForUpdate, checkInitialPermissions]);

  // Don't render anything until permissions are checked to prevent flash of permission modal
  if (!permissionsChecked) {
    return null;
  }

  return (
    <>
      <PermissionsModal
        isOpen={showPermissionsModal}
        permissions={permissions}
        onRequestPermissions={handleRequestPermissions}
        onClose={() => updateModalVisibility(false)}
      />
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
    </>
  );
};

export default App;
