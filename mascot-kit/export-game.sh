#!/bin/zsh
# out/NN.webm（process.sh の出力）→ public/mascot/<名前>.webm / .mp4 / idle.png
# 動画の余白を切り詰め、全クリップ共通の枠（CROP）で揃える。Safari 用に HEVC alpha の .mp4 も作る（.mov は Artifact で配信できないため mp4 に格納）
set -e
cd "${0:A:h}"
CROP=${CROP:-500:660:90:22}   # w:h:x:y（720×720 内。全モーションの可動範囲＋ひげ）
SIZE=${SIZE:-400:528}
DST=../public/mascot
typeset -A NAMES=(01 cheer 02 no 03 idea 04 think 05 yay 06 again)
mkdir -p $DST
first=""
for n name in ${(kv)NAMES}; do
  src=out/$n.webm
  [[ -f $src ]] || continue
  [[ -z $first ]] && first=$src
  ffmpeg -y -loglevel error -c:v libvpx-vp9 -i $src -vf "crop=${CROP},scale=${SIZE}:flags=lanczos,format=yuva420p" \
    -c:v libvpx-vp9 -b:v 0 -crf 32 -auto-alt-ref 0 -an $DST/$name.webm
  w=${SIZE%%:*}; h=${SIZE##*:}
  ffmpeg -y -loglevel error -c:v libvpx-vp9 -i $src -vf "crop=${CROP},scale=${SIZE}:flags=lanczos" -pix_fmt bgra -f rawvideo - \
    | ffmpeg -y -loglevel error -f rawvideo -pix_fmt bgra -s ${w}x${h} -r 30 -i - \
        -c:v hevc_videotoolbox -alpha_quality 0.75 -b:v 1200k -tag:v hvc1 -movflags +faststart -an $DST/$name.mp4
  echo "exported $name"
done
# 待機画像は 01 の最初のフレーム（動画の開始ポーズと完全に一致させる）
ffmpeg -y -loglevel error -c:v libvpx-vp9 -i out/01.webm -frames:v 1 -vf "crop=${CROP},scale=${SIZE}:flags=lanczos" -pix_fmt rgba $DST/idle.png
ls -la $DST
