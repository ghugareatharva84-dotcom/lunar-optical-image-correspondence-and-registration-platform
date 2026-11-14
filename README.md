# Chandrayaan-2 Lunar Image Correspondence & Registration UI

Modern, high-performance web interface for the ISRO Chandrayaan-2 lunar optical image correspondence and registration platform. Built with **React 19** and **Vite**.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/Status-Frontend--Only-brightgreen)

---

## 🚀 Features

- **300-Frame Scroll Canvas Animation:** Dynamic lunar orbital flyby rendering dynamically tied to page scroll position with progressive frame caching.
- **Interactive Image Ingestion:** Drag-and-drop dual-image staging for source and reference lunar frames (OHRC, TMC-2, LROC-NAC).
- **Consensus & Inlier Visualizer:** Inspection panels for feature matching (LoFTR / SIFT + USAC_MAGSAC), registered overlays, and difference maps.
- **Analytical Metrics & Telemetry:** Real-time visual metrics for empirical convex hull coverage, 2D Shannon entropy, sub-pixel RMSE, and multi-factor confidence scores.
- **Mission Registration Archive:** Historical registration log viewer with detailed inspections and batch purge support.

---

## 📁 Project Structure

```text
frontend-only/
├── public/
│   ├── favicon.svg             # App favicon
│   ├── icons.svg               # SVG icons sheet
│   └── frames/                 # 300 orbital animation frames (ezgif-frame-001..300)
├── src/
│   ├── assets/                 # Brand assets & static graphics
│   ├── components/             # Reusable UI widgets & telemetry cards
│   │   ├── ConfidenceScore.jsx
│   │   ├── DifferenceMap.jsx
│   │   ├── ErrorPanel.jsx
│   │   ├── HomographyMatrix.jsx
│   │   ├── ImageUploader.jsx
│   │   ├── Loading.jsx
│   │   ├── MatchAnalysis.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProcessingPipeline.jsx
│   │   ├── RegistrationHistory.jsx
│   │   ├── ResultImage.jsx
│   │   ├── ScrollCanvasBackground.jsx
│   │   ├── SensorSelector.jsx
│   │   ├── SpatialDistribution.jsx
│   │   ├── StatsCard.jsx
│   │   └── TechnicalDetails.jsx
│   ├── pages/
│   │   └── Dashboard.jsx       # Main application view
│   ├── services/
│   │   └── api.js              # REST client for backend registration service
│   ├── styles/                 # Dedicated component stylesheets
│   ├── App.css
│   ├── App.jsx                 # Application state orchestration
│   ├── index.css               # Core styling & design system tokens
│   └── main.jsx                # React root entrypoint
├── .env.example                # Sample environment variables
├── .gitignore                  # GitHub ignore patterns
├── eslint.config.js            # Linter configuration
├── index.html                  # HTML entrypoint
├── package.json                # Project metadata & npm dependencies
├── package-lock.json           # Locked dependency tree
└── vite.config.js              # Vite bundler configuration
```

---



# 4. Link your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

# 5. Push to GitHub
git push -u origin main
```
