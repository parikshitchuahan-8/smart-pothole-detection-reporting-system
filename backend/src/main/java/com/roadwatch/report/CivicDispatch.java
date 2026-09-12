package com.roadwatch.report;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;

/** Audit record for the automatically created civic dashboard ticket. */
@Entity
public class CivicDispatch {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  private String reportId;
  private String authority;
  private Instant dispatchedAt = Instant.now();
  private String deliveryStatus;

  protected CivicDispatch() {}

  CivicDispatch(PotholeReport report, String deliveryStatus) {
    this.reportId = report.getId();
    this.authority = report.getAuthority();
    this.deliveryStatus = deliveryStatus;
  }

  public String getId() { return id; }
  public String getReportId() { return reportId; }
  public String getAuthority() { return authority; }
  public Instant getDispatchedAt() { return dispatchedAt; }
  public String getDeliveryStatus() { return deliveryStatus; }
}
