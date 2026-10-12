"""Generate Club Crumbs raster marks and favicons from public/club-crumbs-logo.png.

Takes public/club-crumbs-logo.png as the source of truth and exports the
extension icons and favicons so they never drift apart.

    python scripts/generate-logos.py
"""

import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_LOGO = os.path.join(ROOT, "public", "club-crumbs-logo.png")

TARGETS = [
    (os.path.join(ROOT, "extension", "icons", "icon128.png"), 128),
    (os.path.join(ROOT, "extension", "icons", "icon48.png"), 48),
    (os.path.join(ROOT, "extension", "icons", "icon16.png"), 16),
    (os.path.join(ROOT, "src", "app", "icon.png"), 32),
    (os.path.join(ROOT, "src", "app", "apple-icon.png"), 180),
]


def main() -> None:
    if not os.path.exists(SOURCE_LOGO):
        raise FileNotFoundError(f"Source logo not found at {SOURCE_LOGO}")

    src_img = Image.open(SOURCE_LOGO).convert("RGBA")

    for path, size in TARGETS:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        resized = src_img.resize((size, size), Image.LANCZOS)
        resized.save(path, "PNG", optimize=True)
        print(f"{os.path.relpath(path, ROOT)} ({size}x{size}, {os.path.getsize(path)} bytes)")

    # Save multi-size favicon.ico
    for ico_path in [
        os.path.join(ROOT, "public", "favicon.ico"),
        os.path.join(ROOT, "src", "app", "favicon.ico"),
    ]:
        os.makedirs(os.path.dirname(ico_path), exist_ok=True)
        src_img.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
        print(f"{os.path.relpath(ico_path, ROOT)} (ICO, {os.path.getsize(ico_path)} bytes)")


if __name__ == "__main__":
    main()
