package com.vpm.vocalpitchmonitor.DTOs;

public record VocalTrackDto(

        String fileName,

        Long samples,

        double[] pitchData

){

}
