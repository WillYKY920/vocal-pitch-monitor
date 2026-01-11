package com.vpm.vocalpitchmonitor.services;

import com.vpm.vocalpitchmonitor.DTOs.AudiotrackResponseDto;
import com.vpm.vocalpitchmonitor.entities.Audiotrack;
import com.vpm.vocalpitchmonitor.repositories.AudiotrackRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;


@Service
public class StreamService {

    private final AudiotrackRepository audiotrackRepository;

    private final TrackService trackService;

    @Autowired
    public StreamService(AudiotrackRepository audiotrackRepository, TrackService trackService) {
        this.audiotrackRepository = audiotrackRepository;
        this.trackService = trackService;
    }

    public void streamAudio(HttpServletResponse response, int id) throws IOException {

        Audiotrack audiotrack = trackService.getAudiotrackById(id);

        response.setContentType(audiotrack.getContentType());
        response.setContentLengthLong(audiotrack.getByteSize());
        response.setHeader("Content-Disposition", "inline; filename=\"" + audiotrack.getFileName() + "\"");
        response.setHeader("Accept-Ranges", "bytes");

        try (OutputStream outputStream = response.getOutputStream()) {
            outputStream.write(audiotrack.getAudioData());
            outputStream.flush();

        }

    }
}
