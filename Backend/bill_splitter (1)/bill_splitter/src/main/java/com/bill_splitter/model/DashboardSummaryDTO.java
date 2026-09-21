package com.bill_splitter.model;

public class DashboardSummaryDTO {
    private double totalSpent;
    private double totalToPay;     
    private double totalToReceive; 
    private double netBalance;

    public DashboardSummaryDTO(double totalSpent, double totalToPay, double totalToReceive, double netBalance) {
        this.totalSpent = totalSpent;
        this.totalToPay = totalToPay;
        this.totalToReceive = totalToReceive;
        this.netBalance = netBalance;
    }

    // Getters and Setters
    public double getTotalSpent() { return totalSpent; }
    public void setTotalSpent(double totalSpent) { this.totalSpent = totalSpent; }

    public double getTotalToPay() { return totalToPay; }
    public void setUserTotalToPay(double totalToPay) { this.totalToPay = totalToPay; }

    public double getTotalToReceive() { return totalToReceive; }
    public void setTotalToReceive(double totalToReceive) { this.totalToReceive = totalToReceive; }

    public double getNetBalance() { return netBalance; }
    public void setNetBalance(double netBalance) { this.netBalance = netBalance; }
}