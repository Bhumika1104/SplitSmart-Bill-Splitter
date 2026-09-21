package com.bill_splitter.service;

import com.bill_splitter.model.Group;
import com.bill_splitter.model.GroupMember;
import com.bill_splitter.model.User;
import com.bill_splitter.repository.GroupMemberRepository;
import com.bill_splitter.repository.GroupRepository;
import com.bill_splitter.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private UserRepository userRepository;

   
    public Group createGroup(Group group) {
        Group savedGroup = groupRepository.save(group);
        
        GroupMember member = new GroupMember();
        member.setGroup(savedGroup);
        
        if (savedGroup.getCreatedBy() != null) {
            User creator = userRepository.findById(savedGroup.getCreatedBy()).orElse(null);
            member.setUser(creator);
        }
        
        member.setStatus("ACCEPTED");
        groupMemberRepository.save(member);

        return savedGroup;
    }

   
    public List<Group> getGroupsByUser(Long userId) {
        List<GroupMember> memberships = groupMemberRepository.findByUser_IdAndStatus(userId, "ACCEPTED");
        
        List<Group> userGroups = new ArrayList<>();
        for (GroupMember member : memberships) {
            if (member.getGroup() != null) {
                groupRepository.findById(member.getGroup().getId()).ifPresent(userGroups::add);
            }
        }
        
        return userGroups;
    }

   
    public GroupMember addMemberToGroup(Long groupId, Long userId) {
        List<GroupMember> existingMembers = groupMemberRepository.findByGroup_IdAndUser_Id(groupId, userId);
        GroupMember existingMember = (existingMembers != null && !existingMembers.isEmpty()) ? existingMembers.get(0) : null;

        if (existingMember != null) {
            if ("ACCEPTED".equals(existingMember.getStatus())) {
                throw new RuntimeException("User is already an accepted member of this group!");
            }
            if ("PENDING".equals(existingMember.getStatus())) {
                throw new RuntimeException("Invitation is already pending for this user!");
            }
            
            existingMember.setStatus("PENDING");
            return groupMemberRepository.save(existingMember);
        }

        
        GroupMember member = new GroupMember();
        Group group = groupRepository.findById(groupId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);
        
        member.setGroup(group);
        member.setUser(user);
        member.setStatus("PENDING");
        
        return groupMemberRepository.save(member);
    }

    
    public GroupMember updateMemberStatus(Long memberId, String status) {
        GroupMember member = groupMemberRepository.findById(memberId).orElse(null);
        if (member != null) {
            if ("REJECTED".equalsIgnoreCase(status)) {
                groupMemberRepository.delete(member);
                return null;             } else {
               
                member.setStatus(status.toUpperCase());
                return groupMemberRepository.save(member);
            }
        }
        return null;
    }
}