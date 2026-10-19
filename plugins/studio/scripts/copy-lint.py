#!/usr/bin/env python3
"""Lint copy for Sejal's house rules.

    copy-lint.py [paths...]      scan files
    copy-lint.py --diff          scan lines added in the working tree vs HEAD
    copy-lint.py --text "..."    scan a string (Figma text, commit message)

Flags: em dashes, banned strings from shared/private.local.md, AI-tone
phrases, placeholder copy. Exit 1 when anything is found.
"""
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PRIVATE = HERE.parent / "shared" / "private.local.md"

AI_TONE = [
    r"\bend[- ]to[- ]end\b", r"\bseamless(ly)?\b", r"\bleverag(e|ed|ing)\b", r"\belevate[sd]?\b",
    r"\bdelve\b", r"\brobust\b", r"\bin today's\b", r"\bunlock(s|ing)? the\b", r"\bgame[- ]chang",
    r", so that\b", r"\bnot just\b.*\bbut\b",  # lint-ignore
]
PLACEHOLDER = [r"lorem ipsum", r"\[paste", r"\bTBD\b", r"\bXX+\b"]  # lint-ignore
SKIP_SUFFIX = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".woff", ".woff2", ".ico", ".lock", ".pdf"}


def banned():
    if not PRIVATE.exists():
        return []
    m = re.search(r"<!-- banned -->(.*?)<!-- /banned -->", PRIVATE.read_text(), re.S)
    return [b.strip() for b in m.group(1).splitlines() if b.strip()] if m else []


def check(line, where, out, ban):
    if "lint-ignore" in line:
        return
    if "\u2014" in line:
        out.append((where, "em dash", line))
    for b in ban:
        if b.lower() in line.lower():
            out.append((where, f"banned: {b}", line))
    for p in AI_TONE:
        if re.search(p, line, re.I):
            out.append((where, f"AI tone: {p}", line))
    for p in PLACEHOLDER:
        if re.search(p, line, re.I):
            out.append((where, "placeholder", line))


def main(argv):
    out, ban = [], banned()
    if argv[:1] == ["--text"]:
        for i, line in enumerate(" ".join(argv[1:]).splitlines(), 1):
            check(line, f"text:{i}", out, ban)
    elif argv[:1] == ["--diff"]:
        diff = subprocess.run(["git", "diff", "HEAD", "-U0", "--no-color"], capture_output=True, text=True).stdout
        diff += subprocess.run(["git", "diff", "--cached", "-U0", "--no-color"], capture_output=True, text=True).stdout
        f, n = "?", 0
        for line in diff.splitlines():
            if line.startswith("+++ "):
                f = line[6:]
            elif line.startswith("@@"):
                n = int(re.search(r"\+(\d+)", line).group(1))
            elif line.startswith("+") and not line.startswith("+++"):
                if Path(f).suffix not in SKIP_SUFFIX and "private.local" not in f:
                    check(line[1:], f"{f}:{n}", out, ban)
                n += 1
    else:
        for p in argv:
            path = Path(p)
            files = [x for x in path.rglob("*") if x.is_file()] if path.is_dir() else [path]
            for x in files:
                if x.suffix in SKIP_SUFFIX or "node_modules" in x.parts or ".git" in x.parts or "private.local" in x.name:
                    continue
                try:
                    for i, line in enumerate(x.read_text(errors="ignore").splitlines(), 1):
                        check(line, f"{x}:{i}", out, ban)
                except OSError:
                    pass
    for where, what, line in out:
        print(f"{where}  [{what}]  {line.strip()[:140]}")
    print(f"\n{len(out)} issue(s)" if out else "copy-lint: clean")
    return 1 if out else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
