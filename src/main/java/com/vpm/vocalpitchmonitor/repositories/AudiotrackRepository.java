package com.vpm.vocalpitchmonitor.repositories;

import com.vpm.vocalpitchmonitor.entities.Audiotrack;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AudiotrackRepository extends JpaRepository<Audiotrack, Integer> {
}
