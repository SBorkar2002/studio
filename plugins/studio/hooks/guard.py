#!/usr/bin/env python3
"""Studio hooks: house rules enforced by the harness, at no token cost.

PreToolUse Bash : block force-push and anything touching old-portfolio.
PostToolUse Edit/Write : warn Claude about em dashes it just wrote.
"""
import json
import re
import sys

data = json.load(sys.stdin)
tool = data.get("tool_name", "")
inp = data.get("tool_input", {}) or {}
event = data.get("hook_event_name", "")

if event == "PreToolUse" and tool == "Bash":
    cmd = inp.get("command", "")
    if re.search(r"git\s+push\b[^\n;&|]*(\s--force\b|\s-f\b|\s--force-with-lease\b|\s\+\S)", cmd):
        print("Studio rule: never force-push. Use a new commit or ask Sejal.", file=sys.stderr)
        sys.exit(2)
    if re.search(r"git\s+(push|branch|tag|reset|rebase|checkout\s+-B)\b[^\n;&|]*old-portfolio", cmd):
        print("Studio rule: the old-portfolio branch and old-portfolio-final tag are frozen history. Do not touch them.", file=sys.stderr)
        sys.exit(2)
    sys.exit(0)

if event == "PostToolUse" and tool in ("Edit", "Write", "MultiEdit"):
    path = inp.get("file_path", "")
    if "private.local" in path:
        sys.exit(0)
    text = inp.get("new_string") or inp.get("content") or ""
    if tool == "MultiEdit":
        text = "\n".join(e.get("new_string", "") for e in inp.get("edits", []))
    hits = [l.strip()[:100] for l in text.splitlines() if "\u2014" in l]
    if hits:
        print(f"Studio rule: em dash written in {path}. Replace with a colon, comma, full stop or ' · ':\n  " + "\n  ".join(hits[:5]), file=sys.stderr)
        sys.exit(2)
sys.exit(0)
