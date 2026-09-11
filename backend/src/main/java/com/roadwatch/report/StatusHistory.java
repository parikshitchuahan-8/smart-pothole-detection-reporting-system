package com.roadwatch.report;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import java.time.Instant;

@Entity
public class StatusHistory {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Enumerated(EnumType.STRING)
  private ReportStatus status;

  private Instant changedAt = Instant.now();

  @JsonIgnore
  @ManyToOne(optional = false)
  private PotholeReport report;

  protected StatusHistory() {}

  StatusHistory(PotholeReport report, ReportStatus status) {
    this.report = report;
    this.status = status;
  }

  public String getId() { return id; }
  public ReportStatus getStatus() { return status; }
  public Instant getChangedAt() { return changedAt; }
}
