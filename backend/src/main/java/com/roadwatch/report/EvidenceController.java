package com.roadwatch.report;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/evidence")
public class EvidenceController {
  @GetMapping("/{filename}")
  public ResponseEntity<byte[]> getEvidence(@PathVariable String filename) throws IOException {
    Path filePath = Paths.get("uploads", "evidence", filename);
    if (!Files.exists(filePath)) {
      return ResponseEntity.notFound().build();
    }
    String contentType = Files.probeContentType(filePath);
    if (contentType == null) {
      contentType = "image/jpeg";
    }
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(contentType))
        .body(Files.readAllBytes(filePath));
  }
}
