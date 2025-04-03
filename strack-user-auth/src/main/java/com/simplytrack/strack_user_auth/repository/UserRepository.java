package com.simplytrack.strack_user_auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.simplytrack.strack_user_auth.entity.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
}