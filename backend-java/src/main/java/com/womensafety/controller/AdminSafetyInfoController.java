package com.womensafety.controller;

import com.womensafety.model.EmergencyContact;
import com.womensafety.model.SafetyTip;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.EmergencyContactRequest;
import com.womensafety.model.dto.SafetyTipRequest;
import com.womensafety.service.SafetyInfoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/safety-info")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSafetyInfoController {

    private final SafetyInfoService safetyInfoService;

    public AdminSafetyInfoController(SafetyInfoService safetyInfoService) {
        this.safetyInfoService = safetyInfoService;
    }

    // ==========================================
    // Safety Tips Admin Endpoints
    // ==========================================

    @GetMapping("/tips")
    public ResponseEntity<ApiResponse<List<SafetyTip>>> getAllTips() {
        ApiResponse<List<SafetyTip>> response = safetyInfoService.getAllSafetyTipsAdmin();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/tips")
    public ResponseEntity<ApiResponse<SafetyTip>> createTip(@RequestBody SafetyTipRequest req) {
        ApiResponse<SafetyTip> response = safetyInfoService.createSafetyTip(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/tips/{id}")
    public ResponseEntity<ApiResponse<SafetyTip>> updateTip(@PathVariable Long id, @RequestBody SafetyTipRequest req) {
        ApiResponse<SafetyTip> response = safetyInfoService.updateSafetyTip(id, req);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/tips/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTip(@PathVariable Long id) {
        ApiResponse<Void> response = safetyInfoService.deleteSafetyTip(id);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // Emergency Contacts Admin Endpoints
    // ==========================================

    @GetMapping("/emergency-contacts")
    public ResponseEntity<ApiResponse<List<EmergencyContact>>> getAllEmergencyContacts() {
        ApiResponse<List<EmergencyContact>> response = safetyInfoService.getAllEmergencyContactsAdmin();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/emergency-contacts")
    public ResponseEntity<ApiResponse<EmergencyContact>> createEmergencyContact(@RequestBody EmergencyContactRequest req) {
        ApiResponse<EmergencyContact> response = safetyInfoService.createEmergencyContact(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/emergency-contacts/{id}")
    public ResponseEntity<ApiResponse<EmergencyContact>> updateEmergencyContact(
            @PathVariable Long id,
            @RequestBody EmergencyContactRequest req) {
        ApiResponse<EmergencyContact> response = safetyInfoService.updateEmergencyContact(id, req);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/emergency-contacts/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEmergencyContact(@PathVariable Long id) {
        ApiResponse<Void> response = safetyInfoService.deleteEmergencyContact(id);
        return ResponseEntity.ok(response);
    }
}
