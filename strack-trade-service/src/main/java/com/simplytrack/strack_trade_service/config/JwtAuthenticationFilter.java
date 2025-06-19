package com.simplytrack.strack_trade_service.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Map;
//**JwtAuthenticationFilter**: Intercepts incoming requests, extracts the JWT token, validates it, and sets up the security context with user details and roles.

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String requestTokenHeader = request.getHeader("Authorization");

        String username = null;
        String jwtToken = null;

        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7);
            System.out.println("I received token " + jwtToken);
            try {
                username = jwtTokenUtil.getUsernameFromToken(jwtToken);
                // logger.info(" username = " + username, null);
                // Extract roles from token claims
                List<Map<String, String>> roles = jwtTokenUtil.getClaimFromToken(jwtToken, claims -> {
                    try {
                        return (List<Map<String, String>>) claims.get("roles");
                    } catch (Exception e) {
                        return new ArrayList<>();
                    }
                });
                
                // If user is authenticated and not already set in context
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // Create authentication token
                    List<SimpleGrantedAuthority> authorities = roles.stream()
                            .map(role -> new SimpleGrantedAuthority(role.get("authority")))
                            .collect(Collectors.toList());
                    
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            username, null, authorities);
                    // logger.info(" authentication = " + authentication, null);        
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
                
            } catch (Exception e) {
                logger.error("Unable to get JWT Token or JWT Token has expired", e);
            }
        } else {
            logger.warn("JWT Token does not begin with Bearer String");
        }

        chain.doFilter(request, response);
    }
}