package com.bill_splitter.service;

import com.bill_splitter.model.GroupSummaryDTO;
import com.bill_splitter.model.Bill;
import com.bill_splitter.model.Group;
import com.bill_splitter.model.GroupMember;
import com.bill_splitter.model.Split;
import com.bill_splitter.model.User;
import com.bill_splitter.model.SettlementRequest;
import com.bill_splitter.repository.BillRepository;
import com.bill_splitter.repository.GroupRepository;
import com.bill_splitter.repository.SplitRepository;
import com.bill_splitter.repository.UserRepository;
import com.bill_splitter.repository.SettlementRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Optional;

@Service
public class BillService {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private SplitRepository splitRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private SettlementRequestRepository settlementRequestRepository;

    public Bill addBillWithEqualSplit(Bill bill, List<Long> memberIds) {
        List<Long> finalMemberIds = memberIds;
        if (finalMemberIds == null || finalMemberIds.isEmpty()) {
            Optional<Group> groupOpt = groupRepository.findById(bill.getGroupId());
            if (groupOpt.isPresent() && groupOpt.get().getGroupMembers() != null) {
                finalMemberIds = groupOpt.get().getGroupMembers()
                        .stream()
                        .map(gm -> gm.getUser().getId())
                        .toList();
            }
        }

        Bill savedBill = billRepository.save(bill);

        double totalAmount = bill.getTotalAmount();
        int totalMembers = finalMemberIds != null && !finalMemberIds.isEmpty() ? finalMemberIds.size() : 1;
        double splitAmount = totalAmount / totalMembers;

        if (finalMemberIds != null) {
            for (Long userId : finalMemberIds) {
                Split split = new Split();
                split.setBillId(savedBill.getId());
                split.setUserId(userId);
                split.setAmountOwed(splitAmount);
                
                if (userId.equals(bill.getPaidBy())) {
                    split.setStatus("PAID");
                } else {
                    split.setStatus("UNPAID");
                }
                
                splitRepository.save(split);
            }
        }

        return savedBill;
    }

    // 1. CREATE SETTLEMENT REQUEST
    public SettlementRequest createSettlementRequest(Long groupId, Long fromUserId, Long toUserId, Double amount, String paymentMethod) {
        SettlementRequest request = new SettlementRequest();
        request.setGroupId(groupId);
        request.setFromUserId(fromUserId);
        request.setToUserId(toUserId);
        request.setAmount(amount);
        request.setPaymentMethod(paymentMethod);
        request.setStatus("PENDING");
        return settlementRequestRepository.save(request);
    }

    // 2. CONFIRM SETTLEMENT REQUEST
    public void confirmSettlementRequest(Long requestId) {
        SettlementRequest request = settlementRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Settlement request not found"));

        if ("PENDING".equals(request.getStatus())) {
            request.setStatus("ACCEPTED");
            settlementRequestRepository.save(request);

            processSettlement(request.getGroupId(), request.getFromUserId(), request.getToUserId(), request.getAmount(), request.getPaymentMethod());
        }
    }

    // 3. GET PENDING REQUESTS FOR RECEIVER
    public List<SettlementRequest> getPendingRequestsForUser(Long groupId, Long userId) {
        return settlementRequestRepository.findByGroupIdAndToUserIdAndStatus(groupId, userId, "PENDING");
    }

    public void processSettlement(Long groupId, Long fromUserId, Long toUserId, Double amount, String paymentMethod) {
        Optional<User> fromUserOpt = userRepository.findById(fromUserId);
        Optional<User> toUserOpt = userRepository.findById(toUserId);

        if (fromUserOpt.isPresent() && toUserOpt.isPresent()) {
            Bill settlementBill = new Bill();
            settlementBill.setTitle("Settlement via " + paymentMethod);
            settlementBill.setTotalAmount(amount);
            settlementBill.setGroupId(groupId);
            settlementBill.setPaidBy(fromUserId); 

            Bill savedBill = billRepository.save(settlementBill);

            Split split = new Split();
            split.setBillId(savedBill.getId());
            split.setUserId(toUserId); 
            split.setAmountOwed(amount);
            split.setStatus("PAID");
            splitRepository.save(split);
        }
    }

    public List<Bill> getBillsByGroup(Long groupId) {
        return billRepository.findByGroupId(groupId);
    }

    public List<Split> getSplitsByUser(Long userId) {
        return splitRepository.findByUserId(userId);
    }

    public Map<String, Double> calculateUserBalance(Long userId) {
        List<Bill> allBills = billRepository.findAll();
        List<Split> userSplits = splitRepository.findByUserId(userId);

        Map<Long, Boolean> settlementBillMap = new HashMap<>();
        for (Bill bill : allBills) {
            boolean isSettlement = bill.getTitle() != null && bill.getTitle().startsWith("Settlement");
            settlementBillMap.put(bill.getId(), isSettlement);
        }

        double totalPaid = 0.0;
        double totalShare = 0.0;
        double totalSettlementsPaid = 0.0;
        double totalSettlementsReceived = 0.0;

        for (Bill bill : allBills) {
            boolean isSettlement = settlementBillMap.getOrDefault(bill.getId(), false);
            if (!isSettlement && bill.getPaidBy() != null && bill.getPaidBy().equals(userId)) {
                totalPaid += bill.getTotalAmount();
            } else if (isSettlement && bill.getPaidBy() != null && bill.getPaidBy().equals(userId)) {
                totalSettlementsPaid += bill.getTotalAmount();
            }
        }

        if (userSplits != null) {
            for (Split split : userSplits) {
                boolean isSettlement = settlementBillMap.getOrDefault(split.getBillId(), false);
                if (!isSettlement) {
                    if (split.getAmountOwed() != null) {
                        totalShare += split.getAmountOwed();
                    }
                } else {
                    if (split.getUserId().equals(userId) && split.getAmountOwed() != null) {
                        totalSettlementsReceived += split.getAmountOwed();
                    }
                }
            }
        }

        double baseNetBalance = totalPaid - totalShare;
        double netBalance = baseNetBalance + totalSettlementsPaid - totalSettlementsReceived; 

        Map<String, Double> result = new HashMap<>();
        if (netBalance >= 0) {
            result.put("toGet", netBalance);
            result.put("toPay", 0.0);
        } else {
            result.put("toGet", 0.0);
            result.put("toPay", Math.abs(netBalance));
        }
        
        return result;
    }

    public Map<String, Object> getDashboardSummary(Long userId) {
        List<Bill> allBills = billRepository.findAll();
        List<Split> userSplits = splitRepository.findByUserId(userId);

        Map<Long, Boolean> settlementBillMap = new HashMap<>();
        for (Bill bill : allBills) {
            boolean isSettlement = bill.getTitle() != null && bill.getTitle().startsWith("Settlement");
            settlementBillMap.put(bill.getId(), isSettlement);
        }

        double totalPaid = 0.0;
        double totalShare = 0.0;
        double totalSettlementsPaid = 0.0;
        double totalSettlementsReceived = 0.0;

        for (Bill bill : allBills) {
            boolean isSettlement = settlementBillMap.getOrDefault(bill.getId(), false);
            if (!isSettlement && bill.getPaidBy() != null && bill.getPaidBy().equals(userId)) {
                totalPaid += bill.getTotalAmount();
            } else if (isSettlement && bill.getPaidBy() != null && bill.getPaidBy().equals(userId)) {
                totalSettlementsPaid += bill.getTotalAmount();
            }
        }

        if (userSplits != null) {
            for (Split split : userSplits) {
                boolean isSettlement = settlementBillMap.getOrDefault(split.getBillId(), false);
                if (!isSettlement) {
                    if (split.getAmountOwed() != null) {
                        totalShare += split.getAmountOwed();
                    }
                } else {
                    if (split.getUserId().equals(userId) && split.getAmountOwed() != null) {
                        totalSettlementsReceived += split.getAmountOwed();
                    }
                }
            }
        }

        double totalSpent = totalPaid + totalSettlementsPaid - totalSettlementsReceived;

        double baseNetBalance = totalPaid - totalShare;
        double netBalance = baseNetBalance + totalSettlementsPaid - totalSettlementsReceived;

        double totalToReceive = 0.0;
        double totalToPay = 0.0;

        if (netBalance >= 0) {
            totalToReceive = netBalance;
        } else {
            totalToPay = Math.abs(netBalance);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSpent", totalSpent);
        summary.put("netBalance", netBalance);
        summary.put("totalToReceive", totalToReceive);
        summary.put("totalToPay", totalToPay);
        return summary;
    }

    public GroupSummaryDTO calculateGroupSummary(Long groupId, Long userId) {
        List<Bill> groupBills = billRepository.findByGroupId(groupId);
        List<Long> billIds = groupBills.stream().map(Bill::getId).toList();
        List<Split> groupSplits = billIds.isEmpty() ? List.of() : splitRepository.findByBillIdIn(billIds);

        Map<Long, Boolean> settlementBillMap = new HashMap<>();
        for (Bill bill : groupBills) {
            boolean isSettlement = bill.getTitle() != null && bill.getTitle().startsWith("Settlement");
            settlementBillMap.put(bill.getId(), isSettlement);
        }

        double totalGroupExpense = 0.0;
        double userShare = 0.0;

        Map<Long, Double> memberNetMap = new HashMap<>();

        for (Bill bill : groupBills) {
            double amount = bill.getTotalAmount();
            boolean isSettlement = settlementBillMap.get(bill.getId());

            if (!isSettlement) {
                totalGroupExpense += amount;
            }

            Long paidById = bill.getPaidBy();
            if (paidById != null) {
                double netEffect = amount; 
                memberNetMap.put(paidById, memberNetMap.getOrDefault(paidById, 0.0) + netEffect);
            }
        }

        for (Split split : groupSplits) {
            boolean isSettlement = settlementBillMap.getOrDefault(split.getBillId(), false);
            Long splitUserId = split.getUserId();
            double amountOwed = split.getAmountOwed() != null ? split.getAmountOwed() : 0.0;

            if (!isSettlement) {
                if (splitUserId.equals(userId)) {
                    userShare += amountOwed;
                }
                memberNetMap.put(splitUserId, memberNetMap.getOrDefault(splitUserId, 0.0) - amountOwed);
            } else {
                memberNetMap.put(splitUserId, memberNetMap.getOrDefault(splitUserId, 0.0) - amountOwed);
            }
        }

        double userNetBalance = memberNetMap.getOrDefault(userId, 0.0);
        double userTotalSpent = userShare + userNetBalance;

        Map<String, Double> memberBalancesWithName = new HashMap<>();
        for (Map.Entry<Long, Double> entry : memberNetMap.entrySet()) {
            Long memberId = entry.getKey();
            Double balance = entry.getValue();

            if (!memberId.equals(userId)) {
                Optional<User> userOpt = userRepository.findById(memberId);
                if (userOpt.isPresent()) {
                    String userName = userOpt.get().getName();
                    memberBalancesWithName.put(userName, balance);
                }
            }
        }

        List<Map<String, Object>> settlements = new ArrayList<>();
        List<DebtorCreditor> debtors = new ArrayList<>();
        List<DebtorCreditor> creditors = new ArrayList<>();

        for (Map.Entry<Long, Double> entry : memberNetMap.entrySet()) {
            Long memberId = entry.getKey();
            double net = entry.getValue();
            if (Math.abs(net) < 0.01) continue;

            String name = userRepository.findById(memberId).map(User::getName).orElse("Unknown");

            if (net < 0) {
                debtors.add(new DebtorCreditor(memberId, name, -net));
            } else {
                creditors.add(new DebtorCreditor(memberId, name, net));
            }
        }

        debtors.sort((a, b) -> Double.compare(b.amount, a.amount));
        creditors.sort((a, b) -> Double.compare(b.amount, a.amount));

        int dIndex = 0, cIndex = 0;
        while (dIndex < debtors.size() && cIndex < creditors.size()) {
            DebtorCreditor debtor = debtors.get(dIndex);
            DebtorCreditor creditor = creditors.get(cIndex);

            double amount = Math.min(debtor.amount, creditor.amount);

            if (amount > 0.01) {
                Map<String, Object> settlement = new HashMap<>();
                settlement.put("from", debtor.name);
                settlement.put("to", creditor.name);
                settlement.put("amount", amount);
                settlement.put("isSettled", false);
                settlement.put("status", "PENDING");
                settlements.add(settlement);
            }

            debtor.amount -= amount;
            creditor.amount -= amount;

            if (debtor.amount < 0.01) dIndex++;
            if (creditor.amount < 0.01) cIndex++;
        }

        // --- GLOBAL COMPLETED SETTLEMENTS LIST (VISIBLE TO ALL GROUP MEMBERS) ---
        List<Map<String, Object>> completedSettlements = new ArrayList<>();
        
        for (Bill bill : groupBills) {
            boolean isSettlement = settlementBillMap.getOrDefault(bill.getId(), false);
            if (isSettlement) {
                String fromName = userRepository.findById(bill.getPaidBy()).map(User::getName).orElse("Unknown");
                
                List<Split> billSplits = groupSplits.stream()
                        .filter(s -> s.getBillId().equals(bill.getId()))
                        .toList();
                        
                for (Split s : billSplits) {
                    if ("PAID".equals(s.getStatus())) {
                        String toName = userRepository.findById(s.getUserId()).map(User::getName).orElse("Unknown");
                        Map<String, Object> completedSettlement = new HashMap<>();
                        completedSettlement.put("from", fromName);
                        completedSettlement.put("to", toName);
                        completedSettlement.put("amount", bill.getTotalAmount());
                        completedSettlement.put("isSettled", true);
                        completedSettlement.put("status", "COMPLETED");
                        completedSettlement.put("paymentMethod", bill.getTitle() != null ? bill.getTitle().replace("Settlement via ", "") : "Cash");
                        completedSettlement.put("createdAt", new java.util.Date()); 
                        completedSettlements.add(completedSettlement);
                    }
                }
            }
        }

        List<Map<String, Object>> allSettlementsList = new ArrayList<>();
        allSettlementsList.addAll(settlements);
        allSettlementsList.addAll(completedSettlements);

        GroupSummaryDTO summary = new GroupSummaryDTO();
        summary.setTotalGroupExpense(totalGroupExpense);
        summary.setUserTotalSpent(userTotalSpent);
        summary.setUserShare(userShare);
        summary.setMemberBalances(memberBalancesWithName);
        summary.setSettlements(allSettlementsList);

        return summary;
    }

    private static class DebtorCreditor {
        Long id;
        String name;
        double amount;

        public DebtorCreditor(Long id, String name, double amount) {
            this.id = id;
            this.name = name;
            this.amount = amount;
        }
    }
}