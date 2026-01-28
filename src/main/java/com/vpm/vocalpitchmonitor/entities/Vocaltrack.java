package com.vpm.vocalpitchmonitor.entities;

import jakarta.persistence.*;

/**
 * Represents processed vocal pitch data extracted from a song.

 * Database Table Schema:
 * |-------------------------------------------------------------|
 * |                      Table: vocaltrack                      |
 * |----------------|---------------|----------------------------|
 * | Column Name    | Type          | Constraints                |
 * |----------------|---------------|----------------------------|
 * | id             | INT           | PK, Auto Increment         |
 * | name           | VARCHAR       | Unique                     |
 * | samples        | BIGINT        |                            |
 * | pitch-data     | DOUBLE[]      | Not Null                   |
 * | song_id        | INT           | FK to song(id)             |
 * |----------------|---------------|----------------------------|
 */
@Entity
@Table(name = "vocaltrack")
public class Vocaltrack {

    // Unique identifier for the vocal track.
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    // Filename of the vocal track source.
    @Column(name = "name", unique = true)
    private String fileName;

    // The total number of extracted samples in the pitch data.
    @Column(name = "samples")
    private long samples;

    // Array of pitch values (frequencies) extracted from the vocals.
    @Column(name = "pitch-data", nullable = false)
    private double[] vocalData;

    // The song associated with this vocal track.
    @OneToOne @JoinColumn(name = "song_id")
    private Song song;

    public Vocaltrack(){} // No argument constructor

    public Vocaltrack(String fileName, long samples, double[] vocalData) {
        this.fileName = fileName;
        this.samples = samples;
        this.vocalData = vocalData;
    }

    // Getters & Setters
    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public Long getSamples() {
        return samples;
    }

    public void setSamples(Long samples) {
        this.samples = samples;
    }

    public double[] getVocalData() {
        return vocalData;
    }

    public void setVocalData(double[] vocalData) {
        this.vocalData = vocalData;
    }

    public Song getSong() {
        return song;
    }

    public void setSong(Song song) {
        this.song = song;
    }
}
