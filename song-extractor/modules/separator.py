"""
Configuration:
Model     : htdemucs_ft (hybrid-transformer, fine-tuned)
Shifts    : 1 (random time-shift augmentation passes, >= 2)
Overlap   : 0.5 (50 % overlap between segments)
Segment   : 7.8 s (audio chunk size fed to the model)
Clip mode : rescale (scales output to [-1, 1] instead of hard-clipping)
Format    : wav + float32 PCM (as_float=True sets bits_per_sample to 32)
"""

import os
import torch
import demucs.api
import soundfile as sf

_MODEL = "htdemucs_ft"
_SHIFTS = 1
_OVERLAP = 0.5
_SEGMENT = 7.8
_CLIP = "rescale"

def separate_vocals(mp3_path: str, output_dir: str) -> str:
    """
    Isolate the vocal stem from *mp3_path* and write it as a float32 WAV.
    Uses the official Demucs Python API. The Separator is initialised with
    htdemucs_ft and the project-specified inference parameters. Only the
    'vocals' stem is retained; all other stems are discarded.
    
    The saved file is named '<track_name> (Vocals).wav'.
    
    Args:
        mp3_path   : Path to the source video/audio file (any ffmpeg-readable 
                     format including mp4, webm, mp3, flac, etc.).
        output_dir : Directory that will receive the output WAV.
        
    Returns:
        Absolute path to the saved vocals WAV file.
        
    Raises:
        KeyError     : If the loaded model does not produce a 'vocals' stem.
        RuntimeError : Propagated from Demucs on any separation failure.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Check if NVIDIA GPU is available, otherwise fallback to CPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[Separator] Hardware Acceleration: Using {device.upper()}")
    
    separator = demucs.api.Separator(
        model=_MODEL,
        shifts=_SHIFTS,
        overlap=_OVERLAP,
        segment=_SEGMENT,
        device=device,       # <--- Added device parameter here
        progress=True,
    )
    
    print(f"[Separator] Separating: {mp3_path}")
    origin, stems = separator.separate_audio_file(mp3_path)
    
    if "vocals" not in stems:
        raise KeyError(
            f"Model '{_MODEL}' did not produce a 'vocals' stem. "
            f"Available: {list(stems.keys())}"
        )
        
    # Extract the base track name from the mp3 (e.g., 'Artist - Title')
    track_name = os.path.splitext(os.path.basename(mp3_path))[0]
    output_path = os.path.join(output_dir, f"{track_name} (Vocals).wav")
    
    vocals_tensor = stems["vocals"]
    
    # Apply the clipping/rescaling strategy previously handled by demucs.api.save_audio
    if _CLIP == "rescale":
        vocals_tensor = vocals_tensor / max(1.01, vocals_tensor.abs().max().item())
    elif _CLIP == "clamp":
        vocals_tensor = vocals_tensor.clamp(-1.0, 1.0)
        
    print(f"[Separator] Saving to: {output_path}")
    
    # Convert tensor to numpy and transpose from [Channels, Time] to [Time, Channels]
    # .cpu() ensures the tensor is safely moved back to RAM before converting to numpy
    audio_data = vocals_tensor.cpu().numpy().T
    
    # Save using soundfile to correctly handle Unicode/Chinese paths on Windows
    # subtype='FLOAT' saves it as 32-bit float PCM (equivalent to as_float=True)
    sf.write(output_path, audio_data, separator.samplerate, subtype='FLOAT')
    
    print(f"[Separator] Vocals saved → {output_path}")
    return output_path
