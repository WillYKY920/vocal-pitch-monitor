package com.vpm.vocalpitchmonitor.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.vpm.vocalpitchmonitor.utils.LRCParser;
import jakarta.persistence.*;

import java.util.List;

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
    @OneToOne(mappedBy = "song", cascade = CascadeType.ALL)
    private SyncedLyrics lyrics;

    @JsonProperty("vocal-track")
    @OneToOne(mappedBy = "song", cascade = CascadeType.ALL)
    private Vocaltrack vocaltrack;

    @JsonProperty("audio-track")
    @OneToOne(mappedBy = "song", cascade = CascadeType.ALL)
    private Audiotrack audiotrack;


    public Song() {} // No argument constructor

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

    public SyncedLyrics getLyrics() {return lyrics;}
    public void setLyrics(SyncedLyrics lyrics) {this.lyrics = lyrics;}

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
        System.out.println(duration);
        this.duration = LRCParser.toMilliseconds(duration);
    }
}
