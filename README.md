# Smart Pothole Detection and Reporting System

A full-stack, AI-powered system designed to detect potholes from dashcam/mobile footage or road images, capture exact GPS coordinates and timestamps, estimate damage severity, automatically route reports to the responsible civic authority (e.g., MCD, BBMP, BMC, PWD), and maintain a real-time tracking dashboard with repair workflows.

---

## 🏛️ System Architecture

- **Frontend (`frontend/`)**: Responsive React dashboard with an interactive Leaflet/OpenStreetMap map, client-side video frame extraction, GPS location autofill, and dynamic filters for status and severity.
- **Backend (`backend/`)**: Spring Boot 3.4.2 REST API with PostgreSQL persistence, civic authority routing engine, automated dispatch ticket logging, and AWS S3 evidence storage with local fallback.
- **AI Model Service (`ai/`)**: FastAPI microservice serving open-source YOLOv8 pothole detection model weights (from Hugging Face), outputting confidence scores and bounding box coordinates.
- **Database**: PostgreSQL storing `pothole_report`, `status_history`, and `civic_dispatch` audit records.
- **Cloud Storage**: AWS S3 (`pothole-evidence/*`) with seamless fallback to local evidence hosting.

---

## 🚀 Key Features

1. **AI Pothole Detection**: Accepts road images or dashcam videos (with automated client-side frame extraction via HTML5 canvas).
2. **Automated Severity Estimation**: Computes `HIGH`, `MEDIUM`, or `LOW` severity based on detection confidence and bounding-box area.
3. **Geo-Location & Civic Routing**:
   - **Delhi NCT (`28.40–28.88° N, 76.84–77.40° E`)** ➔ **Municipal Corporation of Delhi (MCD)**
   - **Bengaluru (`12.80–13.15° N, 77.45–77.78° E`)** ➔ **Bruhat Bengaluru Mahanagara Palike (BBMP)**
   - **Mumbai (`18.89–19.30° N, 72.75–73.05° E`)** ➔ **Brihanmumbai Municipal Corporation (BMC)**
   - **Other Regions** ➔ **Regional Public Works Department (PWD)**
4. **Automated Civic Reporting**: Posts structured reports to external civic webhooks when configured or automatically creates an auditable local ticket (`LOCAL_TICKET_CREATED`).
5. **Interactive Lifecycle Dashboard**: Tracks pothole status through `REPORTED` ➔ `ACKNOWLEDGED` ➔ `IN_PROGRESS` ➔ `RESOLVED` with full status change history.

---

## 🛠️ How to Run the Application

### Prerequisites
- Java 21+
- Node.js 18+ & npm
- Python 3.10+
- PostgreSQL 15+

### 1. Database Setup
Create a PostgreSQL database named `pothole_reporting`:
```sql
CREATE DATABASE pothole_reporting;
```

### 2. Configure Backend Environment
Copy `backend/.env.example` to `backend/.env` and verify credentials:
```env
DB_URL=jdbc:postgresql://localhost:5432/pothole_reporting
DB_USERNAME=postgres
DB_PASSWORD=your_password
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=pothole-bucket-75
POTHOLE_MODEL_URL=http://127.0.0.1:5001/detect
POTHOLE_MINIMUM_CONFIDENCE=0.40
```

### 3. Start AI Detection Service (Port 5001)
```bash
# Setup virtual environment and dependencies
python -m venv .venv
# On Windows: .venv\Scripts\activate
# On Linux/macOS: source .venv/bin/activate
pip install -r ai/requirements.txt

# Start the AI service
python ai/server.py
```

### 4. Start Backend Server (Port 8080)
```bash
cd backend
mvn spring-boot:run
```

### 5. Start Frontend Dashboard (Port 5173 / 5174)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` (or `http://localhost:5174`) in your browser.

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/reports/detect` | Multipart upload (image/video frame, latitude, longitude, capturedAt). Runs AI inference, uploads evidence, identifies civic authority, and creates a report. |
| `GET` | `/api/reports` | Returns all pothole reports, optionally filtered by `?status=`. |
| `PATCH` | `/api/reports/{id}/status` | Updates report status (`REPORTED`, `ACKNOWLEDGED`, `IN_PROGRESS`, `RESOLVED`) and appends to `status_history`. |
| `GET` | `/api/civic-dispatches` | Lists all automated civic dispatch tickets and delivery outcomes. |
| `GET` | `/evidence/{filename}` | Serves road evidence images. |

---

## 🔮 Production Scalability & Enterprise Roadmap

For enterprise-scale production deployment, the architecture is designed to easily scale across several dimensions:

1. **Role-Based Access Control (RBAC) & Security**:
   - Integrate **Spring Security with OAuth2 / JWT** to enforce separation of concerns:
     - **Citizen / Public Role**: Submit pothole detections, view public heatmap and repair statuses.
     - **Municipal Officer / PWD Engineer Role**: Manage ticket lifecycle (`ACKNOWLEDGED` ➔ `IN_PROGRESS` ➔ `RESOLVED`), assign contractor work orders, and download compliance audits.
     - **Admin Role**: Configure municipal boundary polygons, thresholds, and webhook integrations.

2. **Spatial Deduplication & Geo-Clustering (PostGIS)**:
   - Enable PostgreSQL `PostGIS` extension using `ST_DWithin` spatial queries to cluster and merge duplicate pothole reports submitted by multiple drivers within a 5-meter radius, tracking defect recurrence over time.

3. **High-Throughput Asynchronous Video Pipelines**:
   - Decouple continuous dashcam feed ingestion using **Apache Kafka** or **AWS SQS**.
   - Video streams can be processed asynchronously by distributed GPU worker pods (Kubernetes HPA with Celery/KEDA) extracting keyframes at 1 FPS.

4. **Edge AI Inference**:
   - Export the YOLOv8 model to **ONNX Runtime** or **TensorRT / CoreML** for real-time, low-latency inference directly inside mobile dashcam apps or onboard vehicle units (OBUs), transmitting only verified detections with metadata to conserve mobile bandwidth.

5. **Civic Integrations (WhatsApp, SMS, Government Portals)**:
   - Expand `AuthorityRouter` with automated integrations to civic CRM platforms (e.g., CPGRAMS, Delhi 311, BBMP Sahaaya) and automated SMS/WhatsApp alerts to zonal engineers.

---

## 🎥 Reviewer Demo & Walkthrough

Follow [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for the step-by-step recording guide demonstrating detection, routing, dashboard filters, status workflow, and database verification.
