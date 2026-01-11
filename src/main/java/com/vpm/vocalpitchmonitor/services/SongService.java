package com.vpm.vocalpitchmonitor.services;

import com.vpm.vocalpitchmonitor.DTOs.*;
import com.vpm.vocalpitchmonitor.entities.Artist;
import com.vpm.vocalpitchmonitor.entities.Song;
import com.vpm.vocalpitchmonitor.mappers.SongMapper;
import com.vpm.vocalpitchmonitor.repositories.ArtistRepository;
import com.vpm.vocalpitchmonitor.repositories.SongRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SongService {

    private final SongMapper mapper;

    private final SongRepository songRepository;

    private final ArtistRepository artistRepository;

    @Autowired
    public SongService(SongMapper mapper, SongRepository songRepository, ArtistRepository artistRepository) {
        this.mapper = mapper;
        this.songRepository = songRepository;
        this.artistRepository = artistRepository;
    }

    public ArtistResponseDto saveArtist(String name){

        Artist artist = artistRepository.save(new Artist(name));
        return mapper.toArtistResponseDto(artist);
    }

    public ArtistResponseDto findArtistByName(String name) throws EntityNotFoundException {
        Artist artist = artistRepository.findByArtistName(name)
                .orElseThrow(() ->
                        new EntityNotFoundException("Artist not found with name: " + name));

        return mapper.toArtistResponseDto(artist);
    }

    public SongResponseDto saveSong(SongDto dto){

        Artist artist = findOrCreateArtist(dto.artist());

        Song save = songRepository.save(mapper.toSong(dto, artist));
        return mapper.toSongResponseDto(save);
    }

    public SongResponseDto findById(int id){

        return songRepository.findById(id)
                .map(mapper::toSongResponseDto)
                .orElseThrow(() -> null);
    }


    public Artist findOrCreateArtist(String artistName) {

        return artistRepository.findByArtistName(artistName)
                .orElseGet(() -> {
                    Artist artist = new Artist();
                    artist.setArtistName(artistName);
                    return artistRepository.save(artist);
                });
    }

    public List<SongResponseDto> findAll(){

        return songRepository.findAll()
                .stream()
                .map(mapper::toSongResponseDto)
                .collect(Collectors.toList());
    }



}
