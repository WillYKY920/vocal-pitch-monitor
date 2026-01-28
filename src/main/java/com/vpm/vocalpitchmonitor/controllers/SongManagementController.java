package com.vpm.vocalpitchmonitor.controllers;

import com.vpm.vocalpitchmonitor.DTOs.*;
import com.vpm.vocalpitchmonitor.services.SongManagementService;
import com.vpm.vocalpitchmonitor.services.TrackService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Validated
@RestController
public class SongManagementController {

    private final SongManagementService songManagementService;
    private final TrackService trackService;

    @Autowired
    public SongManagementController(SongManagementService songManagementService, TrackService trackService) {
        this.songManagementService = songManagementService;
        this.trackService = trackService;
    }

    /**
     * Saves a vocal track for a specific song.
     * Endpoint: POST /vocal/{song-id}</p>
     *
     * @param vocalTrackDto the data transfer object containing vocal track details
     * @param id the ID of the song to associate the vocal track with
     * @return the saved VocalTrackDto
     * @throws IOException if an I/O error occurs during processing
     */
    @PostMapping("/vocal/{song-id}")
    public VocalTrackDto saveVocalTrack(
            @RequestBody VocalTrackDto vocalTrackDto,
            @PathVariable("song-id") int id
    ) throws IOException {
        trackService.saveVocalTrack(vocalTrackDto, id);
        return vocalTrackDto;
    }

    /**
     * Uploads and saves an audio track file for a specific song.
     * <p>Endpoint: POST /audio/{song-id}</p>
     *
     * @param audioTrackFile the multipart audio file to upload (cannot be empty)
     * @param id the ID of the song to associate the audio track with
     * @return a ResponseEntity with HTTP status 200(OK) if successful
     * @throws IOException if an I/O error occurs during file upload
     */
    @PostMapping("/audio/{song-id}")
    public ResponseEntity<Map<String, String>> saveAudiotrack(
            @RequestParam("file") @NotNull(message = "File is empty") MultipartFile audioTrackFile,
            @PathVariable("song-id") int id
    ) throws IOException {
        trackService.saveAudiotrack(audioTrackFile, id);
        return ResponseEntity.status(HttpStatus.OK).build();
    }

    /**
     * Retrieves the vocal track associated with a specific song ID.
     * <p>Endpoint: GET /vocal/{song-id}</p>
     *
     * @param id the ID of the song
     * @return the VocalTrackDto containing vocal track details
     */
    @GetMapping("/vocal/{song-id}")
    public VocalTrackDto findVocalTrackBySongId(
            @PathVariable("song-id") int id
    ) throws EntityNotFoundException {
        return trackService.getVocalTrackDtoBySongId(id);
    }

    /**
     * Retrieves song details by its ID.
     * <p>Endpoint: GET /song/{song_id}</p>
     *
     * @param id the ID of the song to retrieve
     * @return the SongResponseDto containing song details
     */
    @GetMapping("/song/{song_id}")
    public SongResponseDto findSongById(@PathVariable("song_id") int id) {
        return songManagementService.findSongById(id);
    }

    /**
     * Saves a new song to the database.
     * <p>Endpoint: POST /song/save</p>
     *
     * @param songDto the SongDto containing the song information to save
     * @return the saved SongResponseDto
     */
    @PostMapping("/song/save")
    public SongResponseDto saveSong(@RequestBody @Valid SongDto songDto) {
        return songManagementService.saveSong(songDto);
    }

    /**
     * Saves a new artist.
     * <p>Endpoint: POST /artist/save</p>
     *
     * @param name the name of the artist to save
     * @return the saved ArtistResponseDto
     */
    @PostMapping("/artist/save")
    public ArtistResponseDto saveArtist(@RequestParam String name) {
        return songManagementService.saveArtist(name);
    }

    /**
     * Parses and saves a song from an uploaded LRC (lyrics) file.
     * <p>Endpoint: POST /lrc/save</p>
     *
     * @param file the multipart LRC file to upload (formData)
     * @return the SongResponseDto containing the saved song details
     * @throws IOException if an I/O error occurs during file processing
     */
    @PostMapping("/lrc/save")
    public SongResponseDto saveSongWithLyrics(
            @RequestParam("file") MultipartFile file) throws IOException{
        return songManagementService.saveSongWithLyrics(file);
    }

    /**
     * Finds an artist by their name.
     * <p>Endpoint: GET /artist/{artist_name}</p>
     *
     * @param name the name of the artist to search for
     * @return the ArtistResponseDto containing artist details
     * @throws EntityNotFoundException if no artists match the requested name
     */
    @GetMapping("/artist/{artist_name}")
    public ArtistResponseDto findArtistByName(
            @PathVariable("artist_name") @Valid String name) throws EntityNotFoundException{
        return songManagementService.findArtistByName(name);
    }

    /**
     * Retrieves lyrics for a specific song ID.
     * <p>Endpoint: GET /lyrics/{song_id}</p>
     *
     * @param id the ID of the song
     * @return the LyricsResponseDto containing the lyrics
     * @throws EntityNotFoundException if no lyrics match the requested ID
     */
    @GetMapping("/lyrics/{song_id}")
    public LyricsResponseDto findLyricsBySongId(
            @PathVariable("song_id") @Valid int id) throws EntityNotFoundException {
        return songManagementService.findLyricsBySongId(id);
    }

    /**
     * Retrieves a list of all songs in the database.
     * <p>Endpoint: GET /song/all</p>
     *
     * @return a list of SongResponseDto objects representing all songs
     */
    @GetMapping("/song/all")
    @ResponseStatus(HttpStatus.OK)
    public List<SongResponseDto> findAllSongs(){
        return songManagementService.findAllSongs();
    }

    /**
     * Retrieves a list of all artists in the database.
     * <p>Endpoint: GET /artist/all</p>
     *
     * @return an ArtistListResponseDto containing all artist names
     */
    @GetMapping("/artist/all")
    public ArtistListResponseDto findAllArtists() {
        return songManagementService.findAllArtistNames();
    }

    /**
     * Deletes a song by its ID.
     * <p>Endpoint: GET /song/delete/{song-id}</p>
     *
     * @param songId the ID of the song to delete
     * @throws EntityNotFoundException if no songs match the requested ID
     */
    @GetMapping("/song/delete/{song-id}")
    public ResponseEntity<Map<String, String>> deleteSongBySongId(
            @PathVariable("song-id") int songId) throws EntityNotFoundException {

        songManagementService.deleteSongBySongId(songId);
        return ResponseEntity.status(HttpStatus.OK).build();
    }

}
