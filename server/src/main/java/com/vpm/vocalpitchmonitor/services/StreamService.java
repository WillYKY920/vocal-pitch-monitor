package com.vpm.vocalpitchmonitor.services;

import com.vpm.vocalpitchmonitor.entities.Audiotrack;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Service class responsible for handling audio data streaming operations.
 * Manages the retrieval of audio tracks and writing them directly to the HTTP response stream
 * to allow clients to play or download audio files.
 */
@Service
public class StreamService {

    private final SongManagementService songManagementService;

    @Autowired
    public StreamService(SongManagementService songManagementService) {
        this.songManagementService = songManagementService;
    }

    /**
     * Streams the audio data for a specific song directly to the HTTP response.
     * Retrieves the Audiotrack associated with the given song ID, sets the appropriate
     * HTTP headers (Content-Type, Content-Length, Content-Disposition), and writes the
     * binary audio data to the response output stream.
     *
     * @param response the {@link HttpServletResponse} to which the audio data is written
     * @param songId   the unique identifier of the song whose audio track is to be streamed
     * @throws IOException if an input or output exception occurs while writing to the response stream
     */
    public void streamAudio(HttpServletResponse response, int songId) throws IOException {
        Audiotrack audiotrack = songManagementService.findAudioTrackBySongId(songId);

        response.setContentType(audiotrack.getContentType());
        response.setContentLengthLong(audiotrack.getByteSize());

        String encodedFileName = URLEncoder.encode(audiotrack.getFileName(), StandardCharsets.UTF_8)
                .replace("+", "%20");
        response.setHeader("Content-Disposition", "inline; filename=\"" + encodedFileName + "\"");
        response.setHeader("Accept-Ranges", "bytes");

        try (OutputStream outputStream = response.getOutputStream()) {
            outputStream.write(audiotrack.getAudioData());
            outputStream.flush();
        }
    }
}
