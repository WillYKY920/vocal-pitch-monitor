package com.vpm.vocalpitchmonitor.controllers;

import com.vpm.vocalpitchmonitor.DTOs.AudiotrackResponseDto;
import com.vpm.vocalpitchmonitor.services.StreamService;
import com.vpm.vocalpitchmonitor.services.TrackService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api")
public class StreamController {

    public StreamService streamService;
    public TrackService trackService;

    private static Integer CURRENTLY_PLAYING_ID = null;

    @Autowired
    public StreamController(StreamService streamService, TrackService trackService) {
        this.streamService = streamService;
        this.trackService = trackService;
    }

     /**
     * Streams the audio content for a specific song ID to the HTTP response.
     * <p>Endpoint: GET /play/{song_id}</p>
     *
     * @param songId the ID of the song to stream
     * @param response the HttpServletResponse to which the audio stream is written
     * @throws IOException if an I/O error occurs while streaming the audio
     */
    @GetMapping("/play/{song_id}")
    public void playAudio(
            @PathVariable("song_id") @Valid int songId, HttpServletResponse response) throws IOException {
        CURRENTLY_PLAYING_ID = songId;
        streamService.streamAudio(response, songId);
    }

    /**
     * Retrieves information about the currently playing audio track.
     * <p>Endpoint: GET /play/info</p>
     *
     * @return an AudiotrackResponseDto containing details of the currently playing track,
     *         or null if no track is currently playing
     */
    @GetMapping("/play/info")
    public AudiotrackResponseDto getAudioInfo() {
        if (CURRENTLY_PLAYING_ID == null) {
            return null;
        }
        return trackService.getAudiotrackDtoById(CURRENTLY_PLAYING_ID);
    }


}
