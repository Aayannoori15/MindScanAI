import numpy as np

from backend.core.dataset_spec import parse_ravdess_filename


def _mfcc_fallback(audio: np.ndarray, n_mfcc: int = 128) -> np.ndarray:
    if audio.size < 16:
        audio = np.pad(audio, (0, 16))
    win = 512
    hop = 256
    frames = []
    for i in range(0, max(1, audio.size - win), hop):
        frame = audio[i : i + win]
        spec = np.abs(np.fft.rfft(frame * np.hanning(len(frame))))
        frames.append(np.log1p(spec[:n_mfcc]))
    if not frames:
        return np.zeros((8, n_mfcc), dtype=np.float32)
    return np.stack(frames).astype(np.float32)


def _to_pcm(audio_bytes: bytes) -> np.ndarray:
    if len(audio_bytes) % 2 == 0:
        return np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    raw = np.frombuffer(audio_bytes, dtype=np.uint8).astype(np.float32)
    return (raw - 128) / 128.0


def preprocess_speech(
    audio_bytes: bytes | None,
    sample_rate: int = 16000,
    filename: str | None = None,
) -> tuple[np.ndarray, dict]:
    """RAVDESS-aware audio: log-mel (T×128) plus MFCC/pitch/rate scalars used in the tabular set."""
    flags: list[str] = []
    ravdess = parse_ravdess_filename(filename)
    extra = {"ravdess": ravdess}

    if not audio_bytes:
        flags.append("missing_speech")
        return np.zeros((16, 128), dtype=np.float32), {"quality": 0.0, "flags": flags, **extra}

    pcm = _to_pcm(audio_bytes)
    rms = float(np.sqrt(np.mean(pcm**2) + 1e-12))
    if rms < 0.01:
        flags.append("quiet_audio")
    if rms > 0.45:
        flags.append("clipping_or_noise")

    mfcc_mean = float(np.mean(pcm) * 20)
    mfcc_var = float(np.var(pcm) * 400)
    # Zero-crossing as a cheap pitch / rate proxy when librosa is absent
    zc = np.mean(np.abs(np.diff(np.sign(pcm)))) if pcm.size > 2 else 0.0
    pitch_mean = float(80 + zc * 400)
    speech_rate = float(np.clip(rms * 6, 0.4, 6.0))

    try:
        import librosa

        y = pcm.astype(np.float32)
        if y.size < sample_rate // 4:
            flags.append("short_utterance")
        mfcc = librosa.feature.mfcc(y=y, sr=sample_rate, n_mfcc=40)
        mfcc_mean = float(np.mean(mfcc))
        mfcc_var = float(np.var(mfcc))
        f0 = librosa.yin(y, fmin=50, fmax=400, sr=sample_rate)
        pitch_mean = float(np.nanmean(f0))
        onset = librosa.onset.onset_detect(y=y, sr=sample_rate, units="time")
        dur = max(len(y) / sample_rate, 1e-3)
        speech_rate = float(len(onset) / dur)
        mel = librosa.feature.melspectrogram(y=y, sr=sample_rate, n_mels=128)
        feats = np.log1p(mel).T.astype(np.float32)
    except Exception:
        feats = _mfcc_fallback(pcm)
        flags.append("librosa_fallback")

    quality = 1.0 - 0.22 * len([f for f in flags if f != "librosa_fallback"])
    extra.update(
        {
            "MFCC_Mean": mfcc_mean,
            "MFCC_Variance": mfcc_var,
            "Pitch_Mean": pitch_mean,
            "Speech_Rate": speech_rate,
            "rms": rms,
        }
    )
    return feats, {"quality": max(0.15, quality), "flags": flags, **extra}
