"""
Offline Voice Engine — STT (Vosk), TTS (Piper), VAD (WebRTC)
Works 100% offline. No cloud API needed.
"""
import os
import io
import json
import wave
import struct
import logging
import numpy as np
import soundfile as sf
from scipy import signal
from typing import Optional, Dict, Any, List
from pathlib import Path

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
VOSK_MODEL_PATH = BASE_DIR / "models" / "vosk" / "vosk-model-small-en-us-0.15"
PIPER_MODEL_PATH = BASE_DIR / "models" / "piper" / "en_US-lessac-medium.onnx"
PIPER_CONFIG_PATH = BASE_DIR / "models" / "piper" / "en_US-lessac-medium.onnx.json"


class VoiceTools:
    _vosk_model = None
    _vosk_recognizer = None
    _piper_voice = None
    _piper_config = None
    _vad = None
    _available_voices = []

    @classmethod
    def init_stt(cls) -> bool:
        """Initialize Vosk STT model. Returns True if successful."""
        if cls._vosk_model is not None:
            return True
        try:
            from vosk import Model, KaldiRecognizer
            if not VOSK_MODEL_PATH.exists():
                logger.error(f"Vosk model not found at {VOSK_MODEL_PATH}")
                return False
            cls._vosk_model = Model(str(VOSK_MODEL_PATH))
            cls._vosk_recognizer = KaldiRecognizer(cls._vosk_model, 16000)
            cls._vosk_recognizer.SetWords(True)
            cls._vosk_recognizer.SetPartialWords(True)
            logger.info("Vosk STT initialized")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Vosk STT: {e}")
            return False

    @classmethod
    def transcribe_audio(cls, audio_bytes: bytes, sample_rate: int = 16000) -> str:
        """Transcribe complete audio bytes to text."""
        if not cls.init_stt():
            return ""
        cls._vosk_recognizer.Reset()
        try:
            audio_16bit = audio_bytes
            if not cls._is_raw_pcm(audio_bytes):
                audio_np, sr = sf.read(io.BytesIO(audio_bytes), dtype='float32')
                if audio_np.ndim > 1:
                    audio_np = audio_np.mean(axis=1)
                if sr != 16000:
                    audio_np = signal.resample_poly(audio_np, 16000, sr)
                audio_16bit = (audio_np * 32767).astype(np.int16).tobytes()
            if cls._vosk_recognizer.AcceptWaveform(audio_16bit):
                result = json.loads(cls._vosk_recognizer.Result())
            else:
                result = json.loads(cls._vosk_recognizer.PartialResult())
            return result.get("text", "")
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return ""

    @classmethod
    def _is_raw_pcm(cls, data: bytes) -> bool:
        """Detect if data is raw PCM (no WAV header)."""
        if len(data) < 44:
            return True
        return data[:4] != b'RIFF'

    @classmethod
    def transcribe_chunk(cls, audio_chunk: bytes) -> Dict[str, Any]:
        """Process a streaming audio chunk (16kHz, 16-bit PCM, mono)."""
        if not cls.init_stt():
            return {"text": "", "is_final": False}
        try:
            if cls._vosk_recognizer.AcceptWaveform(audio_chunk):
                result = json.loads(cls._vosk_recognizer.Result())
                return {"text": result.get("text", ""), "is_final": True}
            else:
                result = json.loads(cls._vosk_recognizer.PartialResult())
                return {"text": result.get("partial", ""), "is_final": False}
        except Exception as e:
            logger.error(f"Chunk transcription error: {e}")
            return {"text": "", "is_final": False}

    @classmethod
    def reset_recognizer(cls):
        """Reset the STT recognizer for a new session."""
        if cls._vosk_recognizer:
            cls._vosk_recognizer.Reset()

    @classmethod
    def init_tts(cls) -> bool:
        """Initialize Piper TTS voice. Returns True if successful."""
        if cls._piper_voice is not None:
            return True
        try:
            from piper import PiperVoice
            if not PIPER_MODEL_PATH.exists():
                logger.error(f"Piper model not found at {PIPER_MODEL_PATH}")
                return False
            cls._piper_voice = PiperVoice.load(
                str(PIPER_MODEL_PATH),
                config_path=str(PIPER_CONFIG_PATH) if PIPER_CONFIG_PATH.exists() else None
            )
            logger.info("Piper TTS initialized")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Piper TTS: {e}")
            return False

    @classmethod
    def synthesize_speech(cls, text: str, speaker_id: Optional[int] = None,
                          length_scale: float = 1.0, noise_scale: float = 0.667,
                          noise_w: float = 0.8) -> bytes:
        """Convert text to speech audio bytes (WAV format, 16kHz, 16-bit PCM)."""
        if not cls.init_tts():
            return b""
        try:
            audio_buffer = io.BytesIO()
            cls._piper_voice.synthesize(
                text,
                audio_buffer,
                speaker_id=speaker_id,
                length_scale=length_scale,
                noise_scale=noise_scale,
                noise_w=noise_w,
            )
            audio_buffer.seek(0)
            return audio_buffer.read()
        except Exception as e:
            logger.error(f"TTS synthesis error: {e}")
            return b""

    @classmethod
    def get_available_voices(cls) -> List[str]:
        """Get list of available TTS voices."""
        if cls._piper_voice and hasattr(cls._piper_voice, 'config'):
            return [cls._piper_voice.config.get('voice', {}).get('name', 'default')]
        return ["en_US-lessac-medium"]

    @classmethod
    def is_speech(cls, audio_chunk: bytes, sample_rate: int = 16000) -> bool:
        """Detect if audio chunk contains speech using WebRTC VAD."""
        if cls._vad is None:
            import webrtcvad
            cls._vad = webrtcvad.Vad(2)
        try:
            frame_size = int(sample_rate * 0.02)
            if len(audio_chunk) < frame_size * 2:
                return False
            return cls._vad.is_speech(audio_chunk[:frame_size * 2], sample_rate)
        except Exception:
            return True

    @classmethod
    def pcm_to_wav(cls, pcm_data: bytes, sample_rate: int = 16000,
                   sample_width: int = 2, channels: int = 1) -> bytes:
        """Convert raw PCM data to WAV format."""
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(channels)
            wav_file.setsampwidth(sample_width)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(pcm_data)
        wav_buffer.seek(0)
        return wav_buffer.read()

    @classmethod
    def resample_to_16k(cls, audio_bytes: bytes, original_rate: int) -> bytes:
        """Resample audio to 16kHz mono 16-bit PCM."""
        try:
            audio_np, sr = sf.read(io.BytesIO(audio_bytes), dtype='float32')
            if audio_np.ndim > 1:
                audio_np = audio_np.mean(axis=1)
            if sr != 16000:
                audio_np = signal.resample_poly(audio_np, 16000, sr)
            return (audio_np * 32767).astype(np.int16).tobytes()
        except Exception as e:
            logger.error(f"Resample error: {e}")
            return audio_bytes
