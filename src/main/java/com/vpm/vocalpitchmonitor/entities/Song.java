package com.vpm.vocalpitchmonitor.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import jakarta.persistence.*;

@Entity
@Table(name = "song")
@JsonPropertyOrder({"id", "artist", "title", "duration", "lyrics", "vocal-track", "audio-track"})
public class Song { // metadata

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @JsonProperty("artist_id")
    @ManyToOne @JoinColumn(name = "artist_id")
    private Artist artist;

    @Column(name = "title", unique = true) @JsonProperty("title")
    private String title;

    @Column(name = "duration") @JsonProperty("duration")
    private int duration;

    @JsonProperty("lyrics")
    @OneToOne(mappedBy = "song", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Lyrics lyrics;

    @JsonProperty("vocal-track")
    @OneToOne(mappedBy = "song", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Vocaltrack vocaltrack;

    @JsonProperty("audio-track")
    @OneToOne(mappedBy = "song", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Audiotrack audiotrack;


    public Song(){} // No argument constructor

    public Song(Artist artist, String title, int duration) {
        this.artist = artist;
        this.title = title;
        this.duration = duration;
    }

    public Artist getArtist() {
        return artist;
    }

    public void setArtist(Artist artist) {
        this.artist = artist;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public Lyrics getLyrics() {
        return lyrics;
    }

    public void setLyrics(Lyrics lyrics) {
        this.lyrics = lyrics;
    }

    public Vocaltrack getVocaltrack() {
        return vocaltrack;
    }

    public void setVocaltrack(Vocaltrack vocaltrack) {
        this.vocaltrack = vocaltrack;
    }

    public Audiotrack getAudiotrack() {
        return audiotrack;
    }

    public void setAudiotrack(Audiotrack audiotrack) {
        this.audiotrack = audiotrack;
    }

    public int getDuration(){return this.duration;}

    public void setDuration(String duration) {

        String[] parts = duration.split(":"); // min:sec
        this.duration =  Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }
}
