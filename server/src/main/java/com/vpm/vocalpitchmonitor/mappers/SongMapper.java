package com.vpm.vocalpitchmonitor.mappers;

import com.vpm.vocalpitchmonitor.DTOs.*;
import com.vpm.vocalpitchmonitor.entities.Artist;
import com.vpm.vocalpitchmonitor.entities.Song;
import com.vpm.vocalpitchmonitor.entities.SyncedLyrics;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SongMapper {

    public SongResponseDto toSongResponseDto(Song song) {

        SongResponseDto response = new SongResponseDto(
                song.getId(),
                song.getTitle(),
                song.getArtist().getArtistName(),
                song.getDuration()
        );

        return response;
    }

    public Song toSong(SongDto dto, Artist artist) {

        Song entity = new Song();
        entity.setTitle(dto.title());
        entity.setDuration(dto.duration());
        entity.setArtist(artist);

        return entity;
    }

    public ArtistResponseDto toArtistResponseDto(Artist artist){

        List<Song> songs = artist.getSongs();
        List<SongResponseDto> songResponseDtos = new ArrayList<>(songs.size());

        for (Song song : songs) {
            songResponseDtos.add(toSongResponseDto(song));
        }
        return new ArtistResponseDto(artist.getArtistName(), songResponseDtos);
    }

    public ArtistListResponseDto.ArtistSummary toArtistSummary(Artist artist) {
        if (artist == null) {
            return null;
        }
        return new ArtistListResponseDto.ArtistSummary(
                artist.getArtistName(),
                artist.getLanguage() // Replace with your actual getter name if different
        );
    }


}
