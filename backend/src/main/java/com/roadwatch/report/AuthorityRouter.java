package com.roadwatch.report;

import org.springframework.stereotype.Service;

@Service
class AuthorityRouter {
  String forLocation(double latitude, double longitude) {
    // Delhi NCT
    if (latitude >= 28.40 && latitude <= 28.88 && longitude >= 76.84 && longitude <= 77.40) {
      return "Municipal Corporation of Delhi (MCD)";
    }
    // Bengaluru / Bangalore
    if (latitude >= 12.80 && latitude <= 13.15 && longitude >= 77.45 && longitude <= 77.78) {
      return "Bruhat Bengaluru Mahanagara Palike (BBMP)";
    }
    // Mumbai
    if (latitude >= 18.89 && latitude <= 19.30 && longitude >= 72.75 && longitude <= 73.05) {
      return "Brihanmumbai Municipal Corporation (BMC)";
    }
    // Default regional authority
    return "Public Works Department (PWD - Regional Zone)";
  }
}
