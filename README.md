<div align="center">

# 🧭 Wegmarken

**Dein digitales Reisetagebuch — Reisen festhalten, Erinnerungen teilen, Momente wiedererleben.**

[![CI/CD Pipeline](https://github.com/DrSommer20/wegmarken/actions/workflows/deploy.yml/badge.svg)](https://github.com/DrSommer20/wegmarken/actions/workflows/deploy.yml)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-blue?style=flat-square)
![Stack](https://img.shields.io/badge/stack-React%20Native%20%2B%20Spring%20Boot-orange?style=flat-square)
![License](https://img.shields.io/badge/license-Private-lightgrey?style=flat-square)

</div>

---

## ✨ Features

| Feature | Beschreibung |
|---|---|
| 🗺️ **Interaktive Karte** | Stops auf einer Weltkarte anlegen, verschieben und erkunden |
| 📸 **Bulk-Bild-Upload** | Mehrere Bilder gleichzeitig hochladen — automatische Zuordnung via GPS |
| 🤖 **Auto-Clustering** | Bilder werden anhand ihrer EXIF-Geodaten automatisch zu Stops gruppiert (~2km Radius) |
| 🏙️ **Reverse Geocoding** | Stops werden automatisch nach der nächsten Stadt/dem nächsten Ort benannt |
| 🚗 **Roadtrip-Modus** | Stops chronologisch sortieren und als Route darstellen |
| 🧲 **NFC-Integration** | Reisen per NFC-Tag teilen — Scan öffnet die App direkt |
| 🔐 **JWT-Authentifizierung** | Sichere Anmeldung mit persistenten Tokens |
| ☁️ **AWS S3 Storage** | Bilder werden sicher in der Cloud gespeichert |
| 📱 **Cross-Platform** | Läuft nativ auf Android, iOS und im Web-Browser |

## 🏗️ Architektur

```
┌──────────────────────┐       ┌──────────────────────┐       ┌─────────────┐
│   Frontend (Expo)    │──────▶│  Backend (Spring Boot)│──────▶│   AWS S3    │
│  React Native + Web  │  API  │  REST API + JWT Auth  │       │  Bilder     │
│  Leaflet / MapView   │◀──────│  H2 Database          │       └─────────────┘
└──────────────────────┘       │  EXIF Processing      │       ┌─────────────┐
                               │  Reverse Geocoding    │──────▶│  Nominatim  │
                               └──────────────────────┘       │  OSM API    │
                                                               └─────────────┘
```

## 🚀 Quickstart

### Voraussetzungen

- **Node.js** ≥ 18
- **Java** ≥ 17
- **Docker** + **Docker Compose** (für Deployment)
- **Expo Go** App (zum Testen auf dem Handy)

### Frontend starten (lokal)

```bash
cd frontend-expo
cp .env.example .env.local   # API-URL konfigurieren
npm install
npm start                     # Expo Dev Server
```

### Backend starten (lokal)

```bash
cd backend
./mvnw spring-boot:run
```

### Deployment (Docker)

Das Projekt nutzt eine **GitHub Actions CI/CD Pipeline**, die automatisch bei jedem Push auf `main`:
1. Backend- und Frontend-Docker-Images baut
2. Sie in die GitHub Container Registry pusht
3. Per SSH auf dem Server deployt
4. Health-Checks durchführt (mit Auto-Rollback bei Fehler)

## 🔧 Konfiguration

Folgende **GitHub Secrets** müssen für das automatische Deployment gesetzt sein:

| Secret | Beschreibung |
|---|---|
| `SERVER_HOST` | IP/Hostname des Servers |
| `SERVER_USER` | SSH-Benutzername |
| `SERVER_SSH_KEY` | Privater SSH-Schlüssel |
| `AWS_S3_BUCKET_NAME` | Name des S3-Buckets |
| `AWS_S3_REGION` | AWS-Region (z.B. `eu-north-1`) |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key |
| `JWT_SECRET` | Geheimer Schlüssel für JWT-Tokens |

## 📁 Projektstruktur

```
wegmarken/
├── backend/                    # Spring Boot REST API
│   ├── src/main/java/com/wegmarken/
│   │   ├── controller/         # REST Endpoints
│   │   ├── domain/             # JPA Entities
│   │   ├── security/           # JWT Auth & Security Config
│   │   ├── service/            # Business Logic, S3, EXIF
│   │   └── repository/         # Data Access Layer
│   └── Dockerfile
├── frontend-expo/              # React Native (Expo) App
│   ├── app/                    # Screens (File-based Routing)
│   ├── components/             # Wiederverwendbare Komponenten
│   ├── api/                    # API Client (Axios)
│   ├── services/               # NFC, etc.
│   └── Dockerfile
├── docker-compose.prod.yml     # Produktions-Setup
└── .github/workflows/          # CI/CD Pipeline
```

## 🛣️ Roadmap

- [x] Trip & Stop Management
- [x] Interaktive Karte mit View/Edit-Modi
- [x] JWT-basierte Authentifizierung
- [x] NFC Deep Linking
- [x] AWS S3 Bild-Upload
- [x] EXIF Auto-Clustering & Reverse Geocoding
- [x] Draggable Pins
- [x] Stop bearbeiten
- [x] Vollbild-Bildansicht
- [ ] Freunde-System & geteilte Reisen
- [ ] Trip löschen & bearbeiten
- [ ] Bilder manuell Stops zuordnen
- [ ] Route zwischen Stops zeichnen (Roadtrip)
- [ ] Offline-Modus

---

<div align="center">

Built with ❤️ using React Native, Spring Boot & AWS

</div>
