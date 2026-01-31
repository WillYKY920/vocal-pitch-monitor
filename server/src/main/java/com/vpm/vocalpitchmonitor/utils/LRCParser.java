package com.vpm.vocalpitchmonitor.utils;

import com.vpm.vocalpitchmonitor.DTOs.SongDto;
import com.vpm.vocalpitchmonitor.entities.SyncedLyrics;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility class for parsing LRC (LyRiCs) files.
 * This class provides functionality to extract synchronized lyrics and metadata
 * from standard LRC file formats. It supports parsing time tags and metadata tags
 * including title, artist, and duration.
 */
public class LRCParser {

    private static final Pattern TIME_PATTERN = Pattern.compile("\\[(\\d{2}):(\\d{2})\\.(\\d{2})\\]");
    private static final Pattern METADATA_PATTERN = Pattern.compile("\\[([a-zA-Z]+):(.+?)\\]");

    /**
     * Parses the lyrics content from an LRC file into a structured format.
     * Reads the file line by line, extracting timestamps and associated lyric text.
     * Multiple timestamps for the same line are supported.
     *
     * @param lrcFile the multipart file containing the LRC data
     * @return a {@link SyncedLyrics} object containing a list of lyric lines with their corresponding start times in milliseconds
     * @throws IOException if an error occurs while reading the file stream
     */
    public static SyncedLyrics parseLyrics(MultipartFile lrcFile) throws IOException {

        SyncedLyrics parsedLyrics = new SyncedLyrics();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(lrcFile.getInputStream()))) {

            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) break;

                List<Integer> timestamps = getTimestamps(line);
                String text = getLyricText(line);

                if (!timestamps.isEmpty() && text != null) {
                    for (Integer timestamp : timestamps) {
                        parsedLyrics.getLyricsJson().add(new SyncedLyrics.LyricLine(timestamp, text));
                    }
                }
            }
        return parsedLyrics;
        }
    }
    /**
     * Parses metadata (Title, Artist, Duration) from an LRC file.
     * Scans the file for standard LRC metadata tags:
     * [ti:Title]
     * [ar:Artist]
     * [length:Duration]
     *
     * @param lrcFile the multipart file containing the LRC data
     * @return a {@link SongDto} object populated with the extracted metadata
     * @throws IOException if an error occurs while reading the file stream
     */
    public static SongDto parseMetadata(MultipartFile lrcFile) throws IOException {

        Container container = new Container();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(lrcFile.getInputStream()))) {

            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) break;

                setMetadata(container, line);
            }
            return new SongDto(
                    container.getTitle(),
                    container.getArtist(),
                    container.getDuration()
            );
        }
    }

    /**
     * Extracts all timestamps found in a single line of an LRC file.
     * Matches standard LRC time tags in the format [mm:ss.xx] and converts them to total milliseconds.
     *
     * @param line the line of text to parse for timestamps
     * @return a list of integers representing the timestamps in milliseconds
     */
    public static List<Integer> getTimestamps(String line) {

        List<Integer> timestamps = new ArrayList<>();
        Matcher matcher = TIME_PATTERN.matcher(line);

        while (matcher.find()) {
            int minutes = Integer.parseInt(matcher.group(1));
            int seconds = Integer.parseInt(matcher.group(2));
            int milliseconds = Integer.parseInt(matcher.group(3).length() == 2 ?
                    matcher.group(3) + "0" : matcher.group(3));

            int totalMs = (minutes * 60 + seconds) * 1000 + milliseconds;
            timestamps.add(totalMs);
        }

        return timestamps;
    }

    /**
     * Parses a line for metadata tags and updates the container object if a match is found.
     * Supports tags: 'ti' (title), 'ar' (artist), and 'length' (duration).
     *
     * @param container the internal container used to accumulate metadata during parsing
     * @param line the line of text to check for metadata tags
     */
    public static void setMetadata(Container container, String line) {

        Matcher matcher = METADATA_PATTERN.matcher(line);
        if (matcher.matches()) {
            String value = matcher.group(2);

            switch (matcher.group(1)) {
                case "ti": container.setTitle(value); break;
                case "ar": container.setArtist(value); break;
                case "length": container.setDuration(value); break;
            }
        }
    }

    /**
     * Extracts the lyric text from a line.
     *
     * @param line the line of text containing timestamps and lyrics
     * @return the lyric text content, or {@code null} if no text exists after the last tag
     */
    private static String getLyricText(String line) {

        int lastBracket = line.lastIndexOf(']');
        if (lastBracket != -1 && lastBracket + 1 < line.length()) {
            return line.substring(lastBracket + 1).trim();
        }
        return null;
    }

    /**
     * Converts a time string in "mm:ss.xx" format to total milliseconds.
     *
     * @param timeString the string representation of time (e.g., "03:45.50")
     * @return the total time in milliseconds
     */
    public static int toMilliseconds(String timeString) {

        String[] parts = timeString.split(":");
        int minutes = Integer.parseInt(parts[0]);

        double seconds = Double.parseDouble(parts[1]);
        return (int)((minutes * 60 + seconds) * 1000);
    }

    //  Internal helper class to hold metadata temporarily during parsing.
    @Data
    private static class Container {
        private String title;
        private String artist;
        private String duration;
    }
}
