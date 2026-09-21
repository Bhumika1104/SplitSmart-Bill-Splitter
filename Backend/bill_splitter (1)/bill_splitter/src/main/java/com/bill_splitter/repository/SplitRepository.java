package com.bill_splitter.repository;

import com.bill_splitter.model.Split;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SplitRepository extends JpaRepository<Split, Long> {
    List<Split> findByUserId(Long userId);
    List<Split> findByBillIdIn(List<Long> billIds);
}