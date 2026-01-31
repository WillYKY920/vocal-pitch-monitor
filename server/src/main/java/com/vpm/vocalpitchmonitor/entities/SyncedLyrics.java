package com.vpm.vocalpitchmonitor.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
/**
 * Represents synchronized lyrics for a song, stored as JSON.

 * Database Table Schema:
 * |-------------------------------------------------------------|
 * |                    Table: synced_lyrics                     |
 * |----------------|---------------|----------------------------|
 * | Column Name    | Type          | Constraints                |
 * |----------------|---------------|----------------------------|
 * | id             | INT           | PK, Auto Increment         |
 * | song_id        | INT           | FK to song(id)             |
 * | lyrics_json    | JSON          |                            |
 * |----------------|---------------|----------------------------|
 */
@Entity
@Table(name = "synced_lyrics")
public class SyncedLyrics {

    // Unique identifier for the lyrics entry.
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    // The song these lyrics belong to.
    @OneToOne @JoinColumn(name = "song_id")
    private Song song;

    // The list of lyric lines with timestamps, stored as a JSON column.
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "lyrics_json", columnDefinition = "json")  // Add name here
    private List<LyricLine> lyricsJson = new ArrayList<>();

    /**
     * Immutable record representing a single line of lyrics with a timestamp.
     *
     * @param timestamp the time in milliseconds when the line starts
     * @param text the text content of the lyric line
     */
    public record LyricLine(Integer timestamp, String text) {}

    public SyncedLyrics() {} // No argument constructor

    public SyncedLyrics(Song song, List<LyricLine> lyricsJson) {
        this.song = song;
        this.lyricsJson = lyricsJson;
    }

    // Getters & Setters
    public int getId() {return id;}
    public void setId(int id) {this.id = id;}

    public Song getSong() {return song;}
    public void setSong(Song song) {this.song = song;}

    public List<LyricLine> getLyricsJson() {return lyricsJson;}
    public void setLyricsJson(List<LyricLine> lyricsJson) {this.lyricsJson = lyricsJson;}
}