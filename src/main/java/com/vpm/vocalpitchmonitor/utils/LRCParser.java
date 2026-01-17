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

public class LRCParser {

    private static final Pattern TIME_PATTERN = Pattern.compile("\\[(\\d{2}):(\\d{2})\\.(\\d{2})\\]");

    private static final Pattern METADATA_PATTERN = Pattern.compile("\\[([a-zA-Z]+):(.+?)\\]");

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

    // [**:**.**]
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

    // [<key>:<value>]
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

    private static String getLyricText(String line) {

        int lastBracket = line.lastIndexOf(']');
        if (lastBracket != -1 && lastBracket + 1 < line.length()) {
            return line.substring(lastBracket + 1).trim();
        }
        return null;
    }

    public static int toMilliseconds(String timeString) {

        String[] parts = timeString.split(":");
        int minutes = Integer.parseInt(parts[0]);

        double seconds = Double.parseDouble(parts[1]);
        return (int)((minutes * 60 + seconds) * 1000);
    }

    @Data
    private static class Container {
        private String title;
        private String artist;
        private String duration;
    }
}
