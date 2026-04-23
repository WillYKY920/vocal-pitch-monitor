package com.vpm.vocalpitchmonitor.mappers;

import com.vpm.vocalpitchmonitor.DTOs.AudiotrackResponseDto;
import com.vpm.vocalpitchmonitor.DTOs.VocalTrackDto;
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

    public FileMapper(SongRepository songRepository) {
        this.songRepository = songRepository;
    }

    public Vocaltrack toVocalTrack(VocalTrackDto vocalTrackDto, int songId) throws EntityNotFoundException {

        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new EntityNotFoundException("Song not found with id: " + songId));

        Vocaltrack entity = new Vocaltrack();

        entity.setFileName(vocalTrackDto.fileName());
        entity.setSamples(vocalTrackDto.samples());
        entity.setVocalData(vocalTrackDto.pitchData());
        entity.setSampleRate(vocalTrackDto.sampleRate());
        entity.setHopSize(vocalTrackDto.hopSize());
        entity.setSong(song);

        return entity;
    }

    public VocalTrackDto toVocalTrackDto(Vocaltrack vocaltrack) {
        return new VocalTrackDto(
                vocaltrack.getFileName(),
                vocaltrack.getSamples(),
                vocaltrack.getSampleRate(),
                vocaltrack.getHopSize(),
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
