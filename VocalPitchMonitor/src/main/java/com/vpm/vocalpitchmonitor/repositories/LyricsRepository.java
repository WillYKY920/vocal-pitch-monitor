package com.vpm.vocalpitchmonitor.repositories;

import com.vpm.vocalpitchmonitor.entities.Lyrics;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LyricsRepository extends JpaRepository<Lyrics, Integer> {
}
