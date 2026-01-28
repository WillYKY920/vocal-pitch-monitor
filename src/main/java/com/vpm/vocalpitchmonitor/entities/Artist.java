package com.vpm.vocalpitchmonitor.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.util.List;

/**
* Represents an Artist entity in the database.
* This entity maintains a one-to-many relationship with the Song entity,
* i.e. one artist can be associated with multiple songs.

* Database Table Schema:
* |-------------------------------------------------------------|
* |                        Table: artist                        |
* |----------------|---------------|----------------------------|
* | Column Name    | Type          | Constraints                |
* |----------------|---------------|----------------------------|
* | id             | INT           | PK, Auto Increment         |
* | name           | VARCHAR       | Unique                     |
* |----------------|---------------|----------------------------|
*/

@Entity
@Table(name = "artist")
public class Artist {

    // Unique identifier for the artist.
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    // The name of the artist.
    @Column(name = "name", unique = true) @JsonProperty("name")
    private String artistName;

    /**
     * The list of songs associated with this artist.
     * Mapped by the "artist" field in the Song entity.
     * Operations on the artist (like removal) cascade to their songs.
     */
    @JsonProperty("songs")
    @OneToMany(mappedBy = "artist", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Song> songs;

    public Artist(){} // No argument constructor

    public Artist(String artistName) {
        this.artistName = artistName;
    }

    // Getters & Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getArtistName() {
        return artistName;
    }

    public void setArtistName(String artistName) {
        this.artistName = artistName;
    }

    public List<Song> getSongs() {
        return songs;
    }

    public void setSongs(List<Song> songs) {
        this.songs = songs;
    }
}
