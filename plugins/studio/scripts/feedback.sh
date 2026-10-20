#!/usr/bin/env bash
# Logs one piece of skill feedback for the Studio skills workshop chat.
# Usage: feedback.sh "<chat>" "<skill>" "<what happened>" "<rule to add or change>"
# Writes a row under "## Open" in FEEDBACK.md of the studio repo
# (STUDIO_REPO, default ~/Documents/Github/studio). No confidential details.

set -euo pipefail
if [ $# -lt 4 ]; then
  echo 'usage: feedback.sh "<chat>" "<skill>" "<what happened>" "<rule to add or change>"' >&2
  exit 1
fi

repo="${STUDIO_REPO:-$HOME/Documents/Github/studio}"
[ -d "$repo" ] || repo="$HOME/.claude"
file="$repo/FEEDBACK.md"

python3 - "$file" "$(date +%Y-%m-%d)" "$@" <<'EOF'
import sys
from pathlib import Path

path, date, *cells = sys.argv[1:]
clean = [c.replace("\u2014", ", ").replace("|", "/").replace("\n", " ").strip() for c in cells[:4]]
row = "| " + " | ".join([date, *clean]) + " |"
header = "| Date | Chat | Skill | What happened | Suggested rule |\n|---|---|---|---|---|"

p = Path(path)
if not p.exists():
    p.write_text(
        "# Studio feedback\n\n"
        "Rows the studio skills add when Sejal corrects something a studio rule should have caught. "
        "The Studio skills workshop chat turns them into rule changes and moves them to Done.\n\n"
        f"## Open\n\n{header}\n\n## Done\n\n{header}\n"
    )
text = p.read_text()
anchor = text.index(header, text.index("## Open")) + len(header)
p.write_text(text[:anchor] + "\n" + row + text[anchor:])
print(f"feedback logged: {row}")
EOF
