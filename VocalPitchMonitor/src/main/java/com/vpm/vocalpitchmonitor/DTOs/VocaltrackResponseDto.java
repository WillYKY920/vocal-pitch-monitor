package com.vpm.vocalpitchmonitor.DTOs;

public record VocaltrackResponseDto(

        String name,

        Long size,

        byte[] data

){

}
