package com.vpm.vocalpitchmonitor.repositories;

import com.vpm.vocalpitchmonitor.entities.Song;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SongRepository extends JpaRepository<Song, Integer> {

    Optional<Song> findByArtist(String name);

}
