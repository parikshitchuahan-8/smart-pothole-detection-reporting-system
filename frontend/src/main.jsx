import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CircleAlert,
  MapPin,
  Upload,
  Send,
  CheckCircle2,
  LocateFixed,
} from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const statuses = ["ALL", "REPORTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED"];
const color = {
  REPORTED: "#e35142",
  ACKNOWLEDGED: "#e9a23b",
  IN_PROGRESS: "#397bbb",
  RESOLVED: "#2e9168",
};

function App() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [form, setForm] = useState({
    latitude: "28.6139",
    longitude: "77.2090",
    capturedAt: new Date().toISOString().slice(0, 16),
  });
  const [file, setFile] = useState();
  const [notice, setNotice] = useState("");

  const load = async () => {
    const response = await fetch(
      `${API}/reports?status=${status === "ALL" ? "" : status}`,
    );
    if (response.ok) setReports(await response.json());
  };
  useEffect(() => {
    load();
  }, [status]);

  const submit = async (event) => {
    event.preventDefault();
    if (!file) return setNotice("Select a road image or dashcam video first.");
    setNotice(
      file.type.startsWith("video/")
        ? "Extracting a frame from the dashcam video…"
        : "Uploading evidence and detecting potholes…",
    );

    let evidence = file;
    try {
      if (file.type.startsWith("video/")) {
        evidence = await extractVideoFrame(file);
      }
    } catch (error) {
      return setNotice(error.message);
    }

    setNotice("Uploading evidence and detecting potholes…");
    const body = new FormData();
    body.append("file", evidence, evidence.name);
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    const response = await fetch(`${API}/reports/detect`, {
      method: "POST",
      body,
    });
    const data = await response.json();
    setNotice(
      response.ok
        ? `Report ${data.id.slice(0, 8)} created and routed to ${data.authority}.`
        : data.message,
    );
    if (response.ok) {
      setFile();
      event.target.reset();
      load();
    }
  };

  const updateStatus = async (id, nextStatus) => {
    await fetch(`${API}/reports/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    load();
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setNotice("Location services are not supported by this browser.");
      return;
    }

    setNotice("Getting your current location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }));
        setNotice("Current location added to the report.");
      },
      () => setNotice("Location permission was denied. Enter coordinates manually."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <main>
      <header>
        <div className="logo">
          <CircleAlert /> RoadWatch <span>SMART CIVIC REPORTING</span>
        </div>
        <div className="live">
          <span /> Live incident monitor
        </div>
      </header>
      <section className="hero">
        <p>SAFER STREETS, CLEARER ACTION</p>
        <h1>
          Spot it. Report it. <em>Fix it.</em>
        </h1>
        <small>AI-assisted pothole detection for faster road repairs.</small>
      </section>
      <section className="content">
        <div className="topline">
          <div>
            <h2>Road condition dashboard</h2>
            <p>{reports.length} reports matching this view</p>
          </div>
          <div className="filters">
            {statuses.map((item) => (
              <button
                className={status === item ? "selected" : ""}
                onClick={() => setStatus(item)}
                key={item}
              >
                {item.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        <div className="layout">
          <div className="map">
            <MapContainer center={[28.6139, 77.209]} zoom={11} scrollWheelZoom>
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {reports.map((report) => (
                <CircleMarker
                  key={report.id}
                  center={[report.latitude, report.longitude]}
                  radius={10}
                  pathOptions={{ color: color[report.status] }}
                >
                  <Popup>
                    <b>{report.authority}</b>
                    <br />
                    {report.severity} severity
                    <br />
                    {report.status.replace("_", " ")}
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          <form className="report-form" onSubmit={submit}>
            <h3>
              <Upload size={19} /> New pothole report
            </h3>
            <label>
              Road image or dashcam video
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
            </label>
            <small className="field-note">
              Videos are converted to a frame in your browser; only that frame
              is sent to the pothole model.
            </small>
            <div className="coordinates">
              <label>
                Latitude
                <input
                  value={form.latitude}
                  onChange={(e) =>
                    setForm({ ...form, latitude: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Longitude
                <input
                  value={form.longitude}
                  onChange={(e) =>
                    setForm({ ...form, longitude: e.target.value })
                  }
                  required
                />
              </label>
            </div>
            <button
              className="location-button"
              type="button"
              onClick={useCurrentLocation}
            >
              <LocateFixed size={15} /> Use my current location
            </button>
            <label>
              Captured at
              <input
                type="datetime-local"
                value={form.capturedAt}
                onChange={(e) =>
                  setForm({ ...form, capturedAt: e.target.value })
                }
                required
              />
            </label>
            <button className="primary">
              <Send size={17} /> Detect and report
            </button>
            {notice && <p className="notice">{notice}</p>}
          </form>
        </div>
        <section className="reports">
          <h2>Recent reports</h2>
          {reports.length === 0 ? (
            <p className="empty">
              No reports yet. Upload road evidence to create the first one.
            </p>
          ) : (
            reports.map((report) => (
              <article key={report.id}>
                <div className="pin">
                  <MapPin size={19} />
                </div>
                <div className="details">
                  <b>{report.authority}</b>
                  <span>
                    {report.severity} severity ·{" "}
                    {new Date(report.capturedAt).toLocaleString()}
                  </span>
                  <small>
                    {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}{" "}
                    · confidence {Math.round(report.confidence * 100)}%
                  </small>
                </div>
                <img src={report.evidenceUrl} alt="Pothole evidence" />
                <select
                  value={report.status}
                  onChange={(e) => updateStatus(report.id, e.target.value)}
                >
                  {statuses.slice(1).map((value) => (
                    <option value={value} key={value}>
                      {value.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <CheckCircle2 color={color[report.status]} />
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
createRoot(document.getElementById("root")).render(<App />);

function extractVideoFrame(videoFile) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(videoFile);
    video.muted = true;
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, Math.max(0, video.duration / 2));
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (!blob) return reject(new Error("Could not extract a frame from this video."));
        resolve(new File([blob], `${videoFile.name}-frame.jpg`, { type: "image/jpeg" }));
      }, "image/jpeg", 0.9);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This video could not be read. Try an MP4 or upload an image."));
    };
    video.src = objectUrl;
  });
}
