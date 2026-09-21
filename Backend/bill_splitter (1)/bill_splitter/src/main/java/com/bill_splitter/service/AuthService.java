package com.bill_splitter.service;

import com.bill_splitter.model.User;
import com.bill_splitter.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public User registerUser(User user) {
        return userRepository.save(user); 
    }

    public User loginUser(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email); 
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(password)) {
                return user;
            }
        }
        return null;
    }
}