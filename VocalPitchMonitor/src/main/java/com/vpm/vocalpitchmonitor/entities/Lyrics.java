package com.vpm.vocalpitchmonitor.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "lyrics")
public class Lyrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "lyrics") @JsonProperty("lyrics")
    @Lob
    private String lyrics;

    @OneToOne
    @JoinColumn(name = "song_id")
    private Song song;

    public Lyrics(){}

    public Lyrics(String lyrics, Song song) {
        this.lyrics = lyrics;
        song = song;

    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getLyrics() {
        return lyrics;
    }

    public void setLyrics(String lyrics) {
        this.lyrics = lyrics;
    }

    public Song getSong() {
        return this.song;
    }

    public void setSong(Song song) {
        this.song = song;
    }
}




