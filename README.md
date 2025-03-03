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
- pnpm (v10 latest only)
- Android Studio (for Android development)
- Xcode (for iOS development, Mac only)
- Ionic CLI (`npm install -g @ionic/cli`)

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/The-Lone-Druid/ramadan-reminder.git
    cd ramadan-reminder
    ```

2. Install dependencies:

    ```bash
    pnpm install
    ```

3. Install Capacitor plugins:

    ```bash
    pnpm install @capacitor/core @capacitor/app @capacitor/geolocation @capacitor/local-notifications @capacitor-community/text-to-speech
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
    pnpm run release:patch

    # Minor version (1.0.1 -> 1.1.0)
    pnpm run release:minor

    # Major version (1.1.0 -> 2.0.0)
    pnpm run release:major
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

## Features in Detail

### Prayer Times Calculation

- Uses the Adhan library for accurate prayer time calculations
- Supports multiple calculation methods
- Automatically adjusts for daylight savings
- Location-based calculations using device GPS

### Notifications System

- Scheduled notifications for Sehri and Iftar
- Customizable notification times
- Persistent across device restarts
- Support for both sound and vibration

### Voice Reminders

- Text-to-Speech (TTS) support
- Customizable voice settings:
  - Language selection
  - Speech rate
  - Volume control
  - Pitch adjustment
- Test functionality in settings

### Location Services

- GPS-based location detection
- Manual coordinate input
- Location caching for offline use
- Permission handling for Android and iOS

### Dark Mode

- System theme detection
- Manual theme toggle
- Consistent styling across components
- Optimized for OLED displays

## Configuration

### Capacitor Configuration

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ramadanreminder.app',
  appName: 'Ramadan Reminder',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_notification",
      iconColor: "#488AFF"
    },
    Geolocation: {
      permissions: {
        android: {
          minSdkVersion: 23
        }
      }
    }
  }
};

export default config;
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_APP_NAME=Ramadan Reminder
VITE_APP_VERSION=1.0.0
```

## Testing

### Unit Tests

```bash
pnpm run test
```

### End-to-End Tests

```bash
pnpm run e2e
```

### Manual Testing Checklist

- [ ] Location detection
- [ ] Prayer time calculations
- [ ] Notification scheduling
- [ ] Voice reminder playback
- [ ] Dark mode switching
- [ ] Settings persistence
- [ ] Offline functionality

## Deployment

### Play Store Deployment Checklist

1. Update version numbers
2. Update changelog
3. Generate signed bundle
4. Test bundle on test device
5. Create store listing:
   - App description
   - Screenshots
   - Feature graphic
   - Privacy policy
6. Submit for review

### Release Notes Template

```markdown
## [Version X.Y.Z] - YYYY-MM-DD

### Added
- New feature 1
- New feature 2

### Changed
- Modified feature 1
- Modified feature 2

### Fixed
- Bug fix 1
- Bug fix 2
```

## Performance Optimization

### Bundle Size Optimization

- Use code splitting
- Lazy load components
- Optimize images
- Minify assets

### Runtime Performance

- Implement virtual scrolling for long lists
- Cache API responses
- Optimize animations
- Use web workers for heavy calculations

## Security

### Data Storage

- Sensitive data encryption
- Secure storage of coordinates
- No cloud storage of personal data

### API Security

- HTTPS only
- Input validation
- Rate limiting
- Error handling

## Support

### Getting Help

- Create an issue in the GitHub repository
- Email support: <support@example.com>
- Twitter: [@The-Lone-Druid](https://twitter.com/The-Lone-Druid)

### Reporting Bugs

1. Use the GitHub issue tracker
2. Include steps to reproduce
3. Include expected vs actual behavior
4. Include screenshots if applicable
5. Include device and OS information

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by [Zahid Shaikh](https://github.com/The-Lone-Druid)
