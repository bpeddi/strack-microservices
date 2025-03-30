package com.simplytrack.customer_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.simplytrack.customer_service.model.Customer;


public interface CustomerRepository extends JpaRepository<Customer, Long> {
}