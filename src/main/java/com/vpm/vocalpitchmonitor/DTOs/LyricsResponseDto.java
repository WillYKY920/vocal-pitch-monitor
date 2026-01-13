package com.vpm.vocalpitchmonitor.DTOs;

import com.vpm.vocalpitchmonitor.entities.SyncedLyrics;

import java.util.List;

public record LyricsResponseDto(

        List<SyncedLyrics.LyricLine> lyrics

) {

}
