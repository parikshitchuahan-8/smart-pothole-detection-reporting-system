package com.roadwatch.report;

import java.io.IOException;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
class S3EvidenceStorage {
  private final S3Client client;
  private final String bucket;
  private final String region;
  private final String baseUrl;

  S3EvidenceStorage(
      @Value("${aws.region}") String region,
      @Value("${aws.bucket}") String bucket,
      @Value("${aws.public-base-url}") String baseUrl) {
    this.client = S3Client.builder().region(Region.of(region)).build();
    this.bucket = bucket;
    this.region = region;
    this.baseUrl = baseUrl;
  }

  Stored upload(MultipartFile file) throws IOException {
    if (bucket.isBlank()) {
      throw new IllegalStateException("AWS_S3_BUCKET is not configured");
    }

    String name = file.getOriginalFilename();
    String extension = name != null && name.contains(".")
        ? name.substring(name.lastIndexOf('.'))
        : "";
    String key = "pothole-evidence/" + UUID.randomUUID() + extension;

    String host = baseUrl.isBlank()
        ? "https://" + bucket + ".s3." + region + ".amazonaws.com"
        : baseUrl.replaceAll("/$", "");

    try {
      client.putObject(
          PutObjectRequest.builder()
              .bucket(bucket)
              .key(key)
              .contentType(file.getContentType())
              .build(),
          RequestBody.fromBytes(file.getBytes()));
      return new Stored(key, host + "/" + key);
    } catch (Exception e) {
      // Fallback: save to local evidence directory if S3 is unavailable/unauthorized
      java.nio.file.Path localDir = java.nio.file.Paths.get("uploads", "evidence");
      java.nio.file.Files.createDirectories(localDir);
      String filename = key.replace("pothole-evidence/", "");
      java.nio.file.Path target = localDir.resolve(filename);
      java.nio.file.Files.write(target, file.getBytes());
      return new Stored(key, "http://localhost:8080/evidence/" + filename);
    }
  }

  record Stored(String key, String url) {}
}
