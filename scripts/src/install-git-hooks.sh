#!/bin/sh
# Run this once to install the post-commit hook.
# Usage: sh scripts/src/install-git-hooks.sh

HOOK_PATH=".git/hooks/post-commit"
SCRIPT_PATH="scripts/src/github-push.sh"

# Make the push script executable
chmod +x "$SCRIPT_PATH"

# Write the hook
cat > "$HOOK_PATH" <<'EOF'
#!/bin/sh
# Auto-push to GitHub after every commit
exec "$(git rev-parse --show-toplevel)/scripts/src/github-push.sh"
EOF

chmod +x "$HOOK_PATH"
echo "post-commit hook installed at $HOOK_PATH"
echo "Every commit will now auto-push to GitHub (requires GITHUB_TOKEN secret)."
