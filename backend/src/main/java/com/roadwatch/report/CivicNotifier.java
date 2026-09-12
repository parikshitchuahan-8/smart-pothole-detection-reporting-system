package com.roadwatch.report;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
class CivicNotifier {
  private final String webhook;
  private final CivicDispatchRepository dispatchRepository;

  CivicNotifier(
      @Value("${civic.webhook}") String webhook,
      CivicDispatchRepository dispatchRepository) {
    this.webhook = webhook;
    this.dispatchRepository = dispatchRepository;
  }

  void notify(PotholeReport report) {
    if (webhook.isBlank()) {
      dispatchRepository.save(new CivicDispatch(report, "LOCAL_TICKET_CREATED"));
      return;
    }

    try {
      RestClient.create()
          .post()
          .uri(webhook)
          .body(report)
          .retrieve()
          .toBodilessEntity();
      dispatchRepository.save(new CivicDispatch(report, "WEBHOOK_DELIVERED"));
    } catch (Exception exception) {
      dispatchRepository.save(new CivicDispatch(report, "WEBHOOK_FAILED"));
    }
  }
}
