package com.vpm.vocalpitchmonitor.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
/**
 * Represents the binary audio file data associated with a song.

 * Database Table Schema:
 * |-------------------------------------------------------------|
 * |                      Table: audiotrack                      |
 * |----------------|---------------|----------------------------|
 * | Column Name    | Type          | Constraints                |
 * |----------------|---------------|----------------------------|
 * | id             | INT           | PK, Auto Increment         |
 * | name           | VARCHAR       | Unique                     |
 * | size           | BIGINT        |                            |
 * | type           | VARCHAR       |                            |
 * | data           | BYTEA         | Not Null                   |
 * | song_id        | INT           | FK to song(id)             |
 * |----------------|---------------|----------------------------|
 */
@Entity
@Table(name = "audiotrack")
public class Audiotrack {

    // Unique identifier for the audiotrack.
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    // Filename of the uploaded audio.
    @Column(name = "name", unique = true) @JsonProperty("file-name")
    private String fileName;

    // The size of the audio file in bytes.
    @Column(name = "size") @JsonProperty("size")
    private Long byteSize;

    // The MIME type of the audio file (e.g., "audio/mpeg")
    @Column(name = "type") @JsonProperty("type")
    private String contentType;

    /**
     * The raw binary data of the audio file.
     * Stored as a byte array (BLOB/BYTEA).
     */
    @Column(name = "data", nullable = false, columnDefinition = "bytea") @JsonProperty("data")
    private byte[] audioData;

    /**
     * The song associated with this audio track.
     * Defines a one-to-one relationship.
     */
    @OneToOne @JoinColumn(name = "song_id")
    private Song song;

    public Audiotrack(){} // No argument constructor

    public Audiotrack(String fileName, Long byteSize, String contentType, byte[] audioData) {
        this.fileName = fileName;
        this.byteSize = byteSize;
        this.contentType = contentType;
        this.audioData = audioData;
    }

    // Getters & Setters
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
