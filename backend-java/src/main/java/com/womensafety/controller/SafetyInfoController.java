package com.womensafety.controller;

import com.womensafety.model.EmergencyContact;
import com.womensafety.model.SafetyTip;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.service.SafetyInfoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/safety-info")
public class SafetyInfoController {

    private final SafetyInfoService safetyInfoService;

    public SafetyInfoController(SafetyInfoService safetyInfoService) {
        this.safetyInfoService = safetyInfoService;
    }

    @GetMapping("/tips")
    public ResponseEntity<ApiResponse<List<SafetyTip>>> getActiveTips() {
        ApiResponse<List<SafetyTip>> response = safetyInfoService.getActiveSafetyTips();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/emergency-contacts")
    public ResponseEntity<ApiResponse<List<EmergencyContact>>> getActiveEmergencyContacts() {
        ApiResponse<List<EmergencyContact>> response = safetyInfoService.getActiveEmergencyContacts();
        return ResponseEntity.ok(response);
    }
}
