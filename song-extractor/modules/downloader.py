"""
Handles downloading a song from a user-supplied URL (e.g. YouTube) using yt-dlp.

Extracts structured metadata — title, artist, and duration — from the
downloaded video info dictionary.  When YouTube does not expose a dedicated
'artist' field (i.e. a regular upload rather than a YouTube Music link), the
module falls back to parsing the common 'Artist - Title' title convention.
"""

import os
import re
from dataclasses import dataclass
from pathlib import Path
import yt_dlp


@dataclass
class SongInfo:
    """
    Immutable container that carries song metadata alongside the
    path to the downloaded mp3 file.

    Attributes:
        title    : The track title, stripped of artist prefix when possible.
        artist   : The performing artist or channel name.
        duration : Total duration of the track in seconds.
        mp3_path : Absolute path to the downloaded mp3 on disk.
    """

    title: str
    artist: str
    duration: float
    mp3_path: str


def _parse_title_artist(raw_title: str) -> tuple[str, str]:
    """
    Attempt to split a raw YouTube title into (artist, track) components.

    Handles the 'Artist - Title'
    dash conventions that are common on YouTube.  Returns ('Unknown Artist',
    raw_title) unchanged when no separator can be found.

    Args:
        raw_title: The unmodified video title string from yt-dlp.

    Returns:
        A (artist, track_title) tuple of stripped strings.
    """
    pattern = re.compile(r"^(?P<artist>.+?)\s*[-–—]\s*(?P<track>.+)$")
    match = pattern.match(raw_title)
    if match:
        return match.group("artist").strip(), match.group("track").strip()
    return "Unknown Artist", raw_title.strip()


def download_song(url: str, output_dir: str) -> SongInfo:
    """
    Download audio from *url* into *output_dir* as an mp3 file.

    The function prefers the 'track' and 'artist' metadata fields exposed by
    YouTube Music.  For standard YouTube URLs it falls back to parsing the
    video title, then to the channel name as the artist.

    Args:
        url        : A fully-qualified video URL (YouTube, etc.).
        output_dir : Directory that will receive the downloaded mp3.

    Returns:
        A populated SongInfo dataclass.

    Raises:
        yt_dlp.utils.DownloadError: Propagated when the download itself fails.
    """
    os.makedirs(output_dir, exist_ok=True)

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": os.path.join(output_dir, "%(title)s.%(ext)s"),
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ],
        "noplaylist": True,
        "quiet": False,
        "no_warnings": True,     
        "ignoreerrors": False,
        "abort_on_unavailable_fragment": False,
    }



    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)

        raw_title = info.get("title", "Unknown Title")
        duration = float(info.get("duration") or 0)

        artist = info.get("artist") or ""
        track_title = info.get("track") or ""

        if not artist or not track_title:
            parsed_artist, parsed_track = _parse_title_artist(raw_title)
            artist = artist or parsed_artist or info.get("uploader", "Unknown Artist")
            track_title = track_title or parsed_track

        filename = ydl.prepare_filename(info)
        mp3_path = str(Path(filename).with_suffix(".mp3"))

    return SongInfo(
        title=track_title,
        artist=artist,
        duration=duration,
        mp3_path=mp3_path,
    )
