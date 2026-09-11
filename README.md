# Smart Pothole Detection and Reporting System

React + Spring Boot application for detecting potholes in uploaded road images/videos, recording their location and severity, routing reports to a civic authority, and tracking repair status.

## Project structure

- `frontend` — React dashboard with an interactive Leaflet/OpenStreetMap map
- `backend` — Spring Boot REST API, PostgreSQL persistence, AWS S3 evidence storage, model and notification integrations

## Main workflow

1. A user uploads road evidence and supplies its latitude and longitude.
2. The backend saves the evidence to AWS S3 and sends the image to a Hugging Face-compatible pothole model endpoint.
3. A report is created with detection confidence, severity, location, assigned authority, and `REPORTED` status.
4. The system posts a structured report to the civic webhook when configured.
5. Operators use the map dashboard to filter reports and update status: Reported, Acknowledged, In Progress, or Resolved.

## Run

1. Create PostgreSQL database `pothole_reporting`.
2. Copy `backend/.env.example` to `backend/.env`, then set its local credentials. Never commit this file.
3. Start the backend: `cd backend && mvnw.cmd spring-boot:run`.
4. Start the frontend: `cd frontend && npm install && npm run dev`.

The project is preconfigured for the `Parikshit11122/yolov8m-pothole-segmentation-bucket` Hugging Face model and the `pothole-bucket-75` S3 bucket in `ap-southeast-1`. Add a Hugging Face access token, AWS IAM credentials, and PostgreSQL credentials locally; none are committed to source control.

For direct S3 evidence URLs, permit `s3:GetObject` for the `pothole-evidence/*` prefix or serve the bucket through CloudFront. The application identity needs `s3:PutObject` and `s3:DeleteObject` for that prefix.
