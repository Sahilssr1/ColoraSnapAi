<p align="center">
  <img src="assets/logo.png" width="180" height="180" alt="SnapCalora AI Logo" style="border-radius: 36px; box-shadow: 0 10px 25px rgba(34, 197, 94, 0.25);" />
</p>

<h1 align="center">SnapCalora AI</h1>

<p align="center">
  <strong>Snap. Scan. Track. Eat Smarter.</strong><br>
  An enterprise-grade, visual AI nutrition & intelligent fitness tracking platform built with React Native and Node.js.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK_51-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK 51" />
  <img src="https://img.shields.io/badge/React_Native-0.74-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Groq-Vision_AI-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq AI" />
  <img src="https://img.shields.io/badge/Open_Food_Facts-Open_Source-FF6B6B?style=for-the-badge" alt="Open Food Facts" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon_Cloud-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge" alt="License MIT" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [1. Visual AI Food Recognition (Groq Vision)](#1--visual-ai-food-recognition-groq-vision)
  - [2. Open-Source Barcode Scanner (Open Food Facts)](#2--open-source-barcode-scanner-open-food-facts)
  - [3. Apple Health-Inspired Telemetry Dashboard](#3--apple-health-inspired-telemetry-dashboard)
  - [4. Instant Launch & Offline Session Persistence](#4--instant-launch--offline-session-persistence)
  - [5. Clinical Nutrition & BMR/TDEE Engine](#5--clinical-nutrition--bmrtdee-engine)
- [System Architecture](#️-system-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Mobile App Setup](#mobile-app-setup)
- [Build & Deployment](#-build--deployment)
  - [Android APK / Play Store AAB (EAS Build)](#android-apk--play-store-aab-eas-build)
  - [Render Cloud Deployment](#render-cloud-deployment)
- [Environment Configuration](#-environment-configuration)
- [License](#-license)

---

## 🌟 Overview

**SnapCalora AI** is a production-grade health and fitness ecosystem designed to eliminate manual food logging. By combining cutting-edge multimodal Vision AI with real-time motion sensor tracking and open-source nutritional databases, SnapCalora AI enables users to understand their nutrition and caloric balance with sub-second camera recognition.

Whether you're snapping a photo of a home-cooked meal, scanning a packaged product barcode at the grocery store, or monitoring steps and active burn throughout the day, SnapCalora AI delivers clinical precision in an Apple Health-inspired user interface.

---

## ✨ Key Features

### 1. 📸 Visual AI Food Recognition (Groq Vision)
- **High-Speed Multimodal Inference**: Powered by Groq's high-throughput LPU engine running open-weights multimodal vision (`qwen/qwen3.8-27b`) delivering sub-2s meal analysis.
- **Multi-Item Ingredient Segmentation**: Accurately recognizes individual food components on a single plate (e.g., grilled chicken breast, quinoa, avocado slices, leafy greens).
- **30+ Nutrient Panel**: Calculates exact Calories, Macros (Protein, Net Carbs, Fats), Dietary Fiber, Sugars, Sodium, Micronutrients (Vitamins A, B, C, D, E, K, Iron, Calcium, Zinc, Potassium, Magnesium, Omega-3), and Glycemic Load.
- **Portion Multiplier**: Interactive portion adjustment (0.5×, 1.0×, 1.5×, 2.0×) with dynamic recalculation of all nutrients.

### 2. ⚡ Open-Source Barcode Scanner (Open Food Facts)
- **Global Food Database Integration**: Direct interface with **Open Food Facts**, the world's largest open-source, non-profit packaged food repository (over 3,000,000 products).
- **Smart Code Normalization**: Automatically resolves UPC-A (12-digit) and EAN-13 (13-digit zero-padded) variants and queries both v2 and v0 API endpoints.
- **Resilient Client-Side Fallback**: Built-in direct client querying ensures instant barcode matches even if the backend server is waking up or cold-starting.

### 3. 🍏 Apple Health-Inspired Telemetry Dashboard
- **Live Hardware Step Tracker**: Native Android sensor integration with a persistent foreground tracker that runs reliably while the app is minimized or the screen is locked.
- **Concentric SVG Progress Rings**: Live rings visualising active calorie burn, exercise minutes, and daily step goal completion.
- **Clinical Sleep Tracker**: Log sleep duration and receive automated clinical sleep scores (0–100) with recovery feedback.
- **Hydration Tracker**: One-tap quick water logging (+250ml / +500ml) with interactive hydration progress bars.
- **Modern Adaptive Theme**: Instant toggle between Apple Health Dark Theme (`#111827`) and Clean Light Theme (`#F9FAFB`).

### 4. ⚡ Instant Launch & Offline Session Persistence
- **Sub-350ms Launch Time**: Zero artificial startup delays; loads directly to the dashboard in under 350ms.
- **Offline Session Caching**: Secure local profile caching preserves user sessions indefinitely across app closes, preventing accidental logouts.
- **Silent Background Sync**: Refreshes profile biometrics in the background without blocking the UI or disrupting the user.

### 5. 🔬 Clinical Nutrition & BMR/TDEE Engine
- **Mifflin-St Jeor Formula**: Calculates Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) tailored to age, gender, height, weight, and activity level.
- **RDA Micronutrient Comparison**: Evaluates daily micronutrient consumption against clinical Recommended Dietary Allowances.

---

## 🏗️ System Architecture

```
SnapCalora/
├── backend/                       # REST API Backend Service (Node.js + Express)
│   ├── prisma/                    # Prisma ORM schemas & PostgreSQL migrations
│   ├── src/
│   │   ├── config/                # Environment, Logger, Redis, Swagger
│   │   ├── controllers/           # Auth, Meal, Scan, User Controllers
│   │   ├── middlewares/           # JWT Auth, Rate Limiter, Error Handling
│   │   ├── repositories/          # Database query layer (Prisma)
│   │   ├── routes/                # Express REST endpoint declarations
│   │   ├── services/              # AiVisionService (Groq), BarcodeService, UserService
│   │   └── validators/            # Zod request payload schemas
│   └── package.json
│
├── mobile/                        # React Native Mobile App (Expo SDK 51)
│   ├── assets/                    # Launcher icons, adaptive icons, splash screens
│   ├── android/                   # Native Android project configuration
│   ├── src/
│   │   ├── api/                   # Axios client, TanStack Query hooks
│   │   ├── components/            # Concentric Rings, AppleHealthHeader, AppLogo
│   │   ├── context/               # Theme and application context
│   │   ├── hooks/                 # usePedometer (native step sensor hook)
│   │   ├── navigation/            # RootStack & TabNavigator (React Navigation v6)
│   │   ├── redux/                 # Redux Toolkit store (authSlice, dashboardSlice)
│   │   ├── screens/               # Auth, Scanner, Tracker, Analytics, Profile
│   │   ├── theme/                 # Dark/Light palettes, tokens, typography
│   │   └── types/                 # Shared domain interfaces
│   ├── app.json                   # Expo application manifest
│   └── package.json
│
├── assets/                        # High-resolution branding & README assets
│   └── logo.png                   # SnapCalora AI brand emblem
├── docker-compose.yml             # Local PostgreSQL & Redis container orchestration
└── README.md
```

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile Client** | React Native 0.74, Expo SDK 51, TypeScript, React Navigation v6, Redux Toolkit, React Native Reanimated, Expo Camera, Expo Linear Gradient, Lucide Icons |
| **Backend API** | Node.js (v20+), Express.js, TypeScript, Prisma ORM, Neon Serverless PostgreSQL, Redis Cache, Zod, Swagger OpenAPI 3.0 |
| **AI Vision Engine** | Groq Cloud LPU Vision (`qwen/qwen3.8-27b`), xAI Grok Vision (`grok-2-vision-1212`), Google Gemini Flash |
| **Food Databases** | Open Food Facts (Open Source Global Database), USDA FoodData Central |
| **Infrastructure** | Docker, Render Cloud Hosting, Expo Application Services (EAS Cloud Build) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 20.x
- **pnpm** (preferred) or **npm**
- **Docker & Docker Compose** (for local database and Redis)
- **Expo Go App** (Android / iOS) or an Android Virtual Device / Physical Phone

---

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in `backend/` based on `.env.example`:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://user:password@localhost:5432/calora_db?sslmode=require"
   JWT_ACCESS_SECRET="your_jwt_access_secret_key"
   JWT_REFRESH_SECRET="your_jwt_refresh_secret_key"
   GROQ_API_KEY="gsk_your_groq_api_key_here"
   GROQ_MODEL="qwen/qwen3.8-27b"
   OPENFOODFACTS_BASE_URL="https://world.openfoodfacts.org/api/v2"
   ```

4. **Initialize database schema**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start development server**:
   ```bash
   pnpm run dev
   ```
   - **API Endpoint**: `http://localhost:5000/api/v1`
   - **Swagger Docs**: `http://localhost:5000/api/docs`

---

### Mobile App Setup

1. **Navigate to the mobile directory**:
   ```bash
   cd mobile
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start the Expo development server**:
   ```bash
   pnpm run start
   ```

4. **Run on your device**:
   - Press `a` to run on a connected Android device / emulator.
   - Or scan the terminal QR code with the **Expo Go** app on your physical smartphone.

---

## 📦 Build & Deployment

### Android APK / Play Store AAB (EAS Build)

SnapCalora AI uses **Expo Application Services (EAS Build)** for fast, reproducible cloud builds on dedicated Linux build infrastructure.

#### Installable Android APK (Preview Profile)
```bash
cd mobile
pnpm dlx eas-cli build -p android --profile preview
```

#### Production Google Play App Bundle (`.aab`)
```bash
cd mobile
pnpm dlx eas-cli build -p android --profile production
```

---

### Render Cloud Deployment

The backend is configured for continuous deployment on **Render.com**:
- **Build Command**: `cd backend && pnpm install && npx prisma generate && pnpm run build`
- **Start Command**: `cd backend && pnpm run start`
- Auto-deploys seamlessly on every push to the `main` branch.

---

## 🔒 Security & Performance Features

- **JWT Authentication Flow**: Short-lived Access Tokens (15 min) + Long-lived Refresh Tokens (30 days) with automated Axios interceptor rotation.
- **Fail-Safe Session Handling**: Network drops, cold-start delays, or server wake-ups never kick users to the login screen; session tokens are only cleared upon explicit 401/403 authorization rejection.
- **Rate Limiting**: Integrated `express-rate-limit` protecting endpoints against brute-force and scraping attempts.
- **High-Performance Redis Caching**: 24-hour caching for barcode lookups and nutrition metadata.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for health, fitness, and nutrition awareness.
</p>
