#!/usr/bin/env python3
"""Generate simple MusicGrabber Mobile app icons."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent / "assets" / "images"
SIZE = 1024
BG = "#121218"
PRIMARY = "#7C6BF0"
ACCENT = "#4CC9F0"
WHITE = "#F5F5FA"


def rounded_rect(draw: ImageDraw.ImageDraw, box, radius: int, fill: str) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def draw_logo(draw: ImageDraw.ImageDraw, size: int, *, monochrome: bool = False) -> None:
    primary = WHITE if monochrome else PRIMARY
    accent = WHITE if monochrome else ACCENT
    pad = size * 0.14
    inner = size - pad * 2

    # Soft badge behind the mark
    badge_margin = size * 0.18
    badge_box = [badge_margin, badge_margin, size - badge_margin, size - badge_margin]
    if not monochrome:
        rounded_rect(draw, badge_box, int(size * 0.18), "#1C1C26")

    cx = size / 2
    cy = size * 0.54

    # Download arrow (grab into library)
    arrow_w = inner * 0.22
    shaft_top = cy - inner * 0.24
    shaft_bottom = cy + inner * 0.02
    draw.line([(cx, shaft_top), (cx, shaft_bottom)], fill=accent, width=int(size * 0.05), joint="curve")
    head_y = shaft_bottom + inner * 0.02
    head_half = arrow_w / 2
    draw.polygon(
        [
            (cx, head_y + inner * 0.12),
            (cx - head_half, head_y),
            (cx + head_half, head_y),
        ],
        fill=accent,
    )

    # Tray line
    tray_y = cy + inner * 0.16
    tray_half = inner * 0.2
    draw.line(
        [(cx - tray_half, tray_y), (cx + tray_half, tray_y)],
        fill=accent,
        width=int(size * 0.045),
    )

    # Music note head
    note_x = cx + inner * 0.18
    note_y = cy - inner * 0.18
    head_r = inner * 0.075
    draw.ellipse(
        [
            note_x - head_r,
            note_y - head_r * 0.8,
            note_x + head_r,
            note_y + head_r * 1.2,
        ],
        fill=primary,
    )

    # Stem
    stem_top = note_y - inner * 0.22
    stem_bottom = note_y + inner * 0.08
    draw.line(
        [(note_x + head_r * 0.75, stem_bottom), (note_x + head_r * 0.75, stem_top)],
        fill=primary,
        width=int(size * 0.04),
    )

    # Flag
    flag_w = inner * 0.12
    flag_h = inner * 0.08
    fx = note_x + head_r * 0.75
    fy = stem_top
    draw.pieslice(
        [fx, fy - flag_h, fx + flag_w, fy + flag_h],
        start=200,
        end=340,
        fill=primary,
    )


def make_icon(*, transparent: bool = False, monochrome: bool = False) -> Image.Image:
    if transparent:
        img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    else:
        img = Image.new("RGBA", (SIZE, SIZE), BG)
    draw = ImageDraw.Draw(img)
    draw_logo(draw, SIZE, monochrome=monochrome)
    return img


def save_all() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)

    make_icon().save(ROOT / "icon.png")
    make_icon().save(ROOT / "splash-icon.png")

    bg = Image.new("RGBA", (SIZE, SIZE), BG)
    bg.save(ROOT / "android-icon-background.png")

    make_icon(transparent=True).save(ROOT / "android-icon-foreground.png")
    make_icon(transparent=True, monochrome=True).save(ROOT / "android-icon-monochrome.png")

    fav = make_icon()
    fav.resize((48, 48), Image.Resampling.LANCZOS).save(ROOT / "favicon.png")

    print(f"Generated icons in {ROOT}")


if __name__ == "__main__":
    save_all()
