package com.vpm.vocalpitchmonitor.DTOs;

import com.vpm.vocalpitchmonitor.entities.Artist;

import java.util.List;

public record ArtistListResponseDto(

        List<String> artists
) {

}
