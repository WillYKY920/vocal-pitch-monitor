package com.vpm.vocalpitchmonitor.DTOs;

import java.util.List;

public record ArtistResponseDto(

        String name,

        List<SongResponseDto> songs

){

}

