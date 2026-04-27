<div align="center">

# 🧭 Wegmarken

**Your digital travel diary — capture journeys, share memories, relive moments.**

[![CI/CD Pipeline](https://github.com/DrSommer20/wegmarken/actions/workflows/deploy.yml/badge.svg)](https://github.com/DrSommer20/wegmarken/actions/workflows/deploy.yml)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-blue?style=flat-square)
![Stack](https://img.shields.io/badge/stack-React%20Native%20%2B%20Spring%20Boot-orange?style=flat-square)
![License](https://img.shields.io/badge/license-Private-lightgrey?style=flat-square)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Interactive Map** | Create, move, and explore stops on a world map. |
| 📸 **Bulk Image Upload** | Upload multiple photos at once — automatic assignment via GPS data. |
| 🤖 **Auto-Clustering** | Photos are automatically grouped into stops based on their EXIF geodata (~2km radius). |
| 🏙️ **Reverse Geocoding** | Stops are automatically named after the nearest city or town. |
| 🚗 **Roadtrip Mode** | Sort your stops chronologically and display them as a route. |
| 🧲 **NFC Integration** | Share your trips via NFC tags — scanning opens the app directly! |
| 🔐 **JWT Authentication** | Secure login with persistent tokens. |
| ☁️ **AWS S3 Storage** | All images are safely stored in the cloud. |
| 📱 **Cross-Platform** | Runs natively on Android, iOS, and in any Web Browser. |

## 🏗️ Architecture

```
┌──────────────────────┐       ┌──────────────────────┐       ┌─────────────┐
│   Frontend (Expo)    │──────▶│  Backend (Spring Boot)│──────▶│   AWS S3    │
│  React Native + Web  │  API  │  REST API + JWT Auth  │       │  Images     │
│  Leaflet / MapView   │◀──────│  H2 Database          │       └─────────────┘
└──────────────────────┘       │  EXIF Processing      │       ┌─────────────┐
                               │  Reverse Geocoding    │──────▶│  Nominatim  │
                               └──────────────────────┘       │  OSM API    │
                                                               └─────────────┘
```

## 🚀 Quickstart

### Prerequisites

- **Node.js** ≥ 18
- **Java** ≥ 17
- **Docker** + **Docker Compose** (for deployment)
- **Expo Go** App (for mobile testing)

### Run Frontend (Local)

```bash
cd frontend-expo
cp .env.example .env.local   # Configure your API URL here
npm install
npm start                     # Starts the Expo Dev Server
```

### Run Backend (Local)

```bash
cd backend
./mvnw spring-boot:run
```

### Deployment (Docker)

This project utilizes a **GitHub Actions CI/CD Pipeline** that automatically triggers on every push to `main`:
1. Builds the backend and frontend Docker images.
2. Pushes them to the GitHub Container Registry.
3. Deploys them to the server via SSH.
4. Performs health checks (with auto-rollback on failure).

## 🔧 Configuration

The following **GitHub Secrets** need to be configured for automatic deployment:

| Secret | Description |
|---|---|
| `SERVER_HOST` | Server IP or Hostname |
| `SERVER_USER` | SSH Username |
| `SERVER_SSH_KEY` | Private SSH Key |
| `AWS_S3_BUCKET_NAME` | Name of your S3 Bucket |
| `AWS_S3_REGION` | AWS Region (e.g., `eu-north-1`) |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key |
| `JWT_SECRET` | Secret key for JWT signature |

## 📁 Project Structure

```
wegmarken/
├── backend/                    # Spring Boot REST API
│   ├── src/main/java/com/wegmarken/
│   │   ├── controller/         # REST Endpoints
│   │   ├── domain/             # JPA Entities & Embedded configs
│   │   ├── security/           # JWT Auth & Security Config
│   │   ├── service/            # Business Logic, S3 integration, EXIF parsing
│   │   └── repository/         # Data Access Layer
│   └── Dockerfile
├── frontend-expo/              # React Native (Expo) App
│   ├── app/                    # Screens (File-based Routing via Expo Router)
│   ├── components/             # Reusable UI Components
│   ├── api/                    # Axios API Client
│   ├── services/               # NFC handling, etc.
│   └── Dockerfile
├── docker-compose.prod.yml     # Production Setup
└── .github/workflows/          # CI/CD Pipeline Definitions
```

## 🛣️ Roadmap

- [x] Trip & Stop Management
- [x] Interactive Map with View/Edit Modes
- [x] JWT-based Authentication
- [x] NFC Deep Linking
- [x] AWS S3 Image Upload
- [x] EXIF Auto-Clustering & Reverse Geocoding
- [x] Draggable Map Pins
- [x] Stop Editing & Details
- [x] Fullscreen Image Gallery
- [x] Unassigned Images Manual Assignment
- [ ] Friends System & Shared Trips
- [ ] Trip Editing & Deletion
- [ ] Draw Route lines between stops (Roadtrip mode)
- [ ] Offline Mode support

---

<div align="center">

Built with ❤️ using React Native, Spring Boot & AWS

</div>
