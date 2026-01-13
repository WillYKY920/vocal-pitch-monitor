package com.vpm.vocalpitchmonitor.services;

import com.vpm.vocalpitchmonitor.DTOs.*;
import com.vpm.vocalpitchmonitor.entities.*;
import com.vpm.vocalpitchmonitor.mappers.SongMapper;
import com.vpm.vocalpitchmonitor.repositories.ArtistRepository;
import com.vpm.vocalpitchmonitor.repositories.LyricsRepository;
import com.vpm.vocalpitchmonitor.repositories.SongRepository;
import com.vpm.vocalpitchmonitor.utils.LRCParser;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SongManagementService {

    private final SongMapper mapper;

    private final SongRepository songRepository;

    private final ArtistRepository artistRepository;

    private final LyricsRepository lyricsRepository;

    @Autowired
    public SongManagementService(SongMapper mapper, SongRepository songRepository, ArtistRepository artistRepository, LyricsRepository lyricsRepository) {
        this.mapper = mapper;
        this.songRepository = songRepository;
        this.artistRepository = artistRepository;
        this.lyricsRepository = lyricsRepository;
    }

    public ArtistResponseDto saveArtist(String name){

        Artist artist = artistRepository.save(new Artist(name));
        return mapper.toArtistResponseDto(artist);
    }

    public SongResponseDto saveSong(SongDto dto){

        Artist artist = findOrCreateArtist(dto.artist());

        Song save = songRepository.save(mapper.toSong(dto, artist));
        return mapper.toSongResponseDto(save);
    }

    public SongResponseDto saveSongWithLyrics(MultipartFile lrcFile) throws IOException {

        SongDto dto = LRCParser.parseMetadata(lrcFile);
        SyncedLyrics lyrics = LRCParser.parseLyrics(lrcFile);
        Song song = mapper.toSong(dto, findOrCreateArtist(dto.artist()));
        song.setLyrics(lyrics);
        lyrics.setSong(song);
        songRepository.save(song);
        lyricsRepository.save(lyrics);

        return mapper.toSongResponseDto(song);
    }

    public ArtistResponseDto findArtistByName(String name) throws EntityNotFoundException {
        Artist artist = artistRepository.findByArtistName(name)
                .orElseThrow(() -> new EntityNotFoundException("Artist not found with name: " + name));

        return mapper.toArtistResponseDto(artist);
    }

    public LyricsResponseDto findLyricsBySongId(int songId) throws EntityNotFoundException {
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new EntityNotFoundException("Song not found with id: "+ songId));
        return new LyricsResponseDto(
                song.getLyrics().getLyricsJson()
        );
    }

    public SongResponseDto findSongById(int id) throws EntityNotFoundException {

        return songRepository.findById(id)
                .map(mapper::toSongResponseDto)
                .orElseThrow(() -> new EntityNotFoundException("Song not found with id: "+ id));
    }

    public Audiotrack findAudioTrackBySongId(int id) {
        Song song = songRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Song not found with id: "+ id));
        return song.getAudiotrack();
    }

    public Vocaltrack findVocalTrackBySongId(int id) {
        Song song = songRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Song not found with id: "+ id));
        return song.getVocaltrack();
    }

    public ArtistResponseDto findArtistById(int id) throws EntityNotFoundException {
        return artistRepository.findById(id)
                .map(mapper::toArtistResponseDto)
                .orElseThrow(() -> new EntityNotFoundException("Artist not found with id: "+ id));
    }

    public Artist findOrCreateArtist(String artistName) {

        return artistRepository.findByArtistName(artistName)
                .orElseGet(() -> {
                    Artist artist = new Artist();
                    artist.setArtistName(artistName);
                    return artistRepository.save(artist);
                });
    }

    public List<ArtistResponseDto> findAllArtists() {

        return artistRepository.findAll()
                .stream()
                .map(mapper::toArtistResponseDto)
                .collect(Collectors.toList());
    }

    public List<SongResponseDto> findAllSongs(){

        return songRepository.findAll()
                .stream()
                .map(mapper::toSongResponseDto)
                .collect(Collectors.toList());
    }



}
