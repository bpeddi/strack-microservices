## How It Works:

1. **JwtTokenUtil**: Handles JWT token validation and extraction of user details from the token.
2. **JwtAuthenticationFilter**: Intercepts incoming requests, extracts the JWT token, validates it, and sets up the security context with user details and roles.
3. **SecurityConfig**: Configures security for different endpoints, specifying which roles have access to which endpoints.
