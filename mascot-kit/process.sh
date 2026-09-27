#!/bin/zsh
# clips/NN.mp4（緑背景）→ out/ に透過WebMと連結版を書き出す。あるクリップだけ処理する
set -e
cd "${0:A:h}"
SIM=${SIM:-0.18}
BLEND=${BLEND:-0.08}
KEY=${KEY:-0x00A948}   # Kling出力の背景色（実測）
# 右下の「KlingAI」ウォーターマークを背景色で塗りつぶしてから抜く
WM="drawbox=x=iw*0.76:y=ih*0.91:w=iw*0.24:h=ih*0.09:color=${KEY}:t=fill"
FIT="fps=30,scale=720:720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2:color=${KEY}"
clips=(clips/*.mp4(N))
(( ${#clips} )) || { echo "clips/ に mp4 がありません"; exit 1; }
mkdir -p out
: > out/list.txt
greens=()
for c in $clips; do
  i=${c:t:r}
  ffmpeg -y -loglevel error -i $c -an \
    -vf "${WM},${FIT},colorkey=${KEY}:${SIM}:${BLEND},despill=type=green,format=yuva420p" \
    -c:v libvpx-vp9 -b:v 0 -crf 30 -auto-alt-ref 0 out/$i.webm
  ffmpeg -y -loglevel error -i $c -an -vf "${WM},${FIT}" -c:v libx264 -pix_fmt yuv420p out/${i}_green.mp4
  echo "file '$i.webm'" >> out/list.txt
  greens+=(-i out/${i}_green.mp4)
  echo "done $i"
done
ffmpeg -y -loglevel error -c:v libvpx-vp9 -f concat -safe 0 -i out/list.txt \
  -c:v libvpx-vp9 -b:v 0 -crf 30 -auto-alt-ref 0 -pix_fmt yuva420p out/all.webm
ffmpeg -y -loglevel error $greens -filter_complex "concat=n=${#clips}:v=1:a=0" -c:v libx264 -pix_fmt yuv420p out/all_green.mp4
rm -f out/[0-9][0-9]_green.mp4 out/list.txt
ls out
