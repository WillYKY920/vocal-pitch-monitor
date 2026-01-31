package com.vpm.vocalpitchmonitor.services;

import com.vpm.vocalpitchmonitor.DTOs.AudiotrackResponseDto;
import com.vpm.vocalpitchmonitor.DTOs.VocalTrackDto;
import com.vpm.vocalpitchmonitor.entities.Song;
import com.vpm.vocalpitchmonitor.mappers.FileMapper;
import com.vpm.vocalpitchmonitor.repositories.AudiotrackRepository;
import com.vpm.vocalpitchmonitor.repositories.SongRepository;
import com.vpm.vocalpitchmonitor.repositories.VocaltrackRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class TrackService {

    private final SongRepository songRepository;
    private FileMapper mapper;

    private VocaltrackRepository vocaltrackRepository;

    private AudiotrackRepository audiotrackRepository;

    @Autowired
    public TrackService(FileMapper mapper, VocaltrackRepository vocaltrackRepository, AudiotrackRepository audiotrackRepository, SongRepository songRepository) {
        this.mapper = mapper;
        this.vocaltrackRepository = vocaltrackRepository;
        this.audiotrackRepository = audiotrackRepository;
        this.songRepository = songRepository;
    }

    public void saveVocalTrack(VocalTrackDto vocalTrackDto, int songId) throws IOException {

        vocaltrackRepository.save(mapper.toVocalTrack(vocalTrackDto, songId));
    }

    public void saveAudiotrack(MultipartFile audiotrackFile, int songId) throws IOException {

        audiotrackRepository.save(mapper.toAudiotrack(audiotrackFile, songId));
    }

    public AudiotrackResponseDto getAudiotrackDtoById(int id) throws EntityNotFoundException{

        return audiotrackRepository.findById(id)
                .map(mapper::toAudiotrackResponseDto)
                .orElseThrow(()-> new EntityNotFoundException("Song not found with id: " + id));
    }

    public VocalTrackDto getVocalTrackDtoBySongId(int id) throws EntityNotFoundException {

         Song song = songRepository.findById(id).orElseThrow(()-> new EntityNotFoundException("Song not found with id: " + id));
        return mapper.toVocalTrackDto(song.getVocaltrack());
    }


}
