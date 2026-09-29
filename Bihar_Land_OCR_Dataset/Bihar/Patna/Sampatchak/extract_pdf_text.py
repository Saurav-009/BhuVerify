from pathlib import Path
from pypdf import PdfReader

BASE = Path(__file__).parent

PDF_FOLDER = BASE / "documents"
OUTPUT_FOLDER = BASE / "extracted_text"

OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

pdf_files = sorted(PDF_FOLDER.glob("*.pdf"))

print(f"Found {len(pdf_files)} PDF files.")
print()

if not pdf_files:
    print("ERROR: No PDF files found!")
    print(PDF_FOLDER)
    exit()

for pdf_file in pdf_files:

    print(f"Processing: {pdf_file.name}")

    try:
        reader = PdfReader(str(pdf_file))

        all_text = []

        for page_number, page in enumerate(reader.pages, start=1):

            text = page.extract_text()

            if text:
                # Remove characters that can make VS Code
                # think the file is binary
                text = text.replace("\x00", "")
                text = text.replace("\ufffd", "")

                all_text.append(
                    f"\n===== PAGE {page_number} =====\n\n{text}"
                )

            else:
                all_text.append(
                    f"\n===== PAGE {page_number} =====\n\n"
                    "[NO TEXT EXTRACTED]"
                )

        final_text = "\n".join(all_text)

        # Remove any remaining NULL characters
        final_text = final_text.replace("\x00", "")

        output_file = OUTPUT_FOLDER / f"{pdf_file.stem}.txt"

        output_file.write_text(
            final_text,
            encoding="utf-8",
            errors="replace"
        )

        print(f"   SUCCESS -> {output_file.name}")

    except Exception as e:
        print(f"   ERROR -> {e}")

print()
print("====================================")
print("TEXT EXTRACTION COMPLETE")
print("====================================")
print(f"PDFs processed: {len(pdf_files)}")
print(f"Output folder: {OUTPUT_FOLDER}")