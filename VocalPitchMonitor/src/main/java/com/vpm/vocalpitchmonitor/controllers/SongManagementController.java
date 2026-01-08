package com.vpm.vocalpitchmonitor.controllers;

import com.vpm.vocalpitchmonitor.DTOs.ArtistResponseDto;
import com.vpm.vocalpitchmonitor.DTOs.SongDto;
import com.vpm.vocalpitchmonitor.DTOs.SongResponseDto;
import com.vpm.vocalpitchmonitor.services.SongService;
import com.vpm.vocalpitchmonitor.services.TrackService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
public class SongManagementController {

    private final SongService songService;
    private final TrackService trackService;

    @Autowired
    public SongManagementController(SongService songService, TrackService trackService) {
        this.songService = songService;
        this.trackService = trackService;
    }

    /*
    http://localhost:8080/vocal/{songId}
    */
    @PostMapping("/vocal/{songId}")
    public ResponseEntity<?> saveVocaltrack(
            @RequestParam("file") MultipartFile vocalTrackFile,
            @PathVariable("songId") int id
    ){
        try{
            if (!vocalTrackFile.isEmpty()){
                trackService.saveVocaltrack(vocalTrackFile, id);
                return ResponseEntity.status(HttpStatus.OK).build();
            }else{
                throw new IOException();
            }
        }
        catch (EntityNotFoundException entityDNE){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Entity with id <"+id+"> " + entityDNE.getMessage()));
        }
        catch (IOException error){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "File upload failed: " + error.getMessage()));
        }
    }

    /*
    http://localhost:8080/audio/{songId}
     */
    @PostMapping("/audio/{songId}")
    public ResponseEntity<?> saveAudiotrack(
            @RequestParam("file") MultipartFile audioTrackFile,
            @PathVariable("songId") int id
    ){
        try{
            if (!audioTrackFile.isEmpty()){
                trackService.saveAudiotrack(audioTrackFile, id);
                return ResponseEntity.status(HttpStatus.OK).build();
            }else{
                throw new IOException();
            }
        }
        catch (EntityNotFoundException entityDNE){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Entity with id <"+id+"> " + entityDNE.getMessage()));
        }
        catch (IOException error){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "File upload failed: " + error.getMessage()));
        }
    }

    /*
    http://localhost:8080/song/{songId}
    */
    @GetMapping("/song/{songId}")
    public SongResponseDto findSongById(@PathVariable("songId") int id){

        SongResponseDto response = songService.findById(id);
        return response;
    }

    /*
    http://localhost:8080/song/save
    */
    @PostMapping("/song/save")
    public SongResponseDto saveSong(@RequestBody SongDto dto){

        return songService.saveSong(dto);
    }
    /*
    http://localhost:8080/artist/save
    */
    @PostMapping("/artist/save")
    public ArtistResponseDto saveArtist(@RequestParam String name){

        return songService.saveArtist(name);
    }

    /*
    http://localhost:8080/artist/{artist-name}
    */
    @GetMapping("/artist/{artist_name}")
    public ArtistResponseDto findArtistByName(@PathVariable("artist_name") String name){
        try {
            return songService.findArtistByName(name);
        }
        catch (EntityNotFoundException entityDNE){
            return null;
        }
    }
    /*
    http://localhost:8080/song/all
    */
    @GetMapping("/song/all")
    public List<SongResponseDto> findAllSongs(){

        return songService.findAll();
    }

}
