#!/usr/bin/env python3
"""
fetch-outlook-emails.py
-----------------------
CLI tool to fetch emails from macOS Outlook via JXA (osascript).
Outputs JSON array to stdout. Errors to stderr.

Usage:
    python3 fetch-outlook-emails.py \
        --senders "alice@co.com,bob@co.com" \
        --keyword "周报" \
        --start-date 2026-03-23 \
        --end-date 2026-03-29

Requires: macOS with Microsoft Outlook installed, Python 3.9+
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime


def _sanitize_js_string(value: str) -> str:
    """Escape a string for safe injection into a JavaScript string literal."""
    return json.dumps(value)[1:-1]  # json.dumps adds quotes; strip them


def _validate_date(date_str: str) -> str:
    """Validate date is YYYY-MM-DD format. Returns the date string or raises ValueError."""
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
        raise ValueError(f"Date must be YYYY-MM-DD format, got: {date_str}")
    datetime.strptime(date_str, "%Y-%m-%d")
    return date_str


def build_jxa_script(folder: str, limit: int, start_date: str | None, end_date: str | None) -> str:
    """Build the JXA script string with safe parameter injection."""
    safe_folder = _sanitize_js_string(folder)
    safe_limit = int(limit)

    # Validate and sanitize dates inside this function (defense-in-depth)
    # Use local year/month/day comparison to avoid timezone issues in JXA.
    # JXA's new Date("YYYY-MM-DDTHH:mm:ss") without timezone suffix is parsed as UTC,
    # but Outlook's timeReceived() is local time. Comparing via getFullYear/getMonth/getDate
    # uses local time consistently and avoids the mismatch.
    date_filter_js = ""
    if start_date:
        safe_start = _validate_date(start_date)
        sy, sm, sd = safe_start.split('-')
        date_filter_js += f'var startY = {int(sy)}, startM = {int(sm)}, startD = {int(sd)};\n'
    if end_date:
        safe_end = _validate_date(end_date)
        ey, em, ed = safe_end.split('-')
        date_filter_js += f'var endY = {int(ey)}, endM = {int(em)}, endD = {int(ed)};\n'

    date_check_js = ""
    if start_date or end_date:
        # Build a date value from local y/m/d for comparison (YYYYMMDD as integer)
        date_check_js = "var rd = new Date(recvTime); var rv = rd.getFullYear() * 10000 + (rd.getMonth() + 1) * 100 + rd.getDate();"
        if start_date and end_date:
            date_check_js += " var sv = startY * 10000 + startM * 100 + startD; var ev = endY * 10000 + endM * 100 + endD; if (rv < sv || rv > ev) continue;"
        elif start_date:
            date_check_js += " var sv = startY * 10000 + startM * 100 + startD; if (rv < sv) continue;"
        elif end_date:
            date_check_js += " var ev = endY * 10000 + endM * 100 + endD; if (rv > ev) continue;"

    return f"""
ObjC.import("Foundation");
var outlook = Application("Microsoft Outlook");
var folder;

if ("{safe_folder}" === "inbox") {{
    folder = outlook.inbox;
}} else {{
    var allFolders = outlook.mailFolders();
    folder = null;
    for (var fi = 0; fi < allFolders.length; fi++) {{
        if (allFolders[fi].name() === "{safe_folder}") {{
            folder = allFolders[fi];
            break;
        }}
    }}
    if (!folder) throw new Error("Folder not found: {safe_folder}");
}}

{date_filter_js}

var messages = folder.messages();

var result = [];
var count = 0;
var skipped = 0;
for (var i = 0; i < messages.length && count < {safe_limit}; i++) {{
    var m = messages[i];
    try {{
        var recvTime = m.timeReceived().toString();
        {date_check_js}

        var subject    = m.subject()  || "";
        var senderObj  = m.sender();
        var senderName = senderObj ? (senderObj.name    || "") : "";
        var senderAddr = senderObj ? (senderObj.address || "") : "";
        var bodyText   = m.plainTextContent() || "";
        var msgId      = m.id().toString();

        result.push({{
            id:             msgId,
            subject:        subject,
            sender_name:    senderName,
            sender_address: senderAddr,
            received_time:  recvTime,
            body:           bodyText
        }});
        count++;
    }} catch(e) {{ skipped++; }}
}}

if (skipped > 0) {{
    ObjC.import("stdlib");
    $.system("echo 'Warning: " + skipped + " message(s) skipped due to read errors' >&2");
}}

JSON.stringify(result);
"""


def run_jxa(script: str) -> str:
    """Execute JXA script via osascript, return stdout."""
    try:
        result = subprocess.run(
            ["osascript", "-l", "JavaScript", "-e", script],
            capture_output=True,
            text=True,
            timeout=120,
        )
    except FileNotFoundError:
        print("Error: osascript not found. This tool requires macOS.", file=sys.stderr)
        sys.exit(1)

    if result.returncode != 0:
        stderr = result.stderr.strip()
        if "Application can't be found" in stderr or "not found" in stderr.lower():
            print("Error: Microsoft Outlook is not installed. This tool requires Outlook for macOS.", file=sys.stderr)
        else:
            print(f"Error: JXA execution failed: {stderr}", file=sys.stderr)
        sys.exit(1)
    return result.stdout.strip()


def filter_by_senders(emails: list[dict], senders: list[str]) -> list[dict]:
    """Filter emails by sender address list (case-insensitive)."""
    if not senders:
        return emails
    senders_lower = [s.lower().strip() for s in senders]
    return [
        e for e in emails
        if e.get("sender_address", "").lower() in senders_lower
    ]


def filter_by_keyword(emails: list[dict], keyword: str) -> list[dict]:
    """Filter emails by keyword in subject or body (case-insensitive)."""
    if not keyword:
        return emails
    kw = keyword.lower()
    return [
        e for e in emails
        if kw in e.get("subject", "").lower() or kw in e.get("body", "").lower()
    ]


def main():
    parser = argparse.ArgumentParser(
        description="Fetch emails from macOS Outlook and output as JSON"
    )
    parser.add_argument("--senders", type=str, default="",
                        help="Comma-separated sender email addresses (empty = all)")
    parser.add_argument("--keyword", type=str, default="",
                        help="Filter by subject/body keyword")
    parser.add_argument("--start-date", type=str, default=None,
                        help="Start date YYYY-MM-DD (filter by received time)")
    parser.add_argument("--end-date", type=str, default=None,
                        help="End date YYYY-MM-DD (filter by received time)")
    parser.add_argument("--folder", type=str, default="inbox",
                        help="Outlook folder name (default: inbox)")
    parser.add_argument("--limit", type=int, default=100,
                        help="Max emails to return (default: 100)")

    args = parser.parse_args()

    # Validate dates
    for date_str, label in [(args.start_date, "--start-date"), (args.end_date, "--end-date")]:
        if date_str:
            try:
                _validate_date(date_str)
            except ValueError:
                print(f"Error: {label} must be YYYY-MM-DD format, got: {date_str}", file=sys.stderr)
                sys.exit(1)

    # Fetch from Outlook
    script = build_jxa_script(args.folder, args.limit, args.start_date, args.end_date)
    raw = run_jxa(script)

    # Handle empty output
    if not raw:
        print("[]")
        return

    try:
        emails = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Error: Failed to parse Outlook response: {e}", file=sys.stderr)
        sys.exit(1)

    # Python-side filtering
    senders = [s.strip() for s in args.senders.split(",") if s.strip()] if args.senders else []
    emails = filter_by_senders(emails, senders)
    emails = filter_by_keyword(emails, args.keyword)

    # Output
    print(json.dumps(emails, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
