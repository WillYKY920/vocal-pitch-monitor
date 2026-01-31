package com.vpm.vocalpitchmonitor.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

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
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    // Filename of the vocal track source.
    @Column(name = "name", unique = true)
    private String fileName;

    // The total number of extracted samples in the pitch data.
    @Column(name = "samples")
    private long samples;

    @Column(name = "sample-rate")
    private long sampleRate;

    @Column(name = "hop-size")
    private int hopSize;

    // Array of pitch values (frequencies) extracted from the vocals.
    @Column(name = "pitch-data", nullable = false)
    private double[] vocalData;

    // The song associated with this vocal track.
    @OneToOne
    @JoinColumn(name = "song_id")
    private Song song;

    public Vocaltrack() {
    } // No argument constructor

    public Vocaltrack(String fileName, long samples, long sampleRate, int hopSize, double[] vocalData) {
        this.fileName = fileName;
        this.samples = samples;
        this.sampleRate = sampleRate;
        this.hopSize = hopSize;
        this.vocalData = vocalData;
    }

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

    public long getSamples() {
        return samples;
    }

    public void setSamples(long samples) {
        this.samples = samples;
    }

    public long getSampleRate() {
        return sampleRate;
    }

    public void setSampleRate(long sampleRate) {
        this.sampleRate = sampleRate;
    }

    public int getHopSize() {
        return hopSize;
    }

    public void setHopSize(int hopSize) {
        this.hopSize = hopSize;
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

    // Getters & Setters

