package com.vpm.vocalpitchmonitor.services;

import com.vpm.vocalpitchmonitor.DTOs.AudiotrackResponseDto;
import com.vpm.vocalpitchmonitor.DTOs.SongResponseDto;
import com.vpm.vocalpitchmonitor.DTOs.VocaltrackResponseDto;
import com.vpm.vocalpitchmonitor.entities.Audiotrack;
import com.vpm.vocalpitchmonitor.entities.Song;
import com.vpm.vocalpitchmonitor.entities.Vocaltrack;
import com.vpm.vocalpitchmonitor.mappers.FileMapper;
import com.vpm.vocalpitchmonitor.repositories.AudiotrackRepository;
import com.vpm.vocalpitchmonitor.repositories.VocaltrackRepository;
import jakarta.persistence.EntityNotFoundException;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class TrackService {

    private FileMapper mapper;

    private VocaltrackRepository vocaltrackRepository;

    private AudiotrackRepository audiotrackRepository;

    @Autowired
    public TrackService(FileMapper mapper, VocaltrackRepository vocaltrackRepository, AudiotrackRepository audiotrackRepository) {
        this.mapper = mapper;
        this.vocaltrackRepository = vocaltrackRepository;
        this.audiotrackRepository = audiotrackRepository;
    }

    public void saveVocaltrack(MultipartFile vocalTrackFile, int songId) throws IOException {

        vocaltrackRepository.save(mapper.toVocaltrack(vocalTrackFile, songId));
    }

    public void saveAudiotrack(MultipartFile audiotrackFile, int songId) throws IOException {

        audiotrackRepository.save(mapper.toAudiotrack(audiotrackFile, songId));
    }

    public AudiotrackResponseDto getAudiotrackDtoById(int id) throws EntityNotFoundException{

        return audiotrackRepository.findById(id)
                .map(mapper::toAudiotrackResponseDto)
                .orElseThrow(()-> new EntityNotFoundException("Song not found with id: " + id));
    }
}
