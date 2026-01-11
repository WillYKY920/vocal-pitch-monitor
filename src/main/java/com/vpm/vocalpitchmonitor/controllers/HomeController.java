package com.vpm.vocalpitchmonitor.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    @GetMapping("/vpm")
    public String index() {
        return "redirect:/home.html";
    }

}
