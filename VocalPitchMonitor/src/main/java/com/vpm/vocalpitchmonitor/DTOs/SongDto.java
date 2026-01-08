package com.vpm.vocalpitchmonitor.DTOs;

import jakarta.validation.constraints.NotEmpty;
import org.springframework.web.multipart.MultipartFile;


public record SongDto(

    @NotEmpty String title,

    String artist,

    @NotEmpty String duration
){

}

