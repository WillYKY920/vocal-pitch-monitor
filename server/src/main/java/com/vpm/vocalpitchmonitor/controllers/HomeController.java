package com.vpm.vocalpitchmonitor.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.io.IOException;

@Controller
public class HomeController {

    /**
     * Home page of the web application. Endpoint: GET /vpm
     * @return the home.html page
     */
    @GetMapping("")
    public String homePage() {
        return "redirect:index.html";
    }

    /**
     * Test page of the web application. Endpoint: GET /test
     * @return the test.html page
     */
    @GetMapping("/test")
    public String testPage() {
        return "redirect:pages/test.html";
    }

}
