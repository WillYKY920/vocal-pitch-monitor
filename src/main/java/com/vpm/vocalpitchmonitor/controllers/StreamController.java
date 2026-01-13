package com.vpm.vocalpitchmonitor.controllers;

import com.vpm.vocalpitchmonitor.DTOs.AudiotrackResponseDto;
import com.vpm.vocalpitchmonitor.services.StreamService;
import com.vpm.vocalpitchmonitor.services.TrackService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
public class StreamController {

    public StreamService streamService;
    public TrackService trackService;

    private static Integer CURRENTLY_PLAYING_ID = null;

    @Autowired
    public StreamController(StreamService streamService, TrackService trackService) {
        this.streamService = streamService;
        this.trackService = trackService;
    }
    /*
    http://localhost:8080/play/{song_id}
    */
    @GetMapping("/play/{song_id}")
    public void playAudio(
            @PathVariable("song_id") @Valid int songId, HttpServletResponse response) throws IOException {

            CURRENTLY_PLAYING_ID = songId;
            streamService.streamAudio(response, songId);
    }
    /*
   http://localhost:8080/play/info
   */
    @GetMapping("/play/info")
    public AudiotrackResponseDto getAudioInfo() {
        if (CURRENTLY_PLAYING_ID == null) {
            return null;
        }
        return trackService.getAudiotrackDtoById(CURRENTLY_PLAYING_ID);
    }

}
