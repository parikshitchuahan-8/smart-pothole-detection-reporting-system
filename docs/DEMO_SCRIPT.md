# Two-minute reviewer demo

1. Open the RoadWatch dashboard and point out the Leaflet/OpenStreetMap map and status filters.
2. Upload a pothole image or short dashcam video, enter latitude, longitude, and capture time, then select **Detect and report**. For a video, mention that the browser extracts an image frame before model inference.
3. Show the new map marker and report card. Explain that the backend saved the evidence under the `pothole-evidence/` prefix in AWS S3.
4. Open the report card and show the model confidence, severity estimate, and assigned civic authority.
5. Change the status from **Reported** to **Acknowledged**, then **In Progress**, and finally **Resolved**.
6. Show the PostgreSQL `pothole_report` and `status_history` records in pgAdmin.
7. Open `/api/civic-dispatches` to show the automatically-created civic dashboard ticket. If a civic webhook is configured, show its delivery outcome and received payload.

Use a real pothole image for the recording. If model inference is unavailable, show the user-facing configuration error instead of presenting simulated results as AI output.
