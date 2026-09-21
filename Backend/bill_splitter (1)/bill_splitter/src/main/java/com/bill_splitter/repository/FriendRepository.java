package com.bill_splitter.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bill_splitter.model.Friend;

import java.util.List;

public interface FriendRepository extends JpaRepository<Friend, Long> {
    List<Friend> findByUserIdAndStatus(Long userId, String status);
    List<Friend> findByFriendIdAndStatus(Long friendId, String status);
}