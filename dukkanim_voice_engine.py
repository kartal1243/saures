import asyncio
import json
import math
import os
import subprocess
import numpy as np
import edge_tts
import wave

REF_VIDEO_PATH = r"C:/Users/Ömer Yaman/.gemini/antigravity/brain/a3092990-5f6b-45d8-ac13-416c5ed7bbeb/.user_uploaded/media_1793644150855_4aab7dc9.mp4"
PROFILE_DIR = r"C:\Users\Ömer Yaman\.gemini\antigravity\brain\a3092990-5f6b-45d8-ac13-416c5ed7bbeb\scratch\voice_clone_profile"
os.makedirs(PROFILE_DIR, exist_ok=True)
PROFILE_JSON = os.path.join(PROFILE_DIR, "cloned_voice_profile.json")
REF_WAV = os.path.join(PROFILE_DIR, "ref_speaker_24k.wav")

BASE_VOICE = "tr-TR-AhmetNeural"
SR = 24000

def read_wav_mono(path):
    with wave.open(path, "rb") as wf:
        n_ch = wf.getnchannels()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)
        arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        if n_ch > 1:
            arr = arr.reshape(-1, n_ch).mean(axis=1)
        return arr

def write_wav_mono(path, arr, sr=SR):
    arr_clamped = np.clip(arr, -0.97, 0.97)
    pcm = (arr_clamped * 32767.0).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())

def compute_voiced_ltas(samples, sr=SR, n_fft=1024):
    """Computes Long-Term Average Spectrum (LTAS) over active voiced speech frames."""
    hop = n_fft // 2
    window = np.hanning(n_fft)
    mags = []
    for i in range(0, len(samples) - n_fft, hop):
        frame = samples[i:i + n_fft]
        rms = np.sqrt(np.mean(frame ** 2))
        if rms > 0.025:  # Voiced active frame
            spec = np.abs(np.fft.rfft(frame * window))
            mags.append(spec)
    if not mags:
        return np.ones(n_fft // 2 + 1)
    ltas = np.mean(mags, axis=0) + 1e-6
    # Smooth spectral envelope across frequency bins
    kernel = np.hanning(15)
    kernel /= kernel.sum()
    ltas_smooth = np.convolve(ltas, kernel, mode="same")
    # Normalize energy
    ltas_smooth /= np.sqrt(np.mean(ltas_smooth ** 2))
    return ltas_smooth

def estimate_f0(samples, sr=SR):
    """Autocorrelation pitch estimator over voiced frames (75Hz - 220Hz male range)."""
    frame_len = int(0.04 * sr)
    hop = int(0.02 * sr)
    min_lag = int(sr / 220.0)
    max_lag = int(sr / 75.0)
    f0s = []
    for i in range(0, len(samples) - frame_len, hop):
        frame = samples[i:i + frame_len]
        if np.sqrt(np.mean(frame ** 2)) < 0.03:
            continue
        frame = frame - np.mean(frame)
        corr = np.correlate(frame, frame, mode="full")[frame_len - 1:]
        if corr[0] <= 0:
            continue
        corr = corr / corr[0]
        sub = corr[min_lag:max_lag]
        best_idx = np.argmax(sub)
        if sub[best_idx] > 0.35:
            lag = min_lag + best_idx
            f0s.append(sr / lag)
    return float(np.median(f0s)) if f0s else 115.0

async def build_or_load_voice_profile():
    if os.path.exists(PROFILE_JSON):
        with open(PROFILE_JSON, "r", encoding="utf-8") as f:
            return json.load(f)

    # 1. Extract reference audio from user's uploaded video at 24kHz mono
    subprocess.run([
        "ffmpeg", "-y", "-i", REF_VIDEO_PATH,
        "-vn", "-ac", "1", "-ar", str(SR),
        "-af", "highpass=f=70,lowpass=f=10500",
        REF_WAV
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    ref_samples = read_wav_mono(REF_WAV)
    ref_f0 = estimate_f0(ref_samples, SR)
    ref_ltas = compute_voiced_ltas(ref_samples, SR)

    # 2. Generate a calibration reference sentence with BASE_VOICE to measure its baseline F0 & LTAS
    cal_mp3 = os.path.join(PROFILE_DIR, "cal_base.mp3")
    cal_wav = os.path.join(PROFILE_DIR, "cal_base.wav")
    comm = edge_tts.Communicate(
        "Eski müşterin aynı yere yenisini istediğinde eski ölçü elinde mi? Ölçü deftere yazılır.",
        BASE_VOICE, rate="+5%", pitch="-3Hz"
    )
    await comm.save(cal_mp3)
    subprocess.run([
        "ffmpeg", "-y", "-i", cal_mp3, "-ac", "1", "-ar", str(SR), cal_wav
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    base_samples = read_wav_mono(cal_wav)
    base_f0 = estimate_f0(base_samples, SR)
    base_ltas = compute_voiced_ltas(base_samples, SR)

    # Compute FFT Spectral Transfer Filter (clamped to +-9 dB for natural studio clarity)
    ratio = ref_ltas / (base_ltas + 1e-6)
    freqs = np.linspace(0, SR / 2, len(ratio))
    # Keep unity below 75Hz and above 8500Hz, blend smoothly in the vocal formant band (90Hz - 7500Hz)
    transfer_gain = np.clip(ratio, 0.38, 2.6)
    for idx, f in enumerate(freqs):
        if f < 80:
            transfer_gain[idx] = 1.0
        elif f > 7800:
            transfer_gain[idx] = 1.0 + (transfer_gain[idx] - 1.0) * 0.25
        else:
            # Blend 70% of reference LTAS curve for authentic timbre matching without phase artifacts
            transfer_gain[idx] = 1.0 + (transfer_gain[idx] - 1.0) * 0.70

    # Calculate exact pitch shift in Hz to match the reference speaker's median F0
    f0_diff_hz = int(round(ref_f0 - base_f0))
    f0_diff_hz = max(-10, min(6, f0_diff_hz))
    pitch_str = f"{f0_diff_hz - 3:+d}Hz"

    profile = {
        "ref_f0_hz": round(ref_f0, 2),
        "base_f0_hz": round(base_f0, 2),
        "tts_rate": "+6%",
        "tts_pitch": pitch_str,
        "n_fft": 1024,
        "transfer_gain": [round(float(x), 4) for x in transfer_gain]
    }
    with open(PROFILE_JSON, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2)
    print(f"[VOICE CLONE] Extracted Reference F0={ref_f0:.1f}Hz (Base={base_f0:.1f}Hz -> Pitch={pitch_str}), 513-bin FFT Voice Print saved!")
    return profile

def apply_cloned_spectral_envelope(wav_in, wav_out, profile):
    """Applies overlap-add STFT spectral envelope transfer + studio soft-knee compression."""
    samples = read_wav_mono(wav_in)
    n_fft = profile["n_fft"]
    hop = n_fft // 4
    win = np.hanning(n_fft)
    gain = np.array(profile["transfer_gain"], dtype=np.float32)

    out = np.zeros(len(samples) + n_fft, dtype=np.float32)
    norm = np.zeros(len(samples) + n_fft, dtype=np.float32)

    for i in range(0, len(samples) - n_fft, hop):
        frame = samples[i:i + n_fft] * win
        spec = np.fft.rfft(frame)
        spec_matched = spec * gain
        rec = np.fft.irfft(spec_matched) * win
        out[i:i + n_fft] += rec
        norm[i:i + n_fft] += win ** 2

    mask = norm > 1e-5
    out[mask] /= norm[mask]
    out = out[:len(samples)]

    # Normalize & apply gentle studio broadcast compression (warmth & punch like the reference narrator)
    peak = np.max(np.abs(out)) + 1e-6
    out = out / peak * 0.92
    # Soft-knee warm saturation
    out = np.tanh(out * 1.25) / np.tanh(1.25) * 0.92
    write_wav_mono(wav_out, out, SR)

async def synthesize_cloned_segment(text, out_mp3, profile=None):
    if profile is None:
        profile = await build_or_load_voice_profile()

    tmp_raw = out_mp3.replace(".mp3", "_raw.mp3")
    tmp_wav = out_mp3.replace(".mp3", "_raw.wav")
    tmp_cloned_wav = out_mp3.replace(".mp3", "_cloned.wav")

    comm = edge_tts.Communicate(text, BASE_VOICE, rate=profile["tts_rate"], pitch=profile["tts_pitch"])
    await comm.save(tmp_raw)

    # Trim leading/trailing silence and convert to 24kHz mono WAV
    subprocess.run([
        "ffmpeg", "-y", "-i", tmp_raw,
        "-ac", "1", "-ar", str(SR),
        "-af", "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_silence=0.06:start_threshold=-45dB,areverse",
        tmp_wav
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    apply_cloned_spectral_envelope(tmp_wav, tmp_cloned_wav, profile)

    subprocess.run([
        "ffmpeg", "-y", "-i", tmp_cloned_wav,
        "-c:a", "libmp3lame", "-q:a", "2",
        out_mp3
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    for p in (tmp_raw, tmp_wav, tmp_cloned_wav):
        if os.path.exists(p):
            os.remove(p)

if __name__ == "__main__":
    asyncio.run(build_or_load_voice_profile())
