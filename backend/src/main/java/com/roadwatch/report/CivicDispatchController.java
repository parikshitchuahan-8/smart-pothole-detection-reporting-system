package com.roadwatch.report;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Exposes automatically-created civic dashboard tickets for demonstrations. */
@RestController
@RequestMapping("/api/civic-dispatches")
public class CivicDispatchController {
  private final CivicDispatchRepository repository;

  CivicDispatchController(CivicDispatchRepository repository) {
    this.repository = repository;
  }

  @GetMapping
  public List<CivicDispatch> list() {
    return repository.findAllByOrderByDispatchedAtDesc();
  }
}
