#!/bin/sh
# Called by the post-commit hook — pushes current branch to GitHub.
# Requires GITHUB_TOKEN to be set in the environment (Replit secret).

if [ -z "$GITHUB_TOKEN" ]; then
  echo "[github-push] GITHUB_TOKEN is not set — skipping push."
  exit 0
fi

REMOTE_URL="https://${GITHUB_TOKEN}@github.com/PradeepMohindroo/instaconnect-videos.git"
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")

echo "[github-push] Pushing branch '$BRANCH' to GitHub..."
git push "$REMOTE_URL" "$BRANCH" 2>&1

if [ $? -eq 0 ]; then
  echo "[github-push] Push successful."
else
  echo "[github-push] Push failed — check GITHUB_TOKEN has 'repo' write access."
  exit 1
fi
