package com.vpm.vocalpitchmonitor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class VocalPitchMonitorApplication {

    public static void main(String[] args) {

        SpringApplication.run(VocalPitchMonitorApplication.class, args);

        System.out.println("Application is running...");
    }
}
