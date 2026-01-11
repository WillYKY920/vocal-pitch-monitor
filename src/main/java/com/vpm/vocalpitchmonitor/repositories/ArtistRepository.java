package com.vpm.vocalpitchmonitor.repositories;

import com.vpm.vocalpitchmonitor.entities.Artist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArtistRepository extends JpaRepository<Artist, Integer> {

    Optional<Artist> findByArtistName(String name);
}
