# Android Build & Installation Guide

## Option 1: EAS Build (Empfohlen für Präsentationen)

Dies erstellt eine echte `.apk`-Datei, die du auf jedem Android-Gerät installieren kannst — **ohne** Expo Go.

### Einmalige Einrichtung

```bash
# EAS CLI global installieren
npm install -g eas-cli

# Bei Expo einloggen (kostenloses Konto reicht)
eas login

# Im Projekt-Ordner: Build-Konfiguration erstellen
cd frontend-expo
eas build:configure
```

### APK bauen

```bash
# Preview-Build (APK zum direkt Installieren)
eas build --platform android --profile preview
```

> **Hinweis:** Beim ersten Mal fragt EAS, ob ein neues Expo-Projekt erstellt werden soll → mit "Yes" bestätigen.
> Der Build läuft in der Cloud und dauert ca. 10-15 Minuten.

### Auf dem Handy installieren

1. Nach dem Build bekommst du einen **Download-Link** im Terminal.
2. Öffne den Link **direkt auf deinem Android-Handy** (z.B. per QR-Code oder Link kopieren).
3. Lade die `.apk` herunter.
4. Android fragt: "Installation aus unbekannter Quelle erlauben?" → **Erlauben**.
5. App installieren → Fertig! 🎉

### Build-Profil in `eas.json` hinzufügen

Falls die Datei `eas.json` noch nicht existiert, erstelle sie im `frontend-expo`-Ordner:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## Option 2: Expo Go (Zum Entwickeln & Testen)

Schnellste Option, aber braucht immer den Dev-Server auf deinem PC.

1. Installiere **Expo Go** aus dem Google Play Store auf deinem Android-Handy.
2. Stelle sicher, dass dein Handy und dein PC im **selben WLAN** sind.
3. Starte den Dev-Server:
   ```bash
   cd frontend-expo
   npm start
   ```
4. Scanne den **QR-Code** im Terminal mit der Expo Go App.

**Nachteil:** Die App läuft nur solange dein PC den Dev-Server offen hat.

---

## Option 3: Lokaler Build (Ohne Expo-Konto)

Falls du keine Cloud-Builds nutzen willst, kannst du auch lokal bauen.
Dafür brauchst du **Android Studio** mit dem Android SDK.

```bash
# Development Build lokal erstellen
npx expo run:android
```

> Erfordert ein per USB verbundenes Android-Gerät oder einen laufenden Android-Emulator.

---

## Empfehlung

| Szenario | Option |
|---|---|
| **Präsentation / Demo** | Option 1 (EAS Build → APK) |
| **Entwicklung / Debugging** | Option 2 (Expo Go) |
| **Volle Kontrolle** | Option 3 (Lokaler Build) |

Für eine Präsentation ist **Option 1** ideal: Du hast eine eigenständige App auf dem Handy, die ohne Laptop funktioniert.
