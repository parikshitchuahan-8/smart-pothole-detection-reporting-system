package com.roadwatch.report;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

/** Calls a Hugging Face-compatible object-detection or segmentation endpoint. */
@Service
class PotholeDetector {
  private final String modelUrl;
  private final String token;
  private final double minimumConfidence;

  PotholeDetector(
      @Value("${detection.model-url}") String modelUrl,
      @Value("${detection.token}") String token,
      @Value("${detection.minimum-confidence}") double minimumConfidence) {
    this.modelUrl = modelUrl;
    this.token = token;
    this.minimumConfidence = minimumConfidence;
  }

  Detection detect(MultipartFile file) throws IOException {
    if (modelUrl.isBlank() || token.isBlank()) {
      throw new DetectionUnavailableException("Pothole model URL or Hugging Face token is not configured.");
    }

    Object payload;
    try {
      payload = RestClient.create().post().uri(modelUrl)
          .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
          .contentType(MediaType.APPLICATION_OCTET_STREAM)
          .body(file.getBytes())
          .retrieve()
          .body(Object.class);
    } catch (Exception exception) {
      throw new DetectionUnavailableException("The pothole model could not be reached.", exception);
    }

    if (!(payload instanceof List<?> predictions)) {
      throw new DetectionUnavailableException("The model returned an unexpected response format.");
    }

    return predictions.stream().filter(Map.class::isInstance).map(Map.class::cast)
        .map(this::toDetection).filter(Detection::isPothole)
        .filter(detection -> detection.confidence() >= minimumConfidence)
        .max(Comparator.comparingDouble(Detection::confidence))
        .orElse(Detection.notDetected());
  }

  private Detection toDetection(Map<?, ?> prediction) {
    String label = String.valueOf(prediction.get("label"));
    double confidence = asDouble(prediction.get("score"));
    double boxArea = boundingBoxArea(prediction.get("box"));
    return new Detection(label.toLowerCase().contains("pothole"), confidence, severity(confidence, boxArea));
  }

  private double boundingBoxArea(Object value) {
    if (!(value instanceof Map<?, ?> box)) return 0;
    return Math.max(0, asDouble(box.get("xmax")) - asDouble(box.get("xmin")))
        * Math.max(0, asDouble(box.get("ymax")) - asDouble(box.get("ymin")));
  }

  private Severity severity(double confidence, double boxArea) {
    if (boxArea > 60_000 || confidence >= 0.85) return Severity.HIGH;
    if (boxArea > 15_000 || confidence >= 0.60) return Severity.MEDIUM;
    return Severity.LOW;
  }

  private double asDouble(Object value) {
    try { return Double.parseDouble(String.valueOf(value)); }
    catch (Exception ignored) { return 0; }
  }

  record Detection(boolean isPothole, double confidence, Severity severity) {
    static Detection notDetected() { return new Detection(false, 0, null); }
  }

  static class DetectionUnavailableException extends RuntimeException {
    DetectionUnavailableException(String message) { super(message); }
    DetectionUnavailableException(String message, Throwable cause) { super(message, cause); }
  }
}
