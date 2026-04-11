"""
Certificate Batch Generator
============================
Usage:
    python generate_certificates.py --config config.json --data data.xlsx

Requirements:
    pip install Pillow pandas openpyxl

config.json is produced by the Certificate Field Mapper UI tool.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

try:
    import pandas as pd
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Missing dependencies. Run:")
    print("  pip install Pillow pandas openpyxl")
    sys.exit(1)


# ── Font loading ───────────────────────────────────────────────────────────
# Maps Google Font names → common system/fallback font file names.
# The script will search FONT_SEARCH_DIRS for these filenames.
FONT_MAP = {
    "cinzel": ["Cinzel-Regular.ttf", "Cinzel-Bold.ttf"],
    "playfair display": ["PlayfairDisplay-Regular.ttf", "PlayfairDisplay-Bold.ttf"],
    "dancing script": ["DancingScript-Regular.ttf", "DancingScript-Bold.ttf"],
    "great vibes": ["GreatVibes-Regular.ttf"],
    "eb garamond": ["EBGaramond-Regular.ttf"],
    "cormorant garamond": [
        "CormorantGaramond-Regular.ttf",
        "CormorantGaramond-Bold.ttf",
    ],
    "raleway": ["Raleway-Regular.ttf", "Raleway-Bold.ttf"],
    "oswald": ["Oswald-Regular.ttf", "Oswald-Bold.ttf"],
    "libre baskerville": ["LibreBaskerville-Regular.ttf"],
    "montserrat": ["Montserrat-Regular.ttf", "Montserrat-Bold.ttf"],
    "futurabook": ["FuturaBook.ttf"],
}

FONT_SEARCH_DIRS = [
    "./fonts",  # fonts/ folder next to this script (recommended)
    "./public",  # bundled project fonts
    "~/.local/share/fonts",
    "/usr/share/fonts",
    "/usr/local/share/fonts",
    "C:/Windows/Fonts",
    "~/Library/Fonts",
    "/Library/Fonts",
]

_font_cache: dict[str, ImageFont.FreeTypeFont] = {}
_font_files_cache: list[Path] | None = None
PROJECT_FONT_OVERRIDES = {
    "futurabook": "public/FuturaBook.ttf",
}
FIT_WIDTH_RATIO = 0.95
FIT_HEIGHT_RATIO = 0.62


def _normalize_font_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def _list_font_files() -> list[Path]:
    global _font_files_cache
    if _font_files_cache is not None:
        return _font_files_cache

    files: list[Path] = []
    exts = ("*.ttf", "*.otf", "*.ttc")
    for directory in [Path(d).expanduser() for d in FONT_SEARCH_DIRS]:
        if not directory.exists():
            continue
        for ext in exts:
            files.extend(directory.rglob(ext))

    _font_files_cache = files
    return files


def find_font_file(
    font_name: str, bold: bool = False, italic: bool = False
) -> str | None:
    """Search for a font file matching the given font name."""
    key = font_name.lower()

    override_path = PROJECT_FONT_OVERRIDES.get(key)
    if override_path:
        p = Path(override_path)
        if p.exists():
            return str(p)

    candidates = FONT_MAP.get(key, [f"{font_name.replace(' ', '')}-Regular.ttf"])

    # Prefer bold variant when bold=True
    if bold and len(candidates) > 1:
        candidates = [candidates[1], candidates[0]]

    search_dirs = [Path(d).expanduser() for d in FONT_SEARCH_DIRS]

    # Pass 1: exact candidate file lookup (quick path).
    for directory in search_dirs:
        if not directory.exists():
            continue
        for fname in candidates:
            for path in directory.rglob(fname):
                return str(path)

    # Pass 2: fuzzy family match against all discovered fonts.
    desired = _normalize_font_name(font_name)
    if not desired:
        return None

    style_tokens: list[str] = []
    if bold:
        style_tokens.append("bold")
    if italic:
        style_tokens.extend(["italic", "oblique"])

    best_match: Path | None = None
    for path in _list_font_files():
        stem_norm = _normalize_font_name(path.stem)
        if desired not in stem_norm:
            continue

        lowered = path.stem.lower()
        if style_tokens and any(token in lowered for token in style_tokens):
            return str(path)
        if best_match is None:
            best_match = path

    if best_match:
        return str(best_match)

    return None


def find_fallback_font_file() -> str | None:
    """Find any scalable font so size still works when requested family is missing."""
    preferred_keywords = [
        "dejavu",
        "liberation",
        "noto",
        "roboto",
        "arial",
        "jetbrainsmono",
    ]

    for path in _list_font_files():
        stem = _normalize_font_name(path.stem)
        if any(keyword in stem for keyword in preferred_keywords):
            return str(path)

    files = _list_font_files()
    if files:
        return str(files[0])

    return None


def load_font(
    font_name: str, size: int, bold: bool = False, italic: bool = False
) -> ImageFont.FreeTypeFont:
    cache_key = f"{font_name}_{size}_{bold}_{italic}"
    if cache_key in _font_cache:
        return _font_cache[cache_key]

    path = find_font_file(font_name, bold, italic)
    if path:
        try:
            font = ImageFont.truetype(path, size)
            _font_cache[cache_key] = font
            return font
        except Exception as e:
            print(f"  ⚠ Could not load font '{font_name}' from {path}: {e}")

    fallback_path = find_fallback_font_file()
    if fallback_path:
        try:
            print(
                f"  ⚠ Font '{font_name}' not found — using fallback font "
                f"'{Path(fallback_path).name}'."
            )
            font = ImageFont.truetype(fallback_path, size)
            _font_cache[cache_key] = font
            return font
        except Exception as e:
            print(f"  ⚠ Could not load fallback font from {fallback_path}: {e}")

    print("  ⚠ No scalable font found — falling back to tiny PIL default font.")
    font = ImageFont.load_default()
    _font_cache[cache_key] = font
    return font


import re

ORDINAL_RE = re.compile(r"^(\d+)(st|nd|rd|th)$", re.IGNORECASE)


def draw_ordinal(draw, text, base_x, base_y, font, color, superscript_ratio=0.55):
    m = ORDINAL_RE.match(text.strip())
    if not m:
        draw.text((base_x, base_y), text, font=font, fill=color)
        return

    number, suffix = m.group(1), m.group(2)
    sup_size = max(8, int(font.size * superscript_ratio))
    sup_font = font.font_variant(size=sup_size)

    # Draw number
    draw.text((base_x, base_y), number, font=font, fill=color)
    nb = draw.textbbox((0, 0), number, font=font)
    num_w = nb[2] - nb[0]

    raise_by = int(font.size * 0.4) - 15
    sx = base_x + num_w + 2
    sy = base_y - raise_by

    offsets = [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)]
    letter_spacing = 3  # adjust this

    cx = sx
    for ch in suffix:
        for ox, oy in offsets:
            draw.text((cx + ox, sy + oy), ch, font=sup_font, fill=color)
        cb = draw.textbbox((0, 0), ch, font=sup_font)
        cx += (cb[2] - cb[0]) + letter_spacing


# ── Text drawing ───────────────────────────────────────────────────────────
def draw_text_in_bbox(
    draw: ImageDraw.ImageDraw,
    text: str,
    bbox: list[int],  # [x, y, w, h] — top-left origin, in image pixels
    font: ImageFont.FreeTypeFont,
    color: tuple[int, int, int],
    align: str = "center",  # "left" | "center" | "right"
    valign: str = "center",  # "top" | "center" | "bottom"
):
    x, y, w, h = bbox

    # If configured font size is too large for the box, shrink to fit.
    fitted_font = font
    if hasattr(font, "size") and hasattr(font, "font_variant"):
        current_size = max(1, int(getattr(font, "size", 1)))
        while current_size > 6:
            box = draw.textbbox((0, 0), text, font=fitted_font)
            text_w = box[2] - box[0]
            text_h = box[3] - box[1]
            if text_w <= int(w * FIT_WIDTH_RATIO) and text_h <= int(
                h * FIT_HEIGHT_RATIO
            ):
                break
            current_size -= 1
            fitted_font = font.font_variant(size=current_size)

    # Measure final fitted text
    bbox_text = draw.textbbox((0, 0), text, font=fitted_font)
    text_w = bbox_text[2] - bbox_text[0]
    text_h = bbox_text[3] - bbox_text[1]

    # Horizontal alignment (Corrected for PIL offset)
    if align == "center":
        tx = x + (w - text_w) // 2 - bbox_text[0]
    elif align == "right":
        tx = x + w - text_w - bbox_text[0]
    else:
        tx = x - bbox_text[0]

    # Vertical alignment (Corrected for PIL offset)
    if valign == "top":
        ty = y - bbox_text[1]
    elif valign == "bottom":
        ty = y + h - text_h - bbox_text[1]
    else:
        ty = y + (h - text_h) // 2 - bbox_text[1]

    m = ORDINAL_RE.match(text.strip())
    if m:
        draw_ordinal(draw, text.strip(), tx, ty, fitted_font, color)
    else:
        draw.text((tx, ty), text, font=fitted_font, fill=color)


# ── Safe filename ──────────────────────────────────────────────────────────
def safe_filename(text: str) -> str:
    return re.sub(r'[\\/*?:"<>|]', "_", str(text)).strip()


# ── Main generation ────────────────────────────────────────────────────────
def generate_certificates(config_path: str, data_path: str):
    # Load config
    with open(config_path) as f:
        config = json.load(f)

    template_path = config["template"]
    output_dir = config.get("output_dir", "output_certificates")
    img_format = config.get("image_format", "PNG").upper()
    fields = config["fields"]

    # Load data
    ext = Path(data_path).suffix.lower()
    if ext in (".xlsx", ".xls"):
        df = pd.read_excel(data_path)
    elif ext == ".csv":
        df = pd.read_csv(data_path)
    else:
        print(f"Unsupported data file format: {ext}")
        sys.exit(1)

    print(f"📄 Template  : {template_path}")
    print(f"📊 Data      : {data_path}  ({len(df)} rows)")
    print(f"🗂  Output dir: {output_dir}")
    print(f"🖼  Format    : {img_format}")
    print(f"📝 Fields    : {[f['column'] for f in fields]}\n")

    # Validate columns
    for field in fields:
        col = field["column"]
        if col not in df.columns:
            print(
                f"❌ Column '{col}' not found in spreadsheet. Available: {list(df.columns)}"
            )
            sys.exit(1)

    # Load template
    template = Image.open(template_path).convert("RGBA")

    # Pre-load fonts
    font_objects = []
    # Scale font sizes from UI canvas coords to actual image coords
    img_w, img_h = template.size
    cfg_w = config.get("image_width", img_w)
    scale = img_w / cfg_w  # e.g. 4.0 if UI was at 25% zoom

    for field in fields:
        field["font_size"] = round(field["font_size"] * scale)

    for field in fields:
        font = load_font(
            field["font"],
            field["font_size"],
            bold=field.get("bold", False),
            italic=field.get("italic", False),
        )
        font_objects.append(font)

    # Create output dir
    os.makedirs(output_dir, exist_ok=True)

    # Generate
    success = 0
    for idx, row in df.iterrows():
        img = template.copy()
        draw = ImageDraw.Draw(img)

        for field, font in zip(fields, font_objects):
            col = field["column"]
            text = str(row[col]) if pd.notna(row[col]) else ""
            bbox = field["bbox"]  # [x, y, w, h]
            color = tuple(field["color"])  # [R, G, B]
            align = field.get("align", "center")
            valign = field.get("valign", "center")

            draw_text_in_bbox(draw, text, bbox, font, color, align, valign)

        # Filename from first column value
        first_val = safe_filename(row.iloc[0])
        out_name = f"{idx + 1:03d}_{first_val}.{img_format.lower()}"
        out_path = os.path.join(output_dir, out_name)

        # Save (convert to RGB for JPEG)
        save_img = img
        if img_format == "JPEG":
            save_img = img.convert("RGB")
        save_img.save(out_path, img_format)

        print(f"  ✓ [{idx + 1:>3}/{len(df)}] {out_name}")
        success += 1

    print(f"\n✅ Done! {success} certificate(s) saved to '{output_dir}/'")


# ── CLI ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch certificate generator")
    parser.add_argument(
        "--config", default="config.json", help="Path to config.json from the UI tool"
    )
    parser.add_argument(
        "--data", default="data.xlsx", help="Path to Excel/CSV data file"
    )
    args = parser.parse_args()

    generate_certificates(args.config, args.data)
