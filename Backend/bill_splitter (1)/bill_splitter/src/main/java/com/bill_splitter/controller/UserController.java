package com.bill_splitter.controller;

import com.bill_splitter.model.User;
import com.bill_splitter.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") 
public class UserController {

    @Autowired
    private UserRepository userRepository;

   
    @GetMapping("/all")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}