package com.vpm.vocalpitchmonitor.services;

import com.vpm.vocalpitchmonitor.entities.Audiotrack;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;


@Service
public class StreamService {

    private final SongManagementService songManagementService;

    @Autowired
    public StreamService(SongManagementService songManagementService) {
        this.songManagementService = songManagementService;
    }

    public void streamAudio(HttpServletResponse response, int songId) throws IOException {

        Audiotrack audiotrack = songManagementService.findAudioTrackBySongId(songId);

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
