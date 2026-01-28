package com.vpm.vocalpitchmonitor.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.io.IOException;

@Controller
public class HomeController {

    /**
     * Home page of the web application
     * <p>Endpoint: GET /vpm</p>
     *
     * @return the home.html page
     */
    @GetMapping("/vpm")
    public String homePage() {
        return "redirect:home-page/home.html";
    }

    /**
     * Test page of the web application
     * <p>Endpoint: GET /test</p>
     *
     * @return the test.html page
     */
    @GetMapping("/vpm")
    public String testPage() {
        return "redirect:test-page/test.html";
    }

}
