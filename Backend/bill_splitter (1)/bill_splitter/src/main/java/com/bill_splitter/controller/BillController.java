package com.bill_splitter.controller;

import com.bill_splitter.model.Bill;
import com.bill_splitter.model.GroupSummaryDTO;
import com.bill_splitter.model.Split;
import com.bill_splitter.model.SettlementRequest;
import com.bill_splitter.service.BillService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = "*")
public class BillController {

    @Autowired
    private BillService billService;

    // 1. Add Bill with Custom/Equal Split & Optional Receipt Image
    @PostMapping("/add")
    public ResponseEntity<?> addBillWithImage(
            @RequestParam("title") String title,
            @RequestParam("totalAmount") double totalAmount,
            @RequestParam("groupId") Long groupId,
            @RequestParam("paidBy") Long paidBy,
            @RequestParam(value = "participantIds", required = false) String participantIdsJson,
            @RequestParam(value = "receipt", required = false) MultipartFile receipt) {
        
        try {
            List<Long> memberIds = new ArrayList<>();
            if (participantIdsJson != null && !participantIdsJson.trim().isEmpty() && !participantIdsJson.equals("undefined")) {
                ObjectMapper objectMapper = new ObjectMapper();
                memberIds = objectMapper.readValue(participantIdsJson, new TypeReference<List<Long>>() {});
            }

            String receiptUrl = null;
            if (receipt != null && !receipt.isEmpty()) {
                String fileName = System.currentTimeMillis() + "_" + receipt.getOriginalFilename();
                Path uploadPath = Paths.get("uploads");
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                Files.copy(receipt.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
                receiptUrl = "/uploads/" + fileName;
            }

            Bill bill = new Bill();
            bill.setTitle(title);
            bill.setTotalAmount(totalAmount);
            bill.setGroupId(groupId);
            bill.setPaidBy(paidBy);
            bill.setReceiptUrl(receiptUrl);

            // Pass the parsed selected participant IDs to service
            Bill savedBill = billService.addBillWithEqualSplit(bill, memberIds);
            return ResponseEntity.ok(savedBill);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to upload bill receipt or add bill: " + e.getMessage());
        }
    }

    //  2. DIRECT SETTLEMENT 
    @PostMapping("/settle")
    public ResponseEntity<?> settlePayment(@RequestBody Map<String, Object> request) {
        try {
            Long groupId = Long.valueOf(request.get("groupId").toString());
            Long fromUserId = Long.valueOf(request.get("fromUserId").toString());
            Long toUserId = Long.valueOf(request.get("toUserId").toString());
            Double amount = Double.valueOf(request.get("amount").toString());
            String paymentMethod = request.getOrDefault("paymentMethod", "Cash").toString();

            billService.processSettlement(groupId, fromUserId, toUserId, amount, paymentMethod);
            return ResponseEntity.ok("Settlement recorded successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to process settlement: " + e.getMessage());
        }
    }

    //  3. NEW API: Send Settlement Request 
    @PostMapping("/settlement-request")
    public ResponseEntity<?> createSettlementRequest(@RequestBody Map<String, Object> payload) {
        try {
            Long groupId = Long.valueOf(payload.get("groupId").toString());
            Long fromUserId = Long.valueOf(payload.get("fromUserId").toString());
            Long toUserId = Long.valueOf(payload.get("toUserId").toString());
            Double amount = Double.valueOf(payload.get("amount").toString());
            String paymentMethod = payload.getOrDefault("paymentMethod", "UPI").toString();

            SettlementRequest req = billService.createSettlementRequest(groupId, fromUserId, toUserId, amount, paymentMethod);
            return ResponseEntity.ok(req);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to create settlement request: " + e.getMessage());
        }
    }

    //  4. NEW API: Confirm Settlement Request (Step 2 by Receiver)
    @PostMapping("/settlement-confirm/{requestId}")
    public ResponseEntity<?> confirmSettlement(@PathVariable Long requestId) {
        try {
            billService.confirmSettlementRequest(requestId);
            return ResponseEntity.ok("Settlement confirmed successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to confirm settlement: " + e.getMessage());
        }
    }

    //  5. NEW API: Get Pending Settlement Requests for a User
    @GetMapping("/group/{groupId}/pending-requests/{userId}")
    public ResponseEntity<List<SettlementRequest>> getPendingRequests(
            @PathVariable Long groupId, 
            @PathVariable Long userId) {
        List<SettlementRequest> requests = billService.getPendingRequestsForUser(groupId, userId);
        return ResponseEntity.ok(requests);
    }

    // 6. Get all bills for a specific group
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Bill>> getBillsByGroup(@PathVariable Long groupId) {
        List<Bill> bills = billService.getBillsByGroup(groupId);
        return ResponseEntity.ok(bills);
    }

    // 7. Get all splits for a specific user
    @GetMapping("/user/{userId}/splits")
    public ResponseEntity<List<Split>> getSplitsByUser(@PathVariable Long userId) {
        List<Split> splits = billService.getSplitsByUser(userId);
        return ResponseEntity.ok(splits);
    }

    // 8. Calculate overall balance for a user
    @GetMapping("/user/{userId}/balance")
    public ResponseEntity<Map<String, Double>> getUserBalance(@PathVariable Long userId) {
        Map<String, Double> balance = billService.calculateUserBalance(userId);
        return ResponseEntity.ok(balance);
    }

    // 9. Global Dashboard Summary API (Total Spent & Net Balance)
    @GetMapping("/user/{userId}/dashboard-summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary(@PathVariable Long userId) {
        Map<String, Object> summary = billService.getDashboardSummary(userId);
        return ResponseEntity.ok(summary);
    }

    // 10. Calculate group-specific summary and member balances
    @GetMapping("/group/{groupId}/summary/{userId}")
    public ResponseEntity<GroupSummaryDTO> getGroupSummary(
            @PathVariable Long groupId,
            @PathVariable Long userId) {
        GroupSummaryDTO summary = billService.calculateGroupSummary(groupId, userId);
        return ResponseEntity.ok(summary);
    }
}