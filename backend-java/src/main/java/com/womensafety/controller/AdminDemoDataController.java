package com.womensafety.controller;

import com.womensafety.model.dto.ApiResponse;
import com.womensafety.service.DemoDataSeederService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/demo-data")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDemoDataController {

    private final DemoDataSeederService demoDataSeederService;

    public AdminDemoDataController(DemoDataSeederService demoDataSeederService) {
        this.demoDataSeederService = demoDataSeederService;
    }

    /**
     * Get the current status and statistics of the demo dataset.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus() {
        Map<String, Object> status = demoDataSeederService.getDemoDataStatus();
        return ResponseEntity.ok(ApiResponse.success("Demo data status retrieved successfully", status));
    }

    /**
     * Trigger the atomic demo data seeding operation.
     * Use ?force=true to clean up any existing demo data before re-seeding.
     */
    @PostMapping("/seed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> seedDemoData(
            @RequestParam(defaultValue = "false") boolean force) {
        Map<String, Object> result = demoDataSeederService.seedDemoData(force);
        return ResponseEntity.ok(ApiResponse.success("Demo data seed operation completed", result));
    }

    /**
     * Isolated cleanup targeting strictly @demo.womensafety.internal records.
     */
    @DeleteMapping("/cleanup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cleanupDemoData() {
        Map<String, Object> result = demoDataSeederService.cleanupDemoData();
        return ResponseEntity.ok(ApiResponse.success("Demo data cleanup completed", result));
    }
}
