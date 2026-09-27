# MOLD LAB 先生ネコ — モーション生成キット

## 使うファイル
| ファイル | 用途 |
|---|---|
| `00_main_start_green.png` | **開始フレーム（全6本共通）**。緑単色背景＝後で透過にする用 |
| `00_main_start_white.png` | 緑かぶりが気になる場合の代替（白背景） |
| `00_main_cutout.png` | 透過PNG。参照画像欄がある場合に使う |
| `ref/0X_*_expression.png` | 各モーションの「表情見本」。参照画像を複数入れられるサービス用 |
| `ref/character_sheet.png` | 元のキャラクターシート |

## 生成のしかた（推奨）
- **1モーション＝1本（4〜5秒）で6本生成**し、あとで `process.sh` で1本につなぐ。
  1本に6モーションを詰めると、途中で顔や体型が崩れやすくなるため。ゲームUIでも状態ごとに1本ずつの方が扱いやすい。
- 設定：Image-to-Video / 開始フレーム＝`00_main_start_green.png` / 1:1 / 5秒 / カメラ固定
- おすすめサービス：Kling 3.0（Image to Video）、Runway Gen-4、Hailuo。Klingなら終了フレームにも同じ画像を入れると、ループしやすくなる。
- 口パク：以下のプロンプトでも口の開閉は出る。音声と正確に合わせたい場合は、生成後に Kling の「Lip Sync」へセリフ音声を入れる。
- 保存名は `clips/01.mp4` 〜 `clips/06.mp4` にする。

## 共通ネガティブプロンプト
```
changing character design, different face, different eye shape, different fur color, removing helmet, removing bandana, extra limbs, extra fingers, text, logo change, background change, camera movement, zoom, blur, deformation, realistic cat, human
```

## 共通の前置き（各プロンプトの先頭に付ける）
```
The exact same cute 3D chibi kitten mascot from the image: cream-orange and white fluffy fur, big round dark-blue eyes, pink nose, white construction helmet with blue "M" logo, blue bandana with white "M". Keep face, body proportions, fur color, eye shape, helmet and bandana identical in every frame. Solid flat chroma green background, static locked camera, full body centered. Subtle natural idle motion: eye blinks, ear twitches, gentle tail sway, slight body bob. Small, clear, game-UI friendly motion, returns to the starting pose at the end.
```

## 各モーション
### ① いいね！（01）
```
The kitten smiles brightly and waves both paws side to side as if saying "Nice!" ("Iine!"). Mouth opens and closes naturally as if speaking a short phrase.
```
### ② ダメだよ！（02）
```
The kitten makes a serious, slightly stern face, shakes its head left and right, and pushes one paw forward like a "stop" gesture, as if saying "No, don't!" ("Dame da yo!"). Mouth opens and closes naturally as if speaking.
```
### ③ こうしてみよう！（03）
```
The kitten gets a sudden idea: eyes widen with a bright "aha" expression, one paw raises up high with a finger-point gesture, as if saying "Let's try this!" ("Kou shite miyou!"). Mouth opens and closes naturally as if speaking.
```
### ④ うーん…（04）
```
The kitten tilts its head to one side and thinks, eyes glancing upward, paw near its chin, mouth closed in a small pout then murmuring "Hmm..." ("Uun...") with a small slow mouth movement.
```
### ⑤ やったー！（05）
```
The kitten throws both paws up and does one small happy jump, eyes closed in a big joyful smile, landing softly, as if shouting "Yay!" ("Yattaa!"). Mouth opens wide and closes naturally as if cheering.
```
### ⑥ もう一回やってみよう！（06）
```
The kitten smiles with determination and makes a small fist pump with one paw, as if saying "Let's try once more!" ("Mou ikkai yatte miyou!"). Mouth opens and closes naturally as if speaking.
```

## 生成後
`clips/` に 01〜06.mp4 を置いてから `./process.sh` を実行すると、次のファイルができる。
- `out/01.webm`〜`06.webm`：背景透過（VP9 alpha）。1本ずつ Web ゲームで使う
- `out/all.webm`：6本を連結した透過版
- `out/all_green.mp4`：6本を連結した確認用（Safari用には透過なしの代替として）

緑の抜けが甘い場合は、`process.sh` の `SIM`（色の近さ）と `BLEND` を調整する。
