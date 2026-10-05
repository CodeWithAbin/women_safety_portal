package com.womensafety.service;

import com.womensafety.exception.BadRequestException;
import com.womensafety.exception.ResourceNotFoundException;
import com.womensafety.model.EmergencyContact;
import com.womensafety.model.SafetyTip;
import com.womensafety.model.dto.ApiResponse;
import com.womensafety.model.dto.EmergencyContactRequest;
import com.womensafety.model.dto.SafetyTipRequest;
import com.womensafety.repository.EmergencyContactRepository;
import com.womensafety.repository.SafetyTipRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SafetyInfoService {

    private final SafetyTipRepository safetyTipRepository;
    private final EmergencyContactRepository emergencyContactRepository;

    public SafetyInfoService(SafetyTipRepository safetyTipRepository, EmergencyContactRepository emergencyContactRepository) {
        this.safetyTipRepository = safetyTipRepository;
        this.emergencyContactRepository = emergencyContactRepository;
    }

    // ==========================================
    // Public / User methods
    // ==========================================

    public ApiResponse<List<SafetyTip>> getActiveSafetyTips() {
        List<SafetyTip> tips = safetyTipRepository.findAllActive();
        ApiResponse<List<SafetyTip>> res = ApiResponse.success("Active safety tips retrieved successfully", tips);
        res.setCount(tips.size());
        return res;
    }

    public ApiResponse<List<EmergencyContact>> getActiveEmergencyContacts() {
        List<EmergencyContact> contacts = emergencyContactRepository.findAllActive();
        ApiResponse<List<EmergencyContact>> res = ApiResponse.success("Active emergency contacts retrieved successfully", contacts);
        res.setCount(contacts.size());
        return res;
    }

    // ==========================================
    // Admin methods - Safety Tips
    // ==========================================

    public ApiResponse<List<SafetyTip>> getAllSafetyTipsAdmin() {
        List<SafetyTip> tips = safetyTipRepository.findAllAdmin();
        ApiResponse<List<SafetyTip>> res = ApiResponse.success("All safety tips retrieved successfully", tips);
        res.setCount(tips.size());
        return res;
    }

    public ApiResponse<SafetyTip> createSafetyTip(SafetyTipRequest req) {
        validateSafetyTipRequest(req);
        int displayOrder = req.getDisplayOrder() != null ? req.getDisplayOrder() : 0;
        boolean isActive = req.getIsActive() != null ? req.getIsActive() : true;

        Long id = safetyTipRepository.insert(
                req.getTitle().trim(),
                req.getContent().trim(),
                req.getCategory().trim(),
                displayOrder,
                isActive
        );

        SafetyTip created = safetyTipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Failed to retrieve created safety tip."));

        return ApiResponse.success("Safety tip created successfully", created);
    }

    public ApiResponse<SafetyTip> updateSafetyTip(Long id, SafetyTipRequest req) {
        safetyTipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Safety tip not found with ID: " + id));

        validateSafetyTipRequest(req);
        int displayOrder = req.getDisplayOrder() != null ? req.getDisplayOrder() : 0;
        boolean isActive = req.getIsActive() != null ? req.getIsActive() : true;

        safetyTipRepository.update(
                id,
                req.getTitle().trim(),
                req.getContent().trim(),
                req.getCategory().trim(),
                displayOrder,
                isActive
        );

        SafetyTip updated = safetyTipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Safety tip not found with ID: " + id));

        return ApiResponse.success("Safety tip updated successfully", updated);
    }

    public ApiResponse<Void> deleteSafetyTip(Long id) {
        SafetyTip existing = safetyTipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Safety tip not found with ID: " + id));

        // Soft delete / deactivate so historical records are preserved
        safetyTipRepository.softDelete(id);
        return ApiResponse.success("Safety tip deactivated successfully.", null);
    }

    // ==========================================
    // Admin methods - Emergency Contacts
    // ==========================================

    public ApiResponse<List<EmergencyContact>> getAllEmergencyContactsAdmin() {
        List<EmergencyContact> contacts = emergencyContactRepository.findAllAdmin();
        ApiResponse<List<EmergencyContact>> res = ApiResponse.success("All emergency contacts retrieved successfully", contacts);
        res.setCount(contacts.size());
        return res;
    }

    public ApiResponse<EmergencyContact> createEmergencyContact(EmergencyContactRequest req) {
        validateEmergencyContactRequest(req);
        int displayOrder = req.getDisplayOrder() != null ? req.getDisplayOrder() : 0;
        boolean isActive = req.getIsActive() != null ? req.getIsActive() : true;
        String desc = req.getDescription() != null ? req.getDescription().trim() : null;
        String addInfo = req.getAdditionalInfo() != null ? req.getAdditionalInfo().trim() : null;

        Long id = emergencyContactRepository.insert(
                req.getName().trim(),
                desc,
                req.getPhone().trim(),
                req.getCategory().trim(),
                addInfo,
                displayOrder,
                isActive
        );

        EmergencyContact created = emergencyContactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Failed to retrieve created emergency contact."));

        return ApiResponse.success("Emergency contact created successfully", created);
    }

    public ApiResponse<EmergencyContact> updateEmergencyContact(Long id, EmergencyContactRequest req) {
        emergencyContactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency contact not found with ID: " + id));

        validateEmergencyContactRequest(req);
        int displayOrder = req.getDisplayOrder() != null ? req.getDisplayOrder() : 0;
        boolean isActive = req.getIsActive() != null ? req.getIsActive() : true;
        String desc = req.getDescription() != null ? req.getDescription().trim() : null;
        String addInfo = req.getAdditionalInfo() != null ? req.getAdditionalInfo().trim() : null;

        emergencyContactRepository.update(
                id,
                req.getName().trim(),
                desc,
                req.getPhone().trim(),
                req.getCategory().trim(),
                addInfo,
                displayOrder,
                isActive
        );

        EmergencyContact updated = emergencyContactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency contact not found with ID: " + id));

        return ApiResponse.success("Emergency contact updated successfully", updated);
    }

    public ApiResponse<Void> deleteEmergencyContact(Long id) {
        emergencyContactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency contact not found with ID: " + id));

        // Soft delete / deactivate
        emergencyContactRepository.softDelete(id);
        return ApiResponse.success("Emergency contact deactivated successfully.", null);
    }

    // ==========================================
    // Validation helpers
    // ==========================================

    private void validateSafetyTipRequest(SafetyTipRequest req) {
        if (req == null) {
            throw new BadRequestException("Request body cannot be null.");
        }
        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            throw new BadRequestException("Safety tip title is required.");
        }
        if (req.getContent() == null || req.getContent().trim().isEmpty()) {
            throw new BadRequestException("Safety tip content is required.");
        }
        if (req.getCategory() == null || req.getCategory().trim().isEmpty()) {
            throw new BadRequestException("Safety tip category is required.");
        }
    }

    private void validateEmergencyContactRequest(EmergencyContactRequest req) {
        if (req == null) {
            throw new BadRequestException("Request body cannot be null.");
        }
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new BadRequestException("Emergency contact name is required.");
        }
        if (req.getPhone() == null || req.getPhone().trim().isEmpty()) {
            throw new BadRequestException("Emergency contact phone number is required.");
        }
        if (req.getCategory() == null || req.getCategory().trim().isEmpty()) {
            throw new BadRequestException("Emergency contact category is required.");
        }
    }
}
