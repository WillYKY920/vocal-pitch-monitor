package com.vpm.vocalpitchmonitor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/**
 * ╦  ╦┌─┐┌─┐┌─┐┬    ╔═╗┬┌┬┐┌─┐┬ ┬  ╔╦╗┌─┐┌┐┌┬┌┬┐┌─┐┬─┐
 * ╚╗╔╝│ ││  ├─┤│    ╠═╝│ │ │  ├─┤  ║║║│ │││││ │ │ │├┬┘
 *  ╚╝ └─┘└─┘┴ ┴┴─┘  ╩  ┴ ┴ └─┘┴ ┴  ╩ ╩└─┘┘└┘┴ ┴ └─┘┴└─   v1.2.0
 * -
 * Usage Declaration:
 * -
 * This application is developed strictly for educational and training purposes. Its primary goal is to
 * assist musicians and enthusiasts in practicing their vocal pitch skills through objective feedback and
 * analysis.
 * This application does not advocate, endorse, or facilitate the piracy of copyrighted songs.
 * Users are expected to utilize legally obtained audio files for their practice sessions.
 * -
 * GitHub Repository:
 * -
 * This project is open source and dedicated to making professional vocal training more accessible.
 * Source code available at: <a href="https://github.com/WillYKY920/vocal-pitch-monitor"></a>
 */
@SpringBootApplication
public class VocalPitchMonitorApplication {

    public static void main(String[] args) {

        SpringApplication.run(VocalPitchMonitorApplication.class, args);

        System.out.println("Application is running...");
    }
}
