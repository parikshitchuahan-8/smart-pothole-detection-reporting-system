package com.roadwatch.report;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/reports")
public class ReportController {
  private final ReportRepository repository;
  private final S3EvidenceStorage storage;
  private final PotholeDetector detector;
  private final AuthorityRouter authorityRouter;
  private final CivicNotifier notifier;

  ReportController(ReportRepository repository, S3EvidenceStorage storage, PotholeDetector detector,
                   AuthorityRouter authorityRouter, CivicNotifier notifier) {
    this.repository = repository;
    this.storage = storage;
    this.detector = detector;
    this.authorityRouter = authorityRouter;
    this.notifier = notifier;
  }

  @GetMapping
  public List<PotholeReport> list(@RequestParam(required = false) ReportStatus status) {
    return status == null ? repository.findAllByOrderByCreatedAtDesc()
        : repository.findByStatusOrderByCreatedAtDesc(status);
  }

  @PostMapping(value = "/detect", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<?> detect(
      @RequestParam MultipartFile file,
      @RequestParam double latitude,
      @RequestParam double longitude,
      @RequestParam LocalDateTime capturedAt) throws IOException {
    if (file.isEmpty()) return badRequest("Road evidence is required.");
    if (!isCoordinateValid(latitude, longitude)) return badRequest("Latitude or longitude is out of range.");
    String contentType = file.getContentType();
    String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
    boolean isImage = (contentType != null && contentType.startsWith("image/"))
        || filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".png") || filename.endsWith(".webp");
    if (!isImage) {
      return badRequest("Submit a road image. Video frame extraction is handled by the mobile/dashcam client.");
    }

    PotholeDetector.Detection detection;
    try {
      detection = detector.detect(file);
    } catch (PotholeDetector.DetectionUnavailableException exception) {
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
          .body(Map.of("message", exception.getMessage()));
    }

    if (!detection.isPothole()) {
      return ResponseEntity.unprocessableEntity().body(Map.of(
          "message", "No pothole met the configured detection-confidence threshold.",
          "minimumConfidence", 0.40));
    }

    S3EvidenceStorage.Stored stored = storage.upload(file);
    PotholeReport report = new PotholeReport();
    report.setLatitude(latitude);
    report.setLongitude(longitude);
    report.setCapturedAt(capturedAt.atZone(ZoneId.systemDefault()).toInstant());
    report.setConfidence(detection.confidence());
    report.setSeverity(detection.severity());
    report.setAuthority(authorityRouter.forLocation(latitude, longitude));
    report.setEvidenceUrl(stored.url());
    report.setStorageKey(stored.key());
    report.transitionTo(ReportStatus.REPORTED);
    report = repository.save(report);

    notifier.notify(report);
    return ResponseEntity.status(HttpStatus.CREATED).body(report);
  }

  @PatchMapping("/{id}/status")
  public PotholeReport updateStatus(@PathVariable String id, @Valid @RequestBody StatusUpdate request) {
    PotholeReport report = repository.findById(id).orElseThrow();
    report.transitionTo(request.status());
    return repository.save(report);
  }

  private boolean isCoordinateValid(double latitude, double longitude) {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  private ResponseEntity<Map<String, String>> badRequest(String message) {
    return ResponseEntity.badRequest().body(Map.of("message", message));
  }

  record StatusUpdate(@NotNull ReportStatus status) {}
}
