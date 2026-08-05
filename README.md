# Calora AI — Enterprise Nutrition & Visual Calorie Tracking Platform

> **Calora AI** is a production-grade, multi-platform health and nutrition tracking ecosystem built with **React Native (Expo + TypeScript + NativeWind)** and a robust **Node.js (TypeScript + Express + Prisma + PostgreSQL + Redis)** backend. It combines multi-modal AI vision with clinical nutrition intelligence, barcode scanning, and Apple Health-style telemetry rings.

---

## 🌟 Key Features

### 1. 📸 Visual AI Food Recognition & Multi-Item Plate Parsing
- **Multi-Nutrient Detection**: Uses multi-modal AI vision to detect individual food components on a plate, segment portions, and estimate weights.
- **30+ Nutrient Panel**: Calculates Calories, Macros (Protein, Carbs, Fats), Fiber, Sugar, Sodium, and complete Micronutrients (Vitamins A, B, C, D, E, K, Iron, Calcium, Magnesium, Potassium, Zinc, Omega-3).
- **Portion Adjustments**: Interactive multipliers (0.5x, 1.0x, 1.5x, 2.0x) with real-time macro recalculations.

### 2. ⚡ Real-Time Barcode Scanner
- **Dual Database Fallback**: Queries local database, Redis cache, OpenFoodFacts Global API, and USDA FoodData Central.
- **Instant Product Match**: Live camera frame scanner with sound & haptic response.

### 3. 🍏 Apple Health-Inspired Dashboard
- **Concentric SVG Progress Rings**: Displays Calorie burn, Protein, Carbohydrates, and Fats in smooth interactive rings.
- **Micro-Nutrient Matrix**: Daily RDA (Recommended Dietary Allowance) balance grid.
- **Smart Food Swaps**: Clinical AI suggestions replacing nutrient-sparse foods with high-density whole food alternatives.
- **Hydration Tracker**: One-tap water logging (+250ml / +500ml) with animated liquid fill.

### 4. 🔬 Clinical Nutrition Engine (Mifflin-St Jeor & RDA)
- **BMR & TDEE Calculations**: Personalized metabolic calculations based on age, gender, height, weight, and activity level.
- **Nutrient Flags & Excess Warnings**: Automatic detection of low iron, deficient vitamin D, or high sodium/sugar intake.

---

## 🏗️ Architecture Overview

```
Calora/
├── backend/                  # REST API Service
│   ├── prisma/               # Database schemas & migrations
│   ├── src/
│   │   ├── config/           # Environment, Swagger, Redis configs
│   │   ├── controllers/      # REST API Controllers
│   │   ├── middlewares/      # Auth JWT, Rate Limiter, Error handling
│   │   ├── repositories/     # Database layer (Repository Pattern)
│   │   ├── routes/           # Express Route definitions
│   │   ├── services/         # Business & Clinical Nutrition logic
│   │   └── types/            # TypeScript interfaces
│   └── tests/                # Unit & Integration test suites
│
├── mobile/                   # React Native (Expo) Mobile App
│   ├── src/
│   │   ├── api/              # Axios client & TanStack Query hooks
│   │   ├── components/       # Reusable UI (Rings, Charts, GlassCards)
│   │   ├── navigation/       # React Navigation (Stack & Tab Navigators)
│   │   ├── redux/            # Redux Toolkit store & slices
│   │   ├── screens/          # Application Screens (Auth, Tracker, Scanner, Profile)
│   │   ├── theme/            # Color tokens, typography, dark mode
│   │   └── types/            # Domain models & state types
│   ├── App.tsx               # Root App component
│   └── package.json
│
├── docker-compose.yml        # Multi-container orchestration
└── .github/workflows/ci.yml  # Automated CI/CD Pipeline
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 20.x
- Docker & Docker Compose
- Expo Go App (on iOS or Android device) or Mobile Simulator

---

### Step 1: Start Infrastructure with Docker Compose

Run PostgreSQL and Redis in the background:
```bash
docker-compose up -d postgres redis
```

---

### Step 2: Setup & Launch Backend

```bash
cd backend

# Install dependencies
npm install

# Run database migrations & generate Prisma client
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Backend will be available at `http://localhost:5000`.
- **API Base URL**: `http://localhost:5000/api/v1`
- **Swagger Documentation**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/health`

---

### Step 3: Setup & Launch Mobile App

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR code with the **Expo Go** app on your physical mobile device.

---

## 🧪 Running Automated Tests

### Backend Unit & Integration Tests
```bash
cd backend
npm test
```

### Mobile TypeScript Type Checking
```bash
cd mobile
npx tsc --noEmit
```

---

## 🔒 Security & Performance Features

- **JWT Authentication**: Short-lived Access Tokens (15 min) + Long-lived Refresh Tokens (7 days) with automated Axios interceptor rotation.
- **Rate Limiting**: Configured express-rate-limit protecting against brute force attacks.
- **Redis Caching**: Caches food queries, USDA items, and user dashboard statistics.
- **Encrypted Storage**: Secure token persistence using `@react-native-async-storage/async-storage`.

---

## 📄 License
MIT © 2026 Calora AI Inc. All rights reserved.
