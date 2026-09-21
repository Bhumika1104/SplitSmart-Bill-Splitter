package com.bill_splitter.controller;

import com.bill_splitter.model.Group;
import com.bill_splitter.model.GroupMember;
import com.bill_splitter.model.User;
import com.bill_splitter.service.GroupService;
import com.bill_splitter.repository.GroupMemberRepository;
import com.bill_splitter.repository.GroupRepository;
import com.bill_splitter.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "*")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/create")
    public ResponseEntity<Group> createGroup(@RequestBody Group group) {
        Group newGroup = groupService.createGroup(group);
        return ResponseEntity.ok(newGroup);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Group>> getGroupsByUser(@PathVariable Long userId) {
        List<Group> groups = groupService.getGroupsByUser(userId);
        return ResponseEntity.ok(groups);
    }

 
    @GetMapping("/{groupId}")
    public ResponseEntity<Group> getGroupById(@PathVariable Long groupId) {
        return groupRepository.findById(groupId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/add-member")
    public ResponseEntity<GroupMember> addMember(@RequestParam Long groupId, @RequestParam Long userId) {
        GroupMember member = groupService.addMemberToGroup(groupId, userId);
        return ResponseEntity.ok(member);
    }

    @PutMapping("/member-status/{memberId}")
    public ResponseEntity<GroupMember> updateStatus(@PathVariable Long memberId, @RequestParam String status) {
        GroupMember member = groupService.updateMemberStatus(memberId, status);
        if (member != null) {
            return ResponseEntity.ok(member);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<Map<String, Object>>> getGroupMembers(@PathVariable Long groupId) {
        List<GroupMember> members = groupMemberRepository.findByGroup_Id(groupId);
        
        List<Map<String, Object>> memberDetails = new ArrayList<>();
        Set<Long> processedUserIds = new HashSet<>();

        for (GroupMember member : members) {
            if (member.getUser() != null) {
                Long userId = member.getUser().getId();
                if (!processedUserIds.contains(userId)) {
                    processedUserIds.add(userId);
                    User userObj = userRepository.findById(userId).orElse(null);
                    
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", member.getId());
                    map.put("userId", userId);
                    map.put("name", userObj != null ? userObj.getName() : "Unknown User");
                    map.put("status", member.getStatus());
                    memberDetails.add(map);
                }
            }
        }
        return ResponseEntity.ok(memberDetails);
    }

    @GetMapping("/invites/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getPendingInvites(@PathVariable Long userId) {
        List<GroupMember> invites = groupMemberRepository.findByUser_IdAndStatus(userId, "PENDING");
        
        List<Map<String, Object>> inviteDetails = new ArrayList<>();
        for (GroupMember inv : invites) {
            if (inv.getGroup() != null) {
                Long gId = inv.getGroup().getId();
                Group group = groupRepository.findById(gId).orElse(null);
            
                Map<String, Object> map = new HashMap<>();
                map.put("id", inv.getId());
                map.put("groupId", gId);
                map.put("groupName", group != null ? group.getGroupName() : "Unknown Group");
                map.put("status", inv.getStatus());
                inviteDetails.add(map);
            }
        }
        return ResponseEntity.ok(inviteDetails);
    }

    @PostMapping("/respond")
    public ResponseEntity<String> respondToInvitation(@RequestParam Long groupId, @RequestParam Long userId, @RequestParam String status) {
        List<GroupMember> members = groupMemberRepository.findByGroup_IdAndUser_Id(groupId, userId);
        
        if (members != null && !members.isEmpty()) {
            for (GroupMember member : members) {
                if ("REJECTED".equalsIgnoreCase(status)) {
                    groupMemberRepository.delete(member);
                } else {
                    member.setStatus(status);
                    groupMemberRepository.save(member);
                }
            }
            return ResponseEntity.ok("Invitation " + status.toLowerCase() + " successfully!");
        }
        return ResponseEntity.badRequest().body("Invitation not found");
    }
}