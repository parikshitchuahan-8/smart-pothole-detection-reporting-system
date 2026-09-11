package com.roadwatch.report;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
public class PotholeReport {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  private double latitude;
  private double longitude;
  private String authority;
  private String evidenceUrl;
  private String storageKey;
  private double confidence;

  @Enumerated(EnumType.STRING)
  private Severity severity;

  @Enumerated(EnumType.STRING)
  private ReportStatus status = ReportStatus.REPORTED;

  private Instant capturedAt;
  private Instant createdAt = Instant.now();

  @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<StatusHistory> statusHistory = new ArrayList<>();

  public void transitionTo(ReportStatus nextStatus) {
    status = nextStatus;
    statusHistory.add(new StatusHistory(this, nextStatus));
  }

  public String getId() { return id; }
  public double getLatitude() { return latitude; }
  public void setLatitude(double latitude) { this.latitude = latitude; }
  public double getLongitude() { return longitude; }
  public void setLongitude(double longitude) { this.longitude = longitude; }
  public String getAuthority() { return authority; }
  public void setAuthority(String authority) { this.authority = authority; }
  public String getEvidenceUrl() { return evidenceUrl; }
  public void setEvidenceUrl(String evidenceUrl) { this.evidenceUrl = evidenceUrl; }
  public String getStorageKey() { return storageKey; }
  public void setStorageKey(String storageKey) { this.storageKey = storageKey; }
  public double getConfidence() { return confidence; }
  public void setConfidence(double confidence) { this.confidence = confidence; }
  public Severity getSeverity() { return severity; }
  public void setSeverity(Severity severity) { this.severity = severity; }
  public ReportStatus getStatus() { return status; }
  public Instant getCapturedAt() { return capturedAt; }
  public Instant getCreatedAt() { return createdAt; }
  public List<StatusHistory> getStatusHistory() { return statusHistory; }
  public void setCapturedAt(Instant capturedAt) { this.capturedAt = capturedAt; }
}
