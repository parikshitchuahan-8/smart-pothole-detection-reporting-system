import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CircleAlert,
  MapPin,
  Upload,
  Send,
  CheckCircle2,
  LocateFixed,
  Download,
} from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const statuses = ["ALL", "REPORTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED"];
const severities = ["ALL", "HIGH", "MEDIUM", "LOW"];
const authorities = ["ALL", "MCD", "BBMP", "BMC", "PWD"];
const color = {
  REPORTED: "#e35142",
  ACKNOWLEDGED: "#e9a23b",
  IN_PROGRESS: "#397bbb",
  RESOLVED: "#2e9168",
};

function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    },
  });
  return null;
}

function App() {
  const [reports, setReports] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [showDispatches, setShowDispatches] = useState(false);
  const [status, setStatus] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [authorityFilter, setAuthorityFilter] = useState("ALL");
  const [form, setForm] = useState({
    latitude: "28.6139",
    longitude: "77.2090",
    capturedAt: new Date().toISOString().slice(0, 16),
  });
  const [file, setFile] = useState();
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      const response = await fetch(
        `${API}/reports?status=${status === "ALL" ? "" : status}`,
      );
      if (response.ok) setReports(await response.json());

      const dispatchRes = await fetch(`${API}/civic-dispatches`);
      if (dispatchRes.ok) setDispatches(await dispatchRes.json());
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };
  useEffect(() => {
    load();
  }, [status]);

  const filteredReports = reports.filter((r) => {
    const matchesSeverity = severityFilter === "ALL" || r.severity === severityFilter;
    const matchesAuthority = authorityFilter === "ALL" || r.authority.includes(authorityFilter);
    return matchesSeverity && matchesAuthority;
  });

  const highSeverityCount = reports.filter((r) => r.severity === "HIGH").length;
  const inProgressCount = reports.filter((r) => r.status === "IN_PROGRESS" || r.status === "REPORTED").length;
  const resolvedCount = reports.filter((r) => r.status === "RESOLVED").length;

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

  const exportToCsv = () => {
    if (filteredReports.length === 0) return setNotice("No reports available to export.");
    const headers = ["ID", "Authority", "Severity", "Confidence", "Status", "Latitude", "Longitude", "CapturedAt", "EvidenceUrl"];
    const rows = filteredReports.map((r) => [
      r.id,
      `"${r.authority}"`,
      r.severity,
      Math.round(r.confidence * 100) + "%",
      r.status,
      r.latitude,
      r.longitude,
      r.capturedAt,
      r.evidenceUrl,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `roadwatch_reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotice(`Exported ${filteredReports.length} records to CSV.`);
  };

  return (
    <main>
      <header>
        <div className="logo">
          <CircleAlert /> RoadWatch <span>SMART CIVIC REPORTING</span>
        </div>
        <div className="live" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span></span> Live incident monitor
          <button 
            type="button" 
            onClick={exportToCsv}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "#245d4e", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </header>
      <section className="hero">
        <p>SAFER STREETS, CLEARER ACTION</p>
        <h1>
          Spot it. Report it. <em>Fix it.</em>
        </h1>
        <small>AI-assisted pothole detection for faster road repairs.</small>
        <div className="stats-bar" style={{ display: "flex", gap: "15px", marginTop: "20px", flexWrap: "wrap" }}>
          <div className="stat-card" style={{ background: "rgba(255,255,255,0.06)", padding: "10px 18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: "12px", opacity: 0.75, display: "block" }}>TOTAL DETECTIONS</span>
            <b style={{ fontSize: "20px" }}>{reports.length}</b>
          </div>
          <div className="stat-card" style={{ background: "rgba(227, 81, 66, 0.1)", padding: "10px 18px", borderRadius: "8px", border: "1px solid rgba(227, 81, 66, 0.3)" }}>
            <span style={{ fontSize: "12px", color: "#e35142", display: "block" }}>HIGH SEVERITY</span>
            <b style={{ fontSize: "20px", color: "#e35142" }}>{highSeverityCount}</b>
          </div>
          <div className="stat-card" style={{ background: "rgba(57, 123, 187, 0.1)", padding: "10px 18px", borderRadius: "8px", border: "1px solid rgba(57, 123, 187, 0.3)" }}>
            <span style={{ fontSize: "12px", color: "#397bbb", display: "block" }}>ACTIVE REPAIRS</span>
            <b style={{ fontSize: "20px", color: "#397bbb" }}>{inProgressCount}</b>
          </div>
          <div className="stat-card" style={{ background: "rgba(46, 145, 104, 0.1)", padding: "10px 18px", borderRadius: "8px", border: "1px solid rgba(46, 145, 104, 0.3)" }}>
            <span style={{ fontSize: "12px", color: "#2e9168", display: "block" }}>RESOLVED DEFECTS</span>
            <b style={{ fontSize: "20px", color: "#2e9168" }}>{resolvedCount}</b>
          </div>
          <button 
            type="button" 
            onClick={() => setShowDispatches(!showDispatches)}
            style={{ marginLeft: "auto", background: showDispatches ? "#397bbb" : "rgba(255,255,255,0.1)", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
          >
            📋 {showDispatches ? "Hide Civic Tickets" : `View Civic Tickets (${dispatches.length})`}
          </button>
        </div>
      </section>
      
      {showDispatches && (
        <section className="civic-dispatches-view" style={{ margin: "20px 0", padding: "20px", background: "rgba(0,0,0,0.3)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ margin: "0 0 15px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            🏛️ Automated Civic Department Tickets ({dispatches.length})
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {dispatches.map((d) => (
              <div key={d.id} style={{ background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #397bbb" }}>
                <b style={{ fontSize: "14px", display: "block" }}>{d.authority}</b>
                <span style={{ fontSize: "12px", color: "#2e9168", fontWeight: "600" }}>{d.deliveryStatus}</span>
                <small style={{ display: "block", fontSize: "11px", opacity: 0.6, marginTop: "4px" }}>
                  Ticket: {d.id.slice(0, 8)} · {new Date(d.dispatchedAt).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="content">
        <div className="topline">
          <div>
            <h2>Road condition dashboard</h2>
            <p>{filteredReports.length} reports matching filters</p>
          </div>
          <div className="filters-group" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
            <div className="filters">
              {severities.map((item) => (
                <button
                  className={severityFilter === item ? "selected" : ""}
                  onClick={() => setSeverityFilter(item)}
                  key={item}
                >
                  {item} SEVERITY
                </button>
              ))}
            </div>
            <div className="filters">
              {authorities.map((item) => (
                <button
                  className={authorityFilter === item ? "selected" : ""}
                  onClick={() => setAuthorityFilter(item)}
                  key={item}
                >
                  {item === "ALL" ? "ALL ZONES" : item}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="layout">
          <div className="map">
            <MapContainer center={[28.6139, 77.209]} zoom={11} scrollWheelZoom>
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationPicker
                onLocationSelect={(lat, lng) => {
                  setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
                  setNotice(`Coordinates set to ${lat}, ${lng} from map click.`);
                }}
              />
              {filteredReports.map((report) => (
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
          {filteredReports.length === 0 ? (
            <p className="empty">
              No reports yet. Upload road evidence to create the first one.
            </p>
          ) : (
            filteredReports.map((report) => (
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
