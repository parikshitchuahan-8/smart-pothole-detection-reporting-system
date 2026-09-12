package com.roadwatch.report;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

interface CivicDispatchRepository extends JpaRepository<CivicDispatch, String> {
  List<CivicDispatch> findAllByOrderByDispatchedAtDesc();
}
