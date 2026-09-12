package com.roadwatch.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Configures browser access for the local React dashboard and approved deployments. */
@Configuration
public class WebConfig implements WebMvcConfigurer {
  private final String[] allowedOrigins;

  public WebConfig(@Value("${app.cors-origins:http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173}")
                   String allowedOrigins) {
    this.allowedOrigins = allowedOrigins.split(",");
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
        .allowedOriginPatterns("*")
        .allowedMethods("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .maxAge(3600);
  }
}
