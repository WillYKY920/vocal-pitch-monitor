package com.vpm.vocalpitchmonitor.repositories;

import com.vpm.vocalpitchmonitor.entities.Song;
import com.vpm.vocalpitchmonitor.entities.Vocaltrack;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VocaltrackRepository extends JpaRepository<Vocaltrack, Integer> {

}
