package com.vpm.vocalpitchmonitor.configs;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

/**
 * Security config: disables CSRF, requires login for /test and /api/**, permits everything else,
 * and uses default form login.
 */
@Configuration
public class SecurityConfig {

    /**
     * Builds the HTTP security filter chain for the application.
     *
     * @param http HttpSecurity to configure.
     * @return The configured SecurityFilterChain.
     * @throws Exception If security configuration fails.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/test").authenticated()
                        .requestMatchers("/api/**").permitAll()
                        .anyRequest().permitAll()
                )
                .formLogin(Customizer.withDefaults());

        return http.build();
    }

    /**
     * In-memory demo user for logging in.
     * Username admin, password 20271834, role USER.
     */
    @Bean
    public InMemoryUserDetailsManager userDetailsService() {
        UserDetails user = User.withDefaultPasswordEncoder()
                .username("admin")
                .password("20271834")
                .roles("USER")
                .build();
        return new InMemoryUserDetailsManager(user);
    }
}

