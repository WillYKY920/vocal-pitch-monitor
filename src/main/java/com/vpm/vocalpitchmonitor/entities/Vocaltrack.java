package com.vpm.vocalpitchmonitor.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "vocaltrack")
public class Vocaltrack {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "name", unique = true) @JsonProperty("file-name")
    private String fileName;

    @Column(name = "size")
    private Long byteSize;

    @Column(name = "type") @JsonProperty("type")
    private String contentType;

    @Column(name = "data", nullable = false, columnDefinition = "MEDIUMBLOB") //16MB
    @Lob
    private byte[] vocalData;

    @OneToOne @JoinColumn(name = "song_id")
    private Song song;

    public Vocaltrack(){}

    public Vocaltrack(String fileName, Long byteSize, String contentType, byte[] vocalData) {
        this.fileName = fileName;
        this.byteSize = byteSize;
        this.contentType = contentType;
        this.vocalData = vocalData;
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

    public byte[] getVocalData() {
        return vocalData;
    }

    public void setVocalData(byte[] vocalData) {
        this.vocalData = vocalData;
    }

    public Song getSong() {
        return song;
    }

    public void setSong(Song song) {
        this.song = song;
    }
}
