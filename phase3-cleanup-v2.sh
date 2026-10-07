#!/usr/bin/env bash
set -euo pipefail

# Justdy Phase 3 cleanup — surgical removal of the retired AI Chat and
# unsupported resource-generation surfaces.
#
# This script is intentionally conservative:
# - it creates a backup branch before deleting anything
# - it does NOT remove the generic AI generation engine
# - it does NOT remove CHAT from the generation enum/schema
# - it preserves Live Homework session chat
# - it does NOT delete generic resource CRUD/library/project infrastructure
#
# Run from the Justdy repository root:
#   bash phase3-cleanup-v2.sh

if [[ ! -d ".git" ]]; then
  echo "ERROR: Run this script from the Justdy repository root."
  exit 1
fi

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_branch="backup/phase3-before-chat-cleanup-${timestamp}"

echo
echo "=== Justdy Phase 3 cleanup ==="
echo "Backup branch: ${backup_branch}"
echo

git status --short
echo

read -r -p "Create backup branch and continue? [y/N] " answer
if [[ ! "$answer" =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

git switch -c "$backup_branch"

# ---------------------------------------------------------------------------
# 1. Remove retired AI Chat API surfaces.
# ---------------------------------------------------------------------------
obsolete_ai_paths=(
  "app/api/ai/chat"
  "app/api/ai/conversations"
  "app/api/ai/create-intent"
  "app/api/ai/presentation"
)

for path in "${obsolete_ai_paths[@]}"; do
  if [[ -e "$path" ]]; then
    echo "Removing $path"
    rm -rf "$path"
  fi
done

# ---------------------------------------------------------------------------
# 2. Remove resource-generation endpoints for retired creation types.
#
# Generic resource CRUD remains. Coloring pages remain. Image remains.
# Worksheet generation remains under /api/ai/worksheet.
# ---------------------------------------------------------------------------
obsolete_resource_paths=(
  "app/api/resources/document"
  "app/api/resources/lesson-plan"
  "app/api/resources/presentation"
  "app/api/resources/quiz"
  "app/api/resources/[resourceId]/quiz"
)

for path in "${obsolete_resource_paths[@]}"; do
  if [[ -e "$path" ]]; then
    echo "Removing $path"
    rm -rf "$path"
  fi
done

# ---------------------------------------------------------------------------
# 3. Remove tests whose entire purpose is the retired Chat architecture.
# ---------------------------------------------------------------------------
obsolete_tests=(
  "tests/ai/chat-generation-integrity.integration.test.ts"
  "tests/ai/chat-video-generation-integrity.integration.test.ts"
  "tests/ai/chat-project-integrity.integration.test.ts"
  "tests/ai/worksheet-chat-route.integration.test.ts"
)

for path in "${obsolete_tests[@]}"; do
  if [[ -f "$path" ]]; then
    echo "Removing $path"
    rm -f "$path"
  fi
done

# ---------------------------------------------------------------------------
# 4. Remove the public simulated chatbot if it still exists.
# ---------------------------------------------------------------------------
if [[ -f "app/_components/chat/JustdyChatbot.tsx" ]]; then
  echo "Removing app/_components/chat/JustdyChatbot.tsx"
  rm -f "app/_components/chat/JustdyChatbot.tsx"
fi

# Remove an empty chat component directory only; never touch tutoring session
# chat or any other route containing "chat".
if [[ -d "app/_components/chat" ]] && [[ -z "$(find "app/_components/chat" -mindepth 1 -print -quit)" ]]; then
  rmdir "app/_components/chat"
fi

# ---------------------------------------------------------------------------
# 5. Remove obsolete standalone create pages ONLY when they are present.
# ---------------------------------------------------------------------------
obsolete_create_paths=(
  "app/(dashboard)/create/audio"
  "app/(dashboard)/create/document"
  "app/(dashboard)/create/lesson"
  "app/(dashboard)/create/quiz"
  "app/(dashboard)/create/presentation"
)

for path in "${obsolete_create_paths[@]}"; do
  if [[ -e "$path" ]]; then
    echo "Removing $path"
    rm -rf "$path"
  fi
done

# Some versions of the project use a non-grouped dashboard/create location.
# Do not guess-delete it. We only remove known retired child routes.
for path in \
  "app/dashboard/create/audio" \
  "app/dashboard/create/document" \
  "app/dashboard/create/lesson" \
  "app/dashboard/create/quiz" \
  "app/dashboard/create/presentation"
do
  if [[ -e "$path" ]]; then
    echo "Removing $path"
    rm -rf "$path"
  fi
done

echo
echo "=== Cleanup complete ==="
echo

# ---------------------------------------------------------------------------
# 6. Audit — these are expected to return zero except for Live Homework chat
# and ordinary words such as "chat" in unrelated text.
# ---------------------------------------------------------------------------
echo "=== Retired API path audit ==="
if find app/api -type f \( \
    -path '*/ai/chat/*' -o \
    -path '*/ai/chat' -o \
    -path '*/ai/conversations/*' -o \
    -path '*/ai/conversations' -o \
    -path '*/ai/create-intent/*' -o \
    -path '*/ai/create-intent' -o \
    -path '*/ai/presentation/*' -o \
    -path '*/ai/presentation' -o \
    -path '*/resources/document/*' -o \
    -path '*/resources/lesson-plan/*' -o \
    -path '*/resources/presentation/*' -o \
    -path '*/resources/quiz/*' \
  \) -print | grep .; then
  echo "WARNING: retired API files remain."
else
  echo "OK: retired API route files are gone."
fi

echo
echo "=== Live Homework chat preservation check ==="
if [[ -f "app/api/live-homework-help/session/[sessionId]/chat/route.ts" ]]; then
  echo "OK: Live Homework session chat is preserved."
else
  echo "WARNING: Live Homework session chat route was not found."
fi

echo
echo "=== Retired test reference audit ==="
if find tests -type f \( \
    -name '*chat-generation-integrity*' -o \
    -name '*chat-video-generation-integrity*' -o \
    -name '*chat-project-integrity*' -o \
    -name '*worksheet-chat-route*' \
  \) -print | grep .; then
  echo "WARNING: retired Chat tests remain."
else
  echo "OK: retired Chat tests are gone."
fi

echo
echo "=== Source-reference audit ==="
if command -v rg >/dev/null 2>&1; then
  rg -n --hidden \
    --glob '!node_modules/**' \
    --glob '!.next/**' \
    --glob '!.git/**' \
    --glob '!pnpm-lock.yaml' \
    'api/ai/chat|api/ai/conversations|api/ai/create-intent|api/ai/presentation|JustdyChatbot|conversationId' \
    app lib components tests 2>/dev/null || true
else
  echo "ripgrep (rg) is not installed; skipping source-reference audit."
fi

echo
echo "=== IMPORTANT: intentional preservation ==="
echo "Kept: /api/ai/generate"
echo "Kept: /api/ai/image"
echo "Kept: /api/ai/video/*"
echo "Kept: /api/ai/worksheet/*"
echo "Kept: /api/resources/* generic CRUD/publish/activity"
echo "Kept: /api/resources/coloring-page"
echo "Kept: /api/live-homework-help/session/[sessionId]/chat"
echo "Kept: credit, Stripe, tutoring, Daily, whiteboard, library and project infrastructure"
echo
echo "The backup branch is: ${backup_branch}"
echo
echo "Next verification:"
echo "  pnpm exec tsc --noEmit"
echo "  pnpm test"
echo "  pnpm build"
echo
echo "Do NOT remove the generic CHAT generation enum/schema yet; it may be needed"
echo "for historical generation records and generic generation infrastructure."
