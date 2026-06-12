#!/usr/bin/env python3
"""
prepare_assets.py — 원본 백호돌이 PNG → 게임용 스프라이트 전처리

처리 순서 (기획서 9번):
  1) 플러드필(flood-fill) 누끼: 테두리 시드에서 같은 배경색으로 연결된 영역만 투명화
     → 캐릭터(흰 몸통 + 검은 외곽선) 보존
  2) 내용 경계로 크롭
  3) 게임용 크기로 리사이즈 (캐릭터 최대 512px, 얼굴 아이콘 256px)
  4) 측면 컷(달리기/자전거_가방)은 수평 반전(진행 방향=우향)

요구사항: Pillow, numpy
  pip install Pillow numpy

사용법:
  python3 tools/prepare_assets.py --src <원본_PNG_폴더> --out assets/images
"""
import argparse
import json
import os
from collections import deque

try:
    from PIL import Image
    import numpy as np
except ImportError:
    raise SystemExit("Pillow / numpy 가 필요합니다: pip install Pillow numpy")

# 원본 파일명 → (출력명, 역할, 수평반전여부)
MAPPING = {
    "백호돌이_골프.png":        ("player_run.png",        "1단계 주인공(달리기)",       True),
    "백호돌이_자전거_가방.png":  ("player_bike.png",       "2단계 주인공(자전거)",       True),
    "백호돌이_경륜_.png":       ("mascot_cycle_kspo.png", "2단계 전환카드/브랜딩",      False),
    "백호돌이_자전거.png":       ("mascot_bike_front.png", "보조/대체",                 False),
    "정장_입은_백호돌이.png":    ("title_suit.png",        "타이틀 대표 캐릭터",         False),
    "트렌치코트_커피.png":       ("title_trench.png",      "타이틀/로딩 플레이버",       False),
    "콩순이포즈.png":           ("clear_sparkle.png",     "클리어 축하",               False),
    "훈이피스.png":             ("clear_cool.png",        "클리어 축하(대체)",          False),
    "갸루피스.png":             ("gameover_peace.png",    "게임오버 리액션",           False),
    "백호돌이_레깅스.png":       ("value_meditation.png",  "경영방침 상징/로딩",         False),
    "백호돌이_얼굴_아이콘.png":  ("icon_face.png",         "UI아이콘/점수/코인베이스",   False),
}

MAX_CHAR = 512
MAX_FACE = 256
TOLERANCE = 32  # 배경색 허용 오차


def flood_fill_alpha(img: Image.Image, tol: int = TOLERANCE) -> Image.Image:
    """테두리 시드에서 배경색과 연결된 픽셀만 투명화 (BFS flood fill)."""
    img = img.convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3].astype(int)

    # 네 모서리 색의 중앙값을 배경색으로 추정
    corners = np.array([rgb[0, 0], rgb[0, w - 1], rgb[h - 1, 0], rgb[h - 1, w - 1]])
    bg = np.median(corners, axis=0)

    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        q.append((0, x)); q.append((h - 1, x))
    for y in range(h):
        q.append((y, 0)); q.append((y, w - 1))

    def is_bg(y, x):
        return np.all(np.abs(rgb[y, x] - bg) <= tol)

    while q:
        y, x = q.popleft()
        if y < 0 or y >= h or x < 0 or x >= w or visited[y, x]:
            continue
        visited[y, x] = True
        if not is_bg(y, x):
            continue
        arr[y, x, 3] = 0  # 투명화
        q.extend([(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)])

    return Image.fromarray(arr, "RGBA")


def crop_to_content(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def resize_max(img: Image.Image, max_side: int) -> Image.Image:
    w, h = img.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1.0:
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="원본 PNG 폴더")
    ap.add_argument("--out", default="assets/images", help="출력 폴더")
    ap.add_argument("--tol", type=int, default=TOLERANCE)
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    manifest = []

    for src_name, (out_name, role, flip) in MAPPING.items():
        src_path = os.path.join(args.src, src_name)
        if not os.path.exists(src_path):
            print(f"  [skip] 원본 없음: {src_name}")
            continue
        img = Image.open(src_path)
        img = flood_fill_alpha(img, args.tol)
        img = crop_to_content(img)
        is_face = out_name == "icon_face.png"
        img = resize_max(img, MAX_FACE if is_face else MAX_CHAR)
        if flip:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        img.save(os.path.join(args.out, out_name))
        manifest.append({
            "source": src_name, "output": out_name, "role": role,
            "size": list(img.size), "flipped": flip,
        })
        print(f"  [ok] {src_name} -> {out_name} {img.size}")

    with open(os.path.join(args.out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"\n완료: {len(manifest)}개 처리, manifest.json 갱신")


if __name__ == "__main__":
    main()
