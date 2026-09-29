def run_ocr_htr(content: bytes) -> str:
    """Try OCR/HTR if available; fallback to best-effort decoding for prototype usability."""
    try:
        from PIL import Image
        import pytesseract  # type: ignore
        from io import BytesIO

        image = Image.open(BytesIO(content))
        text = pytesseract.image_to_string(image)
        if text.strip():
            return text
    except Exception:
        pass

    decoded = content.decode("utf-8", errors="ignore").strip()
    return decoded if decoded else "Unable to extract text from document"
