package com.vpm.vocalpitchmonitor.mappers;

import com.vpm.vocalpitchmonitor.DTOs.ArtistListResponseDto;
import com.vpm.vocalpitchmonitor.DTOs.AudiotrackResponseDto;
import com.vpm.vocalpitchmonitor.DTOs.VocaltrackResponseDto;
import com.vpm.vocalpitchmonitor.entities.Audiotrack;
import com.vpm.vocalpitchmonitor.entities.Song;
import com.vpm.vocalpitchmonitor.entities.Vocaltrack;
import com.vpm.vocalpitchmonitor.repositories.AudiotrackRepository;
import com.vpm.vocalpitchmonitor.repositories.SongRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class FileMapper {

    private final SongRepository songRepository;
    private final AudiotrackRepository audiotrackRepository;

    public FileMapper(SongRepository songRepository, AudiotrackRepository audiotrackRepository) {
        this.songRepository = songRepository;
        this.audiotrackRepository = audiotrackRepository;
    }

    public Vocaltrack toVocaltrack(MultipartFile vocalTrackFile, int songId) throws IOException, EntityNotFoundException {

        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new EntityNotFoundException("Song not found with id: " + songId));

        Vocaltrack entity = new Vocaltrack();

        entity.setFileName(vocalTrackFile.getOriginalFilename());
        entity.setByteSize(vocalTrackFile.getSize());
        entity.setVocalData(vocalTrackFile.getBytes());
        entity.setContentType(vocalTrackFile.getContentType());
        entity.setSong(song);

        return entity;
    }

    public VocaltrackResponseDto toVocaltrackResponseDto(Vocaltrack vocaltrack){

        return new VocaltrackResponseDto(
                vocaltrack.getFileName(),
                vocaltrack.getByteSize(),
                vocaltrack.getVocalData()
        );
    }

    public Audiotrack toAudiotrack(MultipartFile audioTrackFile, int songId) throws IOException, EntityNotFoundException {

        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new EntityNotFoundException("Song not found with id: " + songId));

        Audiotrack entity = new Audiotrack();

        entity.setFileName(audioTrackFile.getOriginalFilename());
        entity.setByteSize(audioTrackFile.getSize());
        entity.setAudioData(audioTrackFile.getBytes());
        entity.setContentType(audioTrackFile.getContentType());
        entity.setSong(song);

        return entity;
    }

    public AudiotrackResponseDto toAudiotrackResponseDto(Audiotrack audiotrack){
        return new AudiotrackResponseDto(
                audiotrack.getSong().getTitle(),
                audiotrack.getSong().getArtist().getArtistName(),
                audiotrack.getSong().getDuration()
        );
    }
}
