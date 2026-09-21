package com.bill_splitter.repository;

import com.bill_splitter.model.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByGroup_Id(Long groupId);
    List<GroupMember> findByGroup_IdAndStatus(Long groupId, String status);
    List<GroupMember> findByUser_IdAndStatus(Long userId, String status);
    List<GroupMember> findByGroup_IdAndUser_Id(Long groupId, Long userId);
}