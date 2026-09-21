package com.bill_splitter.repository;

import com.bill_splitter.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByGroupId(Long groupId);
}