#!/usr/bin/env python3

import argparse
import json
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Missing dependency: Pillow")
    print("Run: pip install Pillow")
    sys.exit(1)


FONT_MAP = {
    "futurabook": ["FuturaBook.ttf"],
    "cinzel": ["Cinzel-Regular.ttf", "Cinzel-Bold.ttf"],
    "rajdhani": ["Rajdhani-Regular.ttf", "Rajdhani-Bold.ttf"],
}

FONT_SEARCH_DIRS = [
    "./fonts",
    "./public",
    "~/.local/share/fonts",
    "/usr/share/fonts",
    "/usr/local/share/fonts",
    "C:/Windows/Fonts",
    "~/Library/Fonts",
    "/Library/Fonts",
]

PROJECT_FONT_OVERRIDES = {
    "futurabook": "public/FuturaBook.ttf",
}

FIT_WIDTH_RATIO = 0.95
FIT_HEIGHT_RATIO = 0.62


def _normalize_font_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def _list_font_files() -> list[Path]:
    files: list[Path] = []
    for directory in [Path(d).expanduser() for d in FONT_SEARCH_DIRS]:
        if not directory.exists():
            continue
        files.extend(directory.rglob("*.ttf"))
        files.extend(directory.rglob("*.otf"))
        files.extend(directory.rglob("*.ttc"))
    return files


def find_font_file(
    font_name: str, bold: bool = False, italic: bool = False
) -> str | None:
    key = font_name.lower()
    override_path = PROJECT_FONT_OVERRIDES.get(key)
    if override_path:
        p = Path(override_path)
        if p.exists():
            return str(p)

    candidates = FONT_MAP.get(key, [f"{font_name.replace(' ', '')}-Regular.ttf"])
    if bold and len(candidates) > 1:
        candidates = [candidates[1], candidates[0]]

    for directory in [Path(d).expanduser() for d in FONT_SEARCH_DIRS]:
        if not directory.exists():
            continue
        for candidate in candidates:
            for path in directory.rglob(candidate):
                return str(path)

    desired = _normalize_font_name(font_name)
    if not desired:
        return None

    style_tokens = []
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

    return str(best_match) if best_match else None


def load_font(
    font_name: str, size: int, bold: bool = False, italic: bool = False
) -> ImageFont.FreeTypeFont:
    path = find_font_file(font_name, bold, italic)
    if path:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()


def draw_text_in_bbox(
    draw: ImageDraw.ImageDraw,
    text: str,
    bbox: list[int],
    font: ImageFont.FreeTypeFont,
    color: tuple[int, int, int],
    align: str = "center",
    valign: str = "center",
):
    x, y, w, h = bbox
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

    measured = draw.textbbox((0, 0), text, font=fitted_font)
    text_w = measured[2] - measured[0]
    text_h = measured[3] - measured[1]

    if align == "center":
        tx = x + (w - text_w) // 2 - measured[0]
    elif align == "right":
        tx = x + w - text_w - measured[0]
    else:
        tx = x - measured[0]

    if valign == "top":
        ty = y - measured[1]
    elif valign == "bottom":
        ty = y + h - text_h - measured[1]
    else:
        ty = y + (h - text_h) // 2 - measured[1]

    draw.text((tx, ty), text, font=fitted_font, fill=color)


def safe_filename(value: str) -> str:
    return re.sub(r'[\\/*?:"<>|]', "_", value).strip()


def generate(
    config_path: str,
    name: str,
    event: str,
    output_file_name: str,
    output_dir_override: str | None = None,
) -> Path:
    with open(config_path, "r", encoding="utf-8") as file:
        config = json.load(file)

    template_path = config["template"]
    output_dir = output_dir_override or config.get("output_dir", "pcerts")
    image_format = config.get("image_format", "PNG").upper()
    fields = config["fields"]

    template = Image.open(template_path).convert("RGBA")
    draw_image = template.copy()
    draw = ImageDraw.Draw(draw_image)

    image_width = draw_image.size[0]
    configured_width = config.get("image_width", image_width)
    scale = image_width / configured_width

    data = {
        "name": name,
        "event": event,
    }

    for field in fields:
        key = str(field["column"])
        value = data.get(key, "")
        font_size = round(int(field["font_size"]) * scale)
        font = load_font(
            str(field["font"]),
            font_size,
            bool(field.get("bold", False)),
            bool(field.get("italic", False)),
        )
        draw_text_in_bbox(
            draw,
            str(value),
            list(field["bbox"]),
            font,
            tuple(field["color"]),
            str(field.get("align", "center")),
            str(field.get("valign", "center")),
        )

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    out_name = safe_filename(output_file_name)
    if not out_name.lower().endswith(f".{image_format.lower()}"):
        out_name = f"{out_name}.{image_format.lower()}"

    output_path = out_dir / out_name
    save_image = draw_image
    if image_format == "JPEG":
        save_image = draw_image.convert("RGB")
    save_image.save(output_path, image_format)
    return output_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate one participation certificate"
    )
    parser.add_argument(
        "--config", default="pcert_config.json", help="Path to config JSON"
    )
    parser.add_argument("--name", required=True, help="Participant name")
    parser.add_argument("--event", required=True, help="Event name")
    parser.add_argument(
        "--file-name", required=True, help="Output filename without extension"
    )
    parser.add_argument(
        "--output-dir", default="", help="Optional output directory override"
    )
    args = parser.parse_args()

    output = generate(
        args.config,
        args.name.strip(),
        args.event.strip(),
        args.file_name.strip(),
        args.output_dir.strip() or None,
    )
    print(str(output))
