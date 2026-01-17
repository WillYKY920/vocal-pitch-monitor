package com.vpm.vocalpitchmonitor.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "audiotrack")
public class Audiotrack {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "name", unique = true) @JsonProperty("file-name")
    private String fileName;

    @Column(name = "size") @JsonProperty("size")
    private Long byteSize;

    @Column(name = "type") @JsonProperty("type")
    private String contentType;

    @Column(name = "data", nullable = false, columnDefinition = "bytea") @JsonProperty("data")
    private byte[] audioData;

    @OneToOne @JoinColumn(name = "song_id")
    private Song song;

    public Audiotrack(){}

    public Audiotrack(String fileName, Long byteSize, String contentType, byte[] audioData) {
        this.fileName = fileName;
        this.byteSize = byteSize;
        this.contentType = contentType;
        this.audioData = audioData;
    }

    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }

    public String getContentType() {return contentType;}
    public void setContentType(String contentType) {this.contentType = contentType;}

    public String getFileName() {
        return fileName;
    }
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public Long getByteSize() {
        return byteSize;
    }
    public void setByteSize(Long byteSize) {
        this.byteSize = byteSize;
    }

    public byte[] getAudioData() {
        return audioData;
    }
    public void setAudioData(byte[] audioData) {
        this.audioData = audioData;
    }

    public Song getSong() {
        return song;
    }
    public void setSong(Song song) {
        this.song = song;
    }
}
