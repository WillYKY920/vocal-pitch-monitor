package com.vpm.vocalpitchmonitor.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.vpm.vocalpitchmonitor.utils.LRCParser;
import jakarta.persistence.*;

import java.util.List;
/**
 * Represents the main metadata for a song entity.
 * This entity serves as the root for related tracks and lyrics.

 * Database Table Schema:
 * |-------------------------------------------------------------|
 * |                         Table: song                         |
 * |----------------|---------------|----------------------------|
 * | Column Name    | Type          | Constraints                |
 * |----------------|---------------|----------------------------|
 * | id             | INT           | PK, Auto Increment         |
 * | artist_id      | INT           | FK to artist(id)           |
 * | title          | VARCHAR       | Unique                     |
 * | duration       | INT           |                            |
 * |----------------|---------------|----------------------------|
 */
@Entity
@Table(name = "song")
@JsonPropertyOrder({"id", "artist", "title", "duration", "lyrics", "vocal-track", "audio-track"})
public class Song {

    // Unique identifier for the song.
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    // The artist who performed the song.
    @JsonProperty("artist_id")
    @ManyToOne @JoinColumn(name = "artist_id")
    private Artist artist;

    // The title of the song.
    @Column(name = "title", unique = true) @JsonProperty("title")
    private String title;

    // The duration of the song in milliseconds.
    @Column(name = "duration") @JsonProperty("duration")
    private int duration;

    /**
     * The synchronized lyrics associated with the song.
     * One-to-one relationship.
     */
    @JsonProperty("lyrics")
    @OneToOne(mappedBy = "song", cascade = CascadeType.ALL)
    private SyncedLyrics lyrics;

    /**
     * The processed vocal pitch data track for the song.
     * One-to-one relationship.
     */
    @JsonProperty("vocal-track")
    @OneToOne(mappedBy = "song", cascade = CascadeType.ALL)
    private Vocaltrack vocaltrack;

    /**
     * The raw audio file for the song.
     * One-to-one relationship.
     */
    @JsonProperty("audio-track")
    @OneToOne(mappedBy = "song", cascade = CascadeType.ALL)
    private Audiotrack audiotrack;


    public Song() {} // No argument constructor

    public Song(Artist artist, String title, int duration) {
        this.artist = artist;
        this.title = title;
        this.duration = duration;
    }

    // Getters & Setters
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
