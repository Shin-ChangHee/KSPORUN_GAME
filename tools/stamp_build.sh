#!/usr/bin/env bash
# 배포 시 index.html의 __BUILD__ 플레이스홀더를 고유 버전으로 치환 → 캐시 무력화
# GitHub Actions / Netlify / Vercel 어디서 빌드해도 동작
set -e
BUILD="$(date +%Y%m%d-%H%M%S)"
sed -i "s/__BUILD__/${BUILD}/g" index.html
echo "Stamped build version: ${BUILD}"
