# SilverCorp EdTech CRM 🎓

A full-stack CRM for managing student leads, built with React, Express.js, Cloud SQL (MySQL), and deployed on Google Cloud Run.

## 🌐 Live URL
**https://silvercorp-edtech-34682822210.asia-south1.run.app**

---

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@silvercorp.com | admin123 |
| Employee (Rinit) | rinitlulla18@gmail.com | admin123 |
| Nikhil | nikhil@silvercorp.com | silvercorp@123 |
| Prathmesh | prathmesh@silvercorp.com | silvercorp@123 |
| Taqui | taqui@silvercorp.com | silvercorp@123 |

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS |
| Backend | Express.js, Node.js |
| Database | Cloud SQL (MySQL 8.0) |
| Hosting | Google Cloud Run |
| Container | Docker |
| CI/CD | GitHub Actions |

---

## 📁 Project Structure

```
silvercorp-edtech/
├── components/          # React UI components
├── src/                 # API service layer
├── services/            # Frontend data services
├── data/                # Static data (countries etc.)
├── server.js            # Express backend + DB logic
├── App.tsx              # Main React app
├── Dockerfile           # Container build
└── .github/workflows/   # CI/CD pipelines
```

---

## 🚀 Run Locally

**Prerequisites:** Node.js 20+, Cloud SQL Auth Proxy

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your DB credentials
```

### 3. Start Cloud SQL Proxy
```bash
./cloud-sql-proxy --gcloud-auth --port 3306 \
  project-77fd4913-ebb5-4487-9d2:asia-south1:silvercorp-db
```

### 4. Build frontend & start server
```bash
npm run build
npm start
```

Open **http://localhost:8080**

---

## ☁️ GCP Infrastructure

| Resource | Details |
|----------|---------|
| Project | `project-77fd4913-ebb5-4487-9d2` |
| Cloud SQL | `silvercorp-db` · MySQL 8.0 · `asia-south1` |
| Database | `dashboard` |
| Cloud Run | `silvercorp-edtech` · `asia-south1` |
| Artifact Registry | `silvercorp-repo` · `asia-south1` |
| Cloud Run SA | `silvercorp-cloudrun-sa@...` |

---

## 🔄 Deploy

Push to `main` branch → GitHub Actions auto-builds & deploys to Cloud Run.

**Manual deploy:**
```bash
gcloud run deploy silvercorp-edtech \
  --image=asia-south1-docker.pkg.dev/project-77fd4913-ebb5-4487-9d2/silvercorp-repo/silvercorp-edtech:latest \
  --region=asia-south1 \
  --project=project-77fd4913-ebb5-4487-9d2
```
