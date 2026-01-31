package com.vpm.vocalpitchmonitor.DTOs;

public record VocalTrackDto(

        String fileName,

        Long samples,

        Long sampleRate,

        int hopSize,

        double[] pitchData

){

}
