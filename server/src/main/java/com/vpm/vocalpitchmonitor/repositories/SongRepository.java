package com.vpm.vocalpitchmonitor.repositories;

import com.vpm.vocalpitchmonitor.entities.Song;
import com.vpm.vocalpitchmonitor.DTOs.SongResponseDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SongRepository extends JpaRepository<Song, Integer> {

    @Query("SELECT new com.vpm.vocalpitchmonitor.DTOs.SongResponseDto(s.id, s.title, s.artist.artistName, s.duration) " +
            "FROM Song s WHERE s.artist.artistName = :artistName")
    List<SongResponseDto> findSongSummariesByArtistName(@Param("artistName") String artistName);

    // DTO Projection: Fetch only the fields needed and map directly to the DTO
    @Query("SELECT new com.vpm.vocalpitchmonitor.DTOs.SongResponseDto(s.id, s.title, s.artist.artistName, s.duration) FROM Song s")
    List<SongResponseDto> findAllSongSummaries();
}
