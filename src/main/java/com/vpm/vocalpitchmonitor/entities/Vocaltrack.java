package com.vpm.vocalpitchmonitor.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "vocaltrack")
public class Vocaltrack {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "name", unique = true)
    private String fileName;

    @Column(name = "samples")
    private long samples;

    @Column(name = "pitch-data", nullable = false)
    private double[] vocalData;

    @OneToOne @JoinColumn(name = "song_id")
    private Song song;

    public Vocaltrack(){}

    public Vocaltrack(String fileName, long samples, double[] vocalData) {
        this.fileName = fileName;
        this.samples = samples;
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
