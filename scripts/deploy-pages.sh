#!/bin/zsh
# Build the game and publish it to GitHub Pages (gh-pages branch).
# Relative base so it works at https://<user>.github.io/<repo>/ as well as anywhere else.
set -e
cd "${0:A:h}/.."
remote=$(git remote get-url origin)
rev=$(git rev-parse --short HEAD)
npx tsc -b
npx vite build --base=./
cd dist
touch .nojekyll
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy ${rev}"
git push -q -f "$remote" gh-pages
rm -rf .git
echo "Deployed ${rev} to gh-pages"
