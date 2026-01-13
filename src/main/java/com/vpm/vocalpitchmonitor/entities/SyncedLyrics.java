package com.vpm.vocalpitchmonitor.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "synced_lyrics")
public class SyncedLyrics {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @OneToOne
    @JoinColumn(name = "song_id")
    private Song song;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "lyrics_json", columnDefinition = "json")  // Add name here
    private List<LyricLine> lyricsJson = new ArrayList<>();

    public record LyricLine(Integer timestamp, String text) {}

    public SyncedLyrics() {}

    public SyncedLyrics(Song song, List<LyricLine> lyricsJson) {
        this.song = song;
        this.lyricsJson = lyricsJson;
    }

    public int getId() {return id;}
    public void setId(int id) {this.id = id;}

    public Song getSong() {return song;}
    public void setSong(Song song) {this.song = song;}

    public List<LyricLine> getLyricsJson() {return lyricsJson;}
    public void setLyricsJson(List<LyricLine> lyricsJson) {this.lyricsJson = lyricsJson;}
}