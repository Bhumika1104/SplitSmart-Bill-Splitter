package com.bill_splitter.model;

import jakarta.persistence.*;

@Entity
@Table(name = "splits")
public class Split {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long billId;
    private Long userId;
    private Double amountOwed;
    private String status; 

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBillId() { return billId; }
    public void setBillId(Long billId) { this.billId = billId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Double getAmountOwed() { return amountOwed; }
    public void setAmountOwed(Double amountOwed) { this.amountOwed = amountOwed; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}