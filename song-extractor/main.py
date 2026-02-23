"""
#Entry point for the Song Extractor pipeline.

Execution order
---------------
1. Prompt the user for a URL, Artist, and Title in the terminal.
2. Download the audio as an mp3 and extract song metadata via yt-dlp.
3. Separate the vocal stem from the audio using the Demucs htdemucs_ft model.
4. Fetch time-synced lyrics from lrclib.net and generate an enriched LRC file.
5. Copy the mp3, vocals.wav, and .lrc into a neatly named output folder,
   then remove the temporary working directory.

Output folder naming convention: 'extracted/<Artist> - <Title>'
"""

import os
import shutil
from pathlib import Path

from modules.downloader import download_song
from modules.separator import separate_vocals
from modules.lyrics import fetch_and_save_lyrics

TEMP_DIR = "temp"
OUTPUT_DIR = "extracted"

def _safe_folder_name(raw: str) -> str:
    """
    Strip characters that are invalid in directory names across major OSes.

    Args:
        raw: The unsanitized candidate folder name.

    Returns:
        A cleaned string retaining only alphanumerics, spaces, dashes,
        underscores, and dots.
    """
    illegal_chars = '<>:"/\\|?*'
    return "".join(c for c in raw if c not in illegal_chars).strip()


def _unique_folder(base_path: str) -> str:
    """
    Return a folder path that does not yet exist on disk.

    Appends an incrementing suffix '(n)' when *base_path* is already taken,
    preventing accidental overwrites of previous extractions.
    """
    candidate = base_path
    counter = 1
    while Path(candidate).exists():
        candidate = f"{base_path} ({counter})"
        counter += 1
    return candidate

def main():
    """
    Run the full song extraction pipeline interactively.

    Prompts for a URL, then proceeds through download → separation → lyrics
    → file organisation. A warning is printed (and the pipeline continues)
    if lyrics cannot be located; all other errors are allowed to propagate.
    """
    print("──< Song Extraction Script v1.0.0 >───────────────────────────")
    url = input("Enter song URL    : ").strip()
    if not url:
        print("No URL entered. Exiting.")
        return
    
    user_title = input("Enter Song Title  : ").strip()
    user_artist = input("Enter Artist Name : ").strip()

    print("\n──< Step 1 · Downloading mp3 >────────────────────────────────")
    song = download_song(url=url, output_dir=TEMP_DIR)
    
    print(f"""        
    Title    : {song.title}
    Artist   : {song.artist}
    Duration : {song.duration:.2f} s""")
    
    title = user_title if user_title else song.title
    artist = user_artist if user_artist else song.artist

    safe_name = _safe_folder_name(f"{artist} - {title}")
    target_folder_path = _unique_folder(os.path.join(OUTPUT_DIR, safe_name))
    
    os.makedirs(target_folder_path, exist_ok=True)

    print("\n──< Step 2 · Separating vocals >──────────────────────────────")
    vocals_path = separate_vocals(mp3_path=song.mp3_path, output_dir=TEMP_DIR)

    print("\n──< Step 3 · Fetching lyrics >────────────────────────────────")
    print("[Lyrics] Fetching...")
    lrc_path = None
    try:
        lrc_path = fetch_and_save_lyrics(
            title=title,
            artist=artist,
            duration=song.duration,
            output_dir=TEMP_DIR,
        )
    except ValueError as exc:
        print(f"Lyrics not found: {exc}")

    print(f"\n─────────────────────────────────────────────────────────────")
    
    final_mp3 = os.path.join(target_folder_path, f"{safe_name}.mp3")
    final_wav = os.path.join(target_folder_path, f"{safe_name} (Vocals).wav")
    
    shutil.copy2(song.mp3_path, final_mp3)
    shutil.copy2(vocals_path, final_wav)
    
    if lrc_path:
        final_lrc = os.path.join(target_folder_path, f"{safe_name}.lrc")
        shutil.copy2(lrc_path, final_lrc)

    shutil.rmtree(TEMP_DIR, ignore_errors=True)

    print(f"✓ Done!  Output folder: ./{target_folder_path}/")
    for entry in sorted(os.listdir(target_folder_path)):
        print(f"    {entry}")


if __name__ == "__main__":
    main()
