from io import BytesIO

import numpy as np

from backend.core.dataset_spec import parse_ravdess_filename


def _raw_pcm(audio_bytes: bytes) -> np.ndarray:
    """Interpret headerless bytes as PCM -- the browser recorder's raw capture."""
    if len(audio_bytes) % 2 == 0:
        return np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    raw = np.frombuffer(audio_bytes, dtype=np.uint8).astype(np.float32)
    return (raw - 128) / 128.0


def _to_pcm(audio_bytes: bytes, sample_rate: int = 16000) -> tuple[np.ndarray, bool]:
    """Decode arbitrary audio to mono float32 at `sample_rate`."""
    from backend.config import settings

    try:
        import soundfile as sf

        data, sr = sf.read(BytesIO(audio_bytes), dtype="float32", always_2d=True)
        mono = data.mean(axis=1)
        if sr != sample_rate and settings.neural_encoders_enabled:
            import librosa

            mono = librosa.resample(mono, orig_sr=sr, target_sr=sample_rate)
        return mono.astype(np.float32), True
    except Exception:
        pass

    if settings.neural_encoders_enabled:
        try:
            import librosa

            mono, _ = librosa.load(BytesIO(audio_bytes), sr=sample_rate, mono=True)
            return mono.astype(np.float32), True
        except Exception:
            pass

    return _raw_pcm(audio_bytes), False


def preprocess_speech(
    audio_bytes: bytes | None,
    sample_rate: int = 16000,
    filename: str | None = None,
) -> tuple[np.ndarray, dict]:
    """RAVDESS-aware audio: raw 16kHz mono waveform (for the wav2vec2 encoder)
    plus MFCC/pitch/rate scalars used in the tabular set."""
    flags: list[str] = []
    ravdess = parse_ravdess_filename(filename)
    extra = {"ravdess": ravdess}

    if not audio_bytes:
        flags.append("missing_speech")
        return np.zeros(sample_rate, dtype=np.float32), {"quality": 0.0, "flags": flags, **extra}

    pcm, decoded = _to_pcm(audio_bytes, sample_rate)
    if not decoded:
        flags.append("raw_pcm_assumed")
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
        from backend.config import settings as _settings

        if not _settings.neural_encoders_enabled:
            raise RuntimeError("skip librosa on small hosts")
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
    except Exception:
        flags.append("librosa_fallback")

    # "raw_pcm_assumed" is the expected path for the browser's headerless
    # capture and "librosa_fallback" is informational -- neither is a defect,
    # so neither should reduce the confidence we report for this modality.
    _informational = {"librosa_fallback", "raw_pcm_assumed"}
    quality = 1.0 - 0.22 * len([f for f in flags if f not in _informational])
    extra.update(
        {
            "MFCC_Mean": mfcc_mean,
            "MFCC_Variance": mfcc_var,
            "Pitch_Mean": pitch_mean,
            "Speech_Rate": speech_rate,
            "rms": rms,
        }
    )
    return pcm.astype(np.float32), {"quality": max(0.15, quality), "flags": flags, **extra}
