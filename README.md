<p align="center">
  <img src="frontend/public/icon.svg" alt="FinanceWebApp Logo" width="120">
</p>

# <p align="center">FinanceWebApp - Portfolio Showcase</p>

<!-- <p align="center">
  <strong>A Premium Full-Stack Financial Ecosystem.</strong><br>
  Built as a high-performance, collaborative engineering challenge focused on automation, real-time data, and state-of-the-art UI/UX.
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/Nicola-01/FinanceWebApp?style=for-the-badge&logo=github&color=6366f1" alt="License">
  <img src="https://img.shields.io/github/v/release/Nicola-01/FinanceWebApp?style=for-the-badge&logo=github&color=ec4899" alt="Version">
  <img src="https://img.shields.io/github/actions/workflow/status/Nicola-01/FinanceWebApp/deploy.yml?style=for-the-badge&logo=github-actions&color=10b981" alt="Build Status">
</p>

--- -->

## 🏗️ Architecture Overview

This project serves as a comprehensive demonstration of full-stack engineering principles, ranging from complex backend scheduling to high-fidelity frontend interactions and automated DevOps pipelines.

### 🧩 Core Stack
*   **Frontend**: Built with **React 19** and **Vite**, utilizing **Tailwind CSS 4** for a "Glassmorphism" design system. State management and complex UI transitions are handled via **Framer Motion** and **Lucide/FontAwesome**.
*   **Backend**: A robust **Java Spring Boot** application leveraging **JPA/Hibernate** for sophisticated entity relationships (Multi-Wallet, Multi-Currency, Hierarchical Tagging).
*   **Database**: **PostgreSQL 16** managed via high-availability Docker containers.

---

## 🛠️ Infrastructure & CI/CD

Unlike typical portfolio projects hosted on serverless platforms, **FinanceWebApp** is a production-grade deployment managed on **Self-Hosted Infrastructure (Mini PC)**.

### 🚀 Automated Deployment
The repository uses a custom **GitHub Actions** CI/CD pipeline tailored for home-server environments:
- **Matrix Deploys**: Concurrent deployments to **Production** and **Demo** environments.
- **Self-Hosted Runners**: Actions execute directly on the target **Mini PC**, leveraging local Docker builder resources for high-speed containerization.
- **Environment Management**: Dynamic `.env` injection and version tracking derived from release branches.
- **Post-Deploy Orchestration**: Automated merging of release branches into `main` and branch cleanup upon successful deployment.

---

## ⚡ Demo & Onboarding Mode

To facilitate immediate project evaluation for recruiters and developers, the application includes a **Zero-Friction Demo Mode**.

### Enabling Demo Features
To enable simulated data generation and "1-Click" onboarding, configure the following in your `.env`:

```env
# Backend: Enables the DemoService logic
DEMO_ENABLED=true

# Frontend: Displays the "Start Demo" CTA and enables demo-specific UI routes
VITE_DEMO_ENABLED=true
```

> [!IMPORTANT]
> When `DEMO_ENABLED` is active, the application can generate **2 years of simulated transaction history** and realistic subscription schedules, allowing for instant testing of charts and analytics.

---

## 🚀 Engineering Highlights

- **💳 Multi-Wallet & Multi-Currency Architecture**: Support for complex financial structures with real-time exchange rate calculations.
- **📅 Advanced Subscription Engine**: A cron-based engine that calculates "Days Left" and semantic urgency for recurring expenses.
- **🤝 Real-Time Collaboration Layer**: Role-based access control (RBAC) allowing multiple users (Partners/Roommates) to manage shared wallets with real-time notifications.
- **🎨 Glassmorphism Design System**: A strict default Dark Mode (`#0d0d12`) with backdrop blurs and neon accents.

---

## ⚙️ Development Setup

### Local Prerequisites
*   **Java JDK 21**
*   **Node.js 18+**
*   **Docker Desktop**

### Installation
1.  **Clone & Configure**:
    ```bash
    git clone https://github.com/Nicola-01/FinanceWebApp.git
    cp .env.example .env
    ```
2.  **Run with Docker (Recommended)**:
    ```bash
    docker-compose up -d
    ```
3.  **Manual Start**:
    - **Backend**: `./gradlew bootRun` (Port 8080)
    - **Frontend**: `npm install && npm run dev` (Port 5173)

<!-- ---

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#-financewebapp---portfolio-showcase">back to top</a>)</p> -->
