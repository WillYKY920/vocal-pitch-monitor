package com.vpm.vocalpitchmonitor.DTOs;

import java.util.List;

public record ArtistListResponseDto(List<ArtistSummary> artists) {

    public record ArtistSummary(String name, String lang) {}
}
