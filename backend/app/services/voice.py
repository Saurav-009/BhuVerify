def transcribe_audio(content: bytes) -> str:
    try:
        import whisper  # type: ignore
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            tmp.write(content)
            tmp.flush()
            model = whisper.load_model("base")
            result = model.transcribe(tmp.name)
            return result.get("text", "").strip()
    except Exception as exc:
        raise RuntimeError("Whisper model unavailable. Install open-source whisper for audio STT.") from exc
