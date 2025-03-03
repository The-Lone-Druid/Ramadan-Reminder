import { Coordinates } from "adhan";

type EventCallback = (coordinates: Coordinates) => void;

class LocationEventEmitter {
  private listeners: EventCallback[] = [];

  subscribe(callback: EventCallback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  emit(coordinates: Coordinates) {
    this.listeners.forEach(callback => callback(coordinates));
  }
}

export const locationEvents = new LocationEventEmitter(); 