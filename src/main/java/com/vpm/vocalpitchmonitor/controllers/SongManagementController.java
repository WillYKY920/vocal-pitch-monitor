package com.vpm.vocalpitchmonitor.controllers;

import com.vpm.vocalpitchmonitor.DTOs.*;
import com.vpm.vocalpitchmonitor.services.SongManagementService;
import com.vpm.vocalpitchmonitor.services.TrackService;
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

    /*
    http://localhost:8080/vocal/{songId}
    */
    @PostMapping("/vocal/{song_id}")
    public ResponseEntity<?> saveVocaltrack(
            @RequestParam("file") @NotNull(message = "File is empty") MultipartFile vocalTrackFile,
            @PathVariable("song_id") int id
    ) throws IOException {

        trackService.saveVocaltrack(vocalTrackFile, id);
        return ResponseEntity.status(HttpStatus.OK).build();
    }

    /*
    http://localhost:8080/audio/{songId}
     */
    @PostMapping("/audio/{song_id}")
    public ResponseEntity<?> saveAudiotrack(
            @RequestParam("file") @NotNull(message = "File is empty") MultipartFile audioTrackFile,
            @PathVariable("song_id") int id
    ) throws IOException {
        trackService.saveAudiotrack(audioTrackFile, id);
        return ResponseEntity.status(HttpStatus.OK).build();
    }

    /*
    http://localhost:8080/song/{songId}
    */
    @GetMapping("/song/{song_id}")
    public SongResponseDto findSongById(@PathVariable("song_id") int id) {

        return songManagementService.findSongById(id);
    }

    /*
    http://localhost:8080/song/save
    */
    @PostMapping("/song/save")
    public SongResponseDto saveSong(@RequestBody @Valid SongDto dto) {

        return songManagementService.saveSong(dto);
    }
    /*
    http://localhost:8080/artist/save
    */
    @PostMapping("/artist/save")
    public ArtistResponseDto saveArtist(@RequestParam String name) {

        return songManagementService.saveArtist(name);
    }
    /*
    http://localhost:8080/lrc/save
    */
    @PostMapping("/lrc/save")
    public SongResponseDto saveSongWithLyrics(
            @RequestParam("file") MultipartFile file) throws IOException{

        return songManagementService.saveSongWithLyrics(file);
    }

    /*
    http://localhost:8080/artist/{artist-name}
    */
    @GetMapping("/artist/{artist_name}")
    public ArtistResponseDto findArtistByName(@PathVariable("artist_name") @Valid String name){

        return songManagementService.findArtistByName(name);
    }

    /*
    http://localhost:8080/lyrics/{song_id}
    */
    @GetMapping("/lyrics/{song_id}")
    public LyricsResponseDto findLyricsBySongId(@PathVariable("song_id") @Valid int id) {

        return songManagementService.findLyricsBySongId(id);
    }

    /*
    http://localhost:8080/song/all
    */
    @GetMapping("/song/all")
    @ResponseStatus(HttpStatus.OK)
    public List<SongResponseDto> findAllSongs(){

        return songManagementService.findAllSongs();
    }

    @GetMapping("/artist/all")
    public ArtistListResponseDto findAllArtists() {
        return songManagementService.findAllArtistNames();
    }
}
