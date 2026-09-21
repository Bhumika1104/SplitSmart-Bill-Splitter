package com.bill_splitter.repository;

import com.bill_splitter.model.SettlementRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SettlementRequestRepository extends JpaRepository<SettlementRequest, Long> {
    List<SettlementRequest> findByGroupIdAndToUserIdAndStatus(Long groupId, Long toUserId, String status);
    List<SettlementRequest> findByGroupIdAndFromUserIdAndStatus(Long groupId, Long fromUserId, String status);
}