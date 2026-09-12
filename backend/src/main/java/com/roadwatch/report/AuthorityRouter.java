package com.roadwatch.report;

import org.springframework.stereotype.Service;

@Service
class AuthorityRouter {
  String forLocation(double latitude, double longitude) {
    boolean isDelhi = latitude >= 28.4 && latitude <= 28.9
        && longitude >= 76.8 && longitude <= 77.5;

    return isDelhi
        ? "Municipal Corporation of Delhi (MCD)"
        : "Relevant Municipal Public Works Department";
  }
}
