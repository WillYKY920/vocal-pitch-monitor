"""
Fetches time-synced lyrics from lrclib.net via the lrclibapi library.

The resulting LRC file is enriched with three metadata header tags that are
absent from the bare API response:

    [ar:<artist>]            — performing artist
    [ti:<title>]             — track title
    [length:<mm:ss.xx>]      — total duration matching the source mp4

A fallback search by track name alone is attempted when the precise lookup
(title + artist + duration) returns no result.
"""

import os

from lrclib import LrcLibAPI

_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"



def _seconds_to_lrc_time(total_seconds: float) -> str:
    """
    Convert a duration expressed in seconds to the LRC timestamp format
    'mm:ss.xx', where 'xx' represents centiseconds (hundredths of a second).
    """
    minutes = int(total_seconds // 60)
    seconds = total_seconds % 60
    return f"{minutes:02d}:{seconds:05.2f}"


def _build_lrc_header(title: str, artist: str, duration: float) -> str:
    """
    Construct the three-line LRC metadata header block..
    """
    length_tag = _seconds_to_lrc_time(duration)
    return (
        f"[ar:{artist}]\n"
        f"[ti:{title}]\n"
        f"[length:{length_tag}]\n"
    )


def _fetch_synced_lyrics(title: str, artist: str, duration: float) -> str:
    """
    Query lrclib.net for synced (time-stamped) lyrics.
    """
    api = LrcLibAPI(user_agent=_USER_AGENT)

    try:
        result = api.get_lyrics(
            track_name=title,
            artist_name=artist,
            duration=int(duration),
        )
        synced = result.synced_lyrics or result.plain_lyrics
        if synced:
            return synced
    except Exception:
        pass

    results = api.search_lyrics(track_name=title)
    if not results:
        raise ValueError(
            f"No lyrics found on lrclib for '{title}' by '{artist}'."
        )

    best = results[0]
    synced = best.synced_lyrics or best.plain_lyrics
    if not synced:
        raise ValueError(
            f"Lyrics found but contain no timed lines for '{title}' by '{artist}'."
        )

    return synced


def fetch_and_save_lyrics(title: str, artist: str, duration: float, output_dir: str,) -> str:
    """
    Fetch synced lyrics, prepend the metadata header, and write an LRC file.
    """
    os.makedirs(output_dir, exist_ok=True)

    raw_lyrics = _fetch_synced_lyrics(title=title, artist=artist, duration=duration)
    header = _build_lrc_header(title=title, artist=artist, duration=duration)
    full_lrc = header + "\n" + raw_lyrics

    safe_name = "".join(c for c in title if c.isalnum() or c in " _-").strip()
    output_path = os.path.join(output_dir, f"{safe_name}.lrc")

    with open(output_path, "w", encoding="utf-8") as lrc_file:
        lrc_file.write(full_lrc)

    print(f"[Lyrics] LRC saved → {output_path}")
    return output_path
