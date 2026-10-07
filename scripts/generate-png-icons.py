#!/usr/bin/env python3
"""
Generates production Chief PWA icons as clean PNG files using standard library (zlib/struct).
Generates:
  - public/pwa-192x192.png
  - public/pwa-512x512.png
  - public/pwa-512x512-maskable.png
  - public/apple-touch-icon.png
"""
import zlib
import struct
import math
import os

def create_png(width, height, get_pixel_func):
    """
    Creates PNG bytes from a pixel function get_pixel_func(x, y) -> (r, g, b, a).
    """
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter byte: 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y)
            raw_data.extend((r, g, b, a))

    # PNG Signature
    sig = b'\x89PNG\r\n\x1a\n'

    # IHDR Chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
    ihdr = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + ihdr_crc

    # IDAT Chunk
    compressed = zlib.compress(bytes(raw_data), 9)
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
    idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + idat_crc

    # IEND Chunk
    iend_crc = struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    iend = struct.pack('>I', 0) + b'IEND' + iend_crc

    return sig + ihdr + idat + iend

def blend(c_bottom, c_top, alpha_top):
    """Blends c_top over c_bottom where alpha_top is in [0, 1]."""
    return int(round(c_bottom * (1 - alpha_top) + c_top * alpha_top))

def point_line_distance(px, py, x1, y1, x2, y2):
    """Distance from point (px, py) to line segment (x1, y1)-(x2, y2)."""
    dx = x2 - x1
    dy = y2 - y1
    l2 = dx*dx + dy*dy
    if l2 == 0:
        return math.hypot(px - x1, py - y1)
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / l2))
    proj_x = x1 + t * dx
    proj_y = y1 + t * dy
    return math.hypot(px - proj_x, py - proj_y)

def dist_to_rounded_rect(px, py, rx1, ry1, rx2, ry2, radius):
    """SDF to rounded rectangle outline."""
    # Inner box where corners start
    cx1 = rx1 + radius
    cy1 = ry1 + radius
    cx2 = rx2 - radius
    cy2 = ry2 - radius
    
    # 4 segments
    d = min(
        point_line_distance(px, py, cx1, ry1, cx2, ry1),
        point_line_distance(px, py, cx1, ry2, cx2, ry2),
        point_line_distance(px, py, rx1, cy1, rx1, cy2),
        point_line_distance(px, py, rx2, cy1, rx2, cy2)
    )
    # 4 arcs
    for cx, cy in [(cx1, cy1), (cx2, cy1), (cx1, cy2), (cx2, cy2)]:
        arc_d = abs(math.hypot(px - cx, py - cy) - radius)
        # Check if point is in corner quadrant
        qx = 1 if px >= cx else -1
        qy = 1 if py >= cy else -1
        # only relevant quadrant
        if (cx == cx1 and px <= cx) or (cx == cx2 and px >= cx):
            if (cy == cy1 and py <= cy) or (cy == cy2 and py >= cy):
                d = min(d, arc_d)
    return d

def render_chief_icon(size, is_maskable=False):
    """
    Renders the Chief operational emblem at the specified square size.
    Coordinates are normalized to 512x512 space.
    """
    scale = size / 512.0

    # Colors
    bg_col = (4, 26, 16, 255)         # #041a10
    border_col = (16, 185, 129, 255)  # #10b981
    primary_col = (52, 211, 153, 255) # #34d399
    center_col = (5, 150, 105, 255)   # #059669
    node_col = (16, 185, 129, 255)    # #10b981

    def get_pixel(x, y):
        # Convert to 512 coordinate space
        px = (x + 0.5) / scale
        py = (y + 0.5) / scale

        # Base background:
        # If maskable, full bleed without corner clipping
        # If standard, smooth rounded corner squircle (rx=128)
        if not is_maskable:
            # Check corner radius 128
            cr = 120
            # corners
            in_bounds = True
            for cx, cy in [(cr, cr), (512 - cr, cr), (cr, 512 - cr), (512 - cr, 512 - cr)]:
                if (px < cr or px > 512 - cr) and (py < cr or py > 512 - cr):
                    if (px - cx)**2 + (py - cy)**2 > cr**2:
                        # Outside rounded corner
                        return (0, 0, 0, 0)

        # Start with dark emerald bg
        r, g, b, a = bg_col

        # Subtle border ring in standard mode (stroke-opacity 0.3)
        if not is_maskable:
            border_d = dist_to_rounded_rect(px, py, 24, 24, 488, 488, 104)
            if border_d < 4:
                alpha = 0.3 * max(0.0, 1.0 - border_d / 4.0)
                r = blend(r, border_col[0], alpha)
                g = blend(g, border_col[1], alpha)
                b = blend(b, border_col[2], alpha)

        # Outer rounded frame: (128..384, 144..368), stroke 24
        frame_d = dist_to_rounded_rect(px, py, 128, 144, 384, 368, 32)
        if frame_d < 12:
            alpha = max(0.0, min(1.0, (12 - frame_d) / 1.5))
            r = blend(r, primary_col[0], alpha)
            g = blend(g, primary_col[1], alpha)
            b = blend(b, primary_col[2], alpha)

        # Crosshairs: V (256, 192..320), H (192..320, 256), stroke 24
        cross_v_d = point_line_distance(px, py, 256, 192, 256, 320)
        if cross_v_d < 12:
            alpha = max(0.0, min(1.0, (12 - cross_v_d) / 1.5))
            r = blend(r, primary_col[0], alpha)
            g = blend(g, primary_col[1], alpha)
            b = blend(b, primary_col[2], alpha)

        cross_h_d = point_line_distance(px, py, 192, 256, 320, 256)
        if cross_h_d < 12:
            alpha = max(0.0, min(1.0, (12 - cross_h_d) / 1.5))
            r = blend(r, primary_col[0], alpha)
            g = blend(g, primary_col[1], alpha)
            b = blend(b, primary_col[2], alpha)

        # Center core circle: cx=256, cy=256, r=32
        center_d = math.hypot(px - 256, py - 256)
        if center_d < 32:
            alpha = max(0.0, min(1.0, (32 - center_d) / 1.5))
            r = blend(r, center_col[0], alpha)
            g = blend(g, center_col[1], alpha)
            b = blend(b, center_col[2], alpha)

        # 4 node circles at (160, 176), (352, 176), (160, 336), (352, 336), r=12
        for nx, ny in [(160, 176), (352, 176), (160, 336), (352, 336)]:
            node_d = math.hypot(px - nx, py - ny)
            if node_d < 12:
                alpha = max(0.0, min(1.0, (12 - node_d) / 1.5))
                r = blend(r, node_col[0], alpha)
                g = blend(g, node_col[1], alpha)
                b = blend(b, node_col[2], alpha)

        return (r, g, b, a)

    return create_png(size, size, get_pixel)

def main():
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'public')
    targets = [
        ('pwa-192x192.png', 192, False),
        ('pwa-512x512.png', 512, False),
        ('pwa-512x512-maskable.png', 512, True),
        ('apple-touch-icon.png', 180, False),
    ]

    for fname, size, maskable in targets:
        path = os.path.join(out_dir, fname)
        print(f"Generating {fname} ({size}x{size}, maskable={maskable})...")
        png_data = render_chief_icon(size, maskable)
        with open(path, 'wb') as f:
            f.write(png_data)
        print(f"  -> Wrote {len(png_data)} bytes to {path}")

if __name__ == '__main__':
    main()
