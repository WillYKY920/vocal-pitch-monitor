package com.vpm.vocalpitchmonitor.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    /*
    http://localhost:8080/vpm
    */
    @GetMapping("/vpm")
    public String homePage() {
        return "redirect:/home.html";
    }

    /*
    http://localhost:8080/test
    */
    @GetMapping("/test")
    public String testPage() {
        return "redirect:/test.html";
    }

}
