"""A small tiling noise plate, so the 'photograph' in shots 1-2 does not read
as flat vector art. Written next to this script as grain.png."""
import os, random, struct, zlib

random.seed(7)
W = H = 200
rows = b""
for _ in range(H):
    row = b"\x00"
    for _ in range(W):
        v = random.randint(150, 255)
        row += bytes((v, v, v))
    rows += row


def chunk(tag, data):
    body = tag + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


png = (
    b"\x89PNG\r\n\x1a\n"
    + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0))
    + chunk(b"IDAT", zlib.compress(rows, 6))
    + chunk(b"IEND", b"")
)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "grain.png")
with open(out, "wb") as f:
    f.write(png)
print(out, len(png))
