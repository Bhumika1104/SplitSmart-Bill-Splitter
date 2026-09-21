package com.bill_splitter.model;

import java.util.List;
import java.util.Map;

public class GroupSummaryDTO {
    private double totalGroupExpense;
    private double userTotalSpent;
    private double userShare;
    private Map<String, Double> memberBalances;
    private List<Map<String, Object>> settlements; 

    // Getters and Setters
    public double getTotalGroupExpense() { return totalGroupExpense; }
    public void setTotalGroupExpense(double totalGroupExpense) { this.totalGroupExpense = totalGroupExpense; }

    public double getUserTotalSpent() { return userTotalSpent; }
    public void setUserTotalSpent(double userTotalSpent) { this.userTotalSpent = userTotalSpent; }

    public double getUserShare() { return userShare; }
    public void setUserShare(double userShare) { this.userShare = userShare; }

    public Map<String, Double> getMemberBalances() { return memberBalances; }
    public void setMemberBalances(Map<String, Double> memberBalances) { this.memberBalances = memberBalances; }

    public List<Map<String, Object>> getSettlements() { return settlements; }
    public void setSettlements(List<Map<String, Object>> settlements) { this.settlements = settlements; }
}