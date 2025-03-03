# Ramadan Reminder App

A mobile application built with Ionic and Capacitor to help users track Ramadan prayer times, receive notifications for Sehri and Iftar, and get voice reminders.

## Features

- 📅 Ramadan Calendar 2025
- 🕌 Prayer Times based on location
- 🔔 Notifications for Sehri and Iftar
- 🗣️ Voice Reminders with customizable settings
- 🌍 Location-based calculations
- 🌙 Dark mode support

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Android Studio (for Android development)
- Xcode (for iOS development, Mac only)
- Ionic CLI (`npm install -g @ionic/cli`)

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/ramadan-reminder.git
    cd ramadan-reminder
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Install Capacitor plugins:

    ```bash
    npm install @capacitor/core @capacitor/app @capacitor/geolocation @capacitor/local-notifications @capacitor-community/text-to-speech
    ```

## Development

### Running the app in the browser

```bash
ionic serve
```

### Running on Android

1. Build the app:

    ```bash
    ionic build
    ionic cap add android
    ionic cap sync
    ```

2. Open in Android Studio:

    ```bash
    ionic cap open android
    ```

## Building for Release

### Android Release Process

1. Update version numbers using one of the following commands:

    ```bash
    # Patch version (1.0.0 -> 1.0.1)
    npm run release:patch

    # Minor version (1.0.1 -> 1.1.0)
    npm run release:minor

    # Major version (1.1.0 -> 2.0.0)
    npm run release:major
    ```

2. Build the release version:

    ```bash
    ionic build --prod
    ionic cap copy android
    ionic cap sync android
    ```

3. Generate signed APK/Bundle:
   - Open Android Studio: `ionic cap open android`
   - Go to Build → Generate Signed Bundle / APK
   - Choose Android App Bundle
   - Select keystore file (`android/app/ramadan-reminder-key.jks`)
   - Enter keystore credentials
   - Choose release build variant
   - Build the bundle

### Version Management

The app uses automated version management through `standard-version`. Version numbers are synchronized between:

- package.json
- android/variables.gradle
- Android build files

Version format: `MAJOR.MINOR.PATCH`

- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

### Project Structure
