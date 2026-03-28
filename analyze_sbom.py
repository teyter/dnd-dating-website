#!/usr/bin/env python3
"""
SBOM Supply Chain Analysis Tool
Analyses components for A03 Software Supply Chain Failures:
  - Necessity, Known vulnerabilities, Maintenance, Source trust
Supports snapshots for comparing versions over time.
"""

import json, os, subprocess, sys, time, argparse, platform
from datetime import datetime, timezone
from typing import Dict, List, Optional

# On Windows, npm is a .cmd script and needs shell=True to be found
IS_WINDOWS = platform.system() == 'Windows'
NPM = 'npm.cmd' if IS_WINDOWS else 'npm'

SBOM_FILE    = 'sbom.json'
PACKAGE_FILE = 'package.json'
OUTPUT_FILE  = 'supply_chain_analysis.md'
SNAPSHOT_DIR = 'snapshots'

_pkg_cache: Dict = {}

# ── Helpers ───────────────────────────────────────────────────────────────────

def read_json(path: str) -> Dict:
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: '{path}' not found.", file=sys.stderr); sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: bad JSON in {path}: {e}", file=sys.stderr); sys.exit(1)

def days_since(date_str: str) -> Optional[int]:
    try:
        d = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return (datetime.now(timezone.utc) - d).days
    except Exception:
        return None

# ── Data fetching ─────────────────────────────────────────────────────────────

def get_vulnerabilities() -> Dict:
    """
    npm audit exits with code 1 when vulnerabilities exist — that's normal.
    We parse stdout regardless of exit code.
    """
    try:
        r = subprocess.run(
            [NPM, 'audit', '--json'],
            capture_output=True, text=True, timeout=60, shell=IS_WINDOWS
        )
        # Use stdout even on non-zero exit (audit found vulns)
        raw = r.stdout or r.stderr
        data = json.loads(raw)
    except Exception as e:
        print(f"Warning: npm audit failed ({e})", file=sys.stderr)
        return {}

    vulns: Dict[str, List[Dict]] = {}
    for name, details in data.get('vulnerabilities', {}).items():
        fix = details.get('fixAvailable', False)
        if isinstance(fix, dict):
            fix = True
        entries = [
            {
                'severity':      via.get('severity', details.get('severity', 'unknown')),
                'title':         via.get('title', ''),
                'url':           via.get('url', ''),
                'fix_available': fix,
            }
            for via in details.get('via', [])
            if isinstance(via, dict)
        ]
        if entries:
            vulns[name] = entries
    return vulns

def get_metadata(name: str) -> Dict:
    if name in _pkg_cache:
        return _pkg_cache[name]
    try:
        r = subprocess.run(
            [NPM, 'view', name, '--json'],
            capture_output=True, text=True, timeout=15, shell=IS_WINDOWS
        )
        if r.returncode == 0 and r.stdout.strip():
            _pkg_cache[name] = json.loads(r.stdout)
            return _pkg_cache[name]
    except Exception:
        pass
    time.sleep(0.05)
    return {}

# ── Analysis ──────────────────────────────────────────────────────────────────

SEVERITY_ORDER = ['critical', 'high', 'moderate', 'low']

def max_severity(vulns: List[Dict]) -> str:
    found = {v['severity'] for v in vulns}
    for s in SEVERITY_ORDER:
        if s in found:
            return s
    return 'none'

def analyze(sbom: Dict, pkg_json: Dict) -> List[Dict]:
    components  = sbom.get('components', [])
    direct_deps = set(pkg_json.get('dependencies', {}).keys()) | \
                  set(pkg_json.get('devDependencies', {}).keys())
    advisories  = get_vulnerabilities()
    results     = []

    print(f"Analysing {len(components)} components...")
    for i, comp in enumerate(components, 1):
        name, version = comp.get('name'), comp.get('version')
        if not name or not version:
            continue
        if i % 50 == 0:
            print(f"  {i}/{len(components)}...")

        vulns   = advisories.get(name, [])   # exact match — no false positives
        max_sev = max_severity(vulns)

        meta     = get_metadata(name)
        modified = meta.get('time', {}).get('modified') or meta.get('time', {}).get('created')
        d        = days_since(modified) if modified else None
        if d is None:
            maint = 'Unknown'
        elif d > 365:
            maint = f'Stale ({d}d)'
        elif d > 180:
            maint = f'Moderate ({d}d)'
        else:
            maint = f'Active ({d}d)'
        if meta.get('deprecated'):
            maint += ' [DEPRECATED]'

        purl  = comp.get('purl', '')
        trust = 'Official npm' if 'pkg:npm/' in purl else f'Unknown ({purl})'

        results.append({
            'name':    name,
            'version': version,
            'direct':  name in direct_deps,
            'vulns':   vulns,
            'max_sev': max_sev,
            'maint':   maint,
            'trust':   trust,
        })

    return results

# ── Snapshots ─────────────────────────────────────────────────────────────────

def save_snapshot(results: List[Dict], label: str = '') -> str:
    os.makedirs(SNAPSHOT_DIR, exist_ok=True)
    ts   = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    name = f"{SNAPSHOT_DIR}/snapshot_{ts}{'_' + label.replace(' ','_') if label else ''}.json"
    with open(name, 'w', encoding='utf-8') as f:
        json.dump({'label': label or ts, 'results': results}, f, indent=2)
    print(f"Snapshot saved: {name}")
    return name

def load_snapshot(path: str) -> Dict:
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading snapshot: {e}", file=sys.stderr); sys.exit(1)

def compare(old: Dict, new_results: List[Dict], new_label: str) -> Dict:
    rank    = {s: i for i, s in enumerate(['critical', 'high', 'moderate', 'low', 'none'])}
    old_map = {r['name']: r for r in old.get('results', [])}
    new_map = {r['name']: r for r in new_results}
    old_names, new_names = set(old_map), set(new_map)

    sev_up, sev_down, ver_changed = [], [], []
    for name in sorted(old_names & new_names):
        o, n = old_map[name], new_map[name]
        if o['version'] != n['version']:
            ver_changed.append({'name': name, 'old': o['version'], 'new': n['version']})
        or_, nr_ = rank.get(o['max_sev'], 4), rank.get(n['max_sev'], 4)
        if nr_ < or_:
            sev_up.append({'name': name, 'old': o['max_sev'], 'new': n['max_sev']})
        elif nr_ > or_:
            sev_down.append({'name': name, 'old': o['max_sev'], 'new': n['max_sev']})

    return {
        'old_label':   old.get('label', '?'),
        'new_label':   new_label,
        'added':       [new_map[n] for n in sorted(new_names - old_names)],
        'removed':     [old_map[n] for n in sorted(old_names - new_names)],
        'sev_up':      sev_up,
        'sev_down':    sev_down,
        'ver_changed': ver_changed,
    }

# ── Report ────────────────────────────────────────────────────────────────────

def T(s: str, n: int) -> str:
    return s[:n] + '…' if len(s) > n else s

def report(results: List[Dict], diff: Optional[Dict] = None):
    rank = {'critical': 0, 'high': 1, 'moderate': 2, 'low': 3, 'none': 4}
    rs   = sorted(results, key=lambda r: rank.get(r['max_sev'], 4))

    total   = len(results)
    direct  = sum(1 for r in results if r['direct'])
    vuln_ct = sum(1 for r in results if r['vulns'])
    crit    = sum(1 for r in results if r['max_sev'] == 'critical')
    high    = sum(1 for r in results if r['max_sev'] == 'high')
    depr    = sum(1 for r in results if 'DEPRECATED' in r['maint'])
    stale   = sum(1 for r in results if 'Stale' in r['maint'])

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("# Software Supply Chain Analysis Report\n\n")
        f.write(f"**Generated**: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n\n")

        f.write("## Executive Summary\n\n")
        f.write("| Metric | Count |\n|--------|-------|\n")
        f.write(f"| Total components | {total} |\n")
        f.write(f"| Direct dependencies | {direct} |\n")
        f.write(f"| Transitive dependencies | {total - direct} |\n")
        f.write(f"| Vulnerable components | {vuln_ct} |\n")
        f.write(f"| Critical severity | {crit} |\n")
        f.write(f"| High severity | {high} |\n")
        f.write(f"| Deprecated packages | {depr} |\n")
        f.write(f"| Stale packages (>1 yr) | {stale} |\n\n")

        # ── Comparison ────────────────────────────────────────────────────────
        if diff:
            f.write(f"## Changes: {diff['old_label']} → {diff['new_label']}\n\n")
            if diff['added']:
                f.write("### Added\n\n| Package | Version | Severity |\n|---------|---------|----------|\n")
                for p in diff['added']:
                    f.write(f"| {p['name']} | {p['version']} | {p['max_sev']} |\n")
                f.write("\n")
            if diff['removed']:
                f.write("### Removed\n\n| Package | Version |\n|---------|--------|\n")
                for p in diff['removed']:
                    f.write(f"| {p['name']} | {p['version']} |\n")
                f.write("\n")
            if diff['sev_up']:
                f.write("### Severity Worsened\n\n| Package | Was | Now |\n|---------|-----|-----|\n")
                for p in diff['sev_up']:
                    f.write(f"| {p['name']} | {p['old']} | **{p['new']}** |\n")
                f.write("\n")
            if diff['sev_down']:
                f.write("### Severity Improved\n\n| Package | Was | Now |\n|---------|-----|-----|\n")
                for p in diff['sev_down']:
                    f.write(f"| {p['name']} | {p['old']} | {p['new']} |\n")
                f.write("\n")
            if diff['ver_changed']:
                f.write("### Version Changed\n\n| Package | Old | New |\n|---------|-----|-----|\n")
                for p in diff['ver_changed']:
                    f.write(f"| {p['name']} | {p['old']} | {p['new']} |\n")
                f.write("\n")
            if not any(diff[k] for k in ['added', 'removed', 'sev_up', 'sev_down', 'ver_changed']):
                f.write("No changes detected.\n\n")

        # ── Component Table ───────────────────────────────────────────────────
        f.write("## All Components\n\n")
        f.write("| Component | Version | Severity | Type | Maintenance | Source |\n")
        f.write("|-----------|---------|----------|------|-------------|--------|\n")
        for r in rs:
            kind = 'Direct' if r['direct'] else 'Transitive'
            f.write(f"| {T(r['name'],28)} | {T(r['version'],12)} | {r['max_sev']} | {kind} | {T(r['maint'],25)} | {T(r['trust'],20)} |\n")
        f.write("\n")

        # ── Vulnerability Details ─────────────────────────────────────────────
        vuln_comps = [r for r in rs if r['vulns']]
        if vuln_comps:
            f.write("## Vulnerability Details\n\n")
            for r in vuln_comps:
                f.write(f"### {r['name']}@{r['version']}\n\n")
                f.write(f"- **Type**: {'Direct' if r['direct'] else 'Transitive'}\n")
                f.write(f"- **Maintenance**: {r['maint']}\n\n")
                for v in r['vulns']:
                    fix = 'Yes' if v['fix_available'] else 'No'
                    f.write(f"- **{v['severity'].upper()}**: {v['title']}\n")
                    if v['url']:
                        f.write(f"  - Advisory: {v['url']}\n")
                    f.write(f"  - Fix available: {fix}\n")
                f.write("\n")

        # ── Maintenance Concerns ──────────────────────────────────────────────
        issues = [r for r in results if 'DEPRECATED' in r['maint'] or 'Stale' in r['maint']]
        if issues:
            f.write("## Maintenance Concerns\n\n")
            f.write("| Package | Version | Issue |\n|---------|---------|-------|\n")
            for r in issues:
                issue = 'Deprecated' if 'DEPRECATED' in r['maint'] else 'Stale'
                f.write(f"| {r['name']} | {r['version']} | {issue} |\n")
            f.write("\n")

        # ── Recommendations ───────────────────────────────────────────────────
        f.write("## Recommendations\n\n")
        if crit or high:
            f.write("**Immediate**: Run `npm audit fix` (or `--force` for breaking changes).\n\n")
        if depr:
            f.write("**Deprecated packages**: Find and migrate to maintained alternatives.\n\n")
        f.write("**Ongoing**: Integrate `npm audit` into CI/CD and monitor with Dependabot or Snyk.\n\n")

    print(f"Report saved: {OUTPUT_FILE}")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description='SBOM Supply Chain Analysis Tool')
    p.add_argument('--compare', metavar='SNAPSHOT', help='Previous snapshot to diff against')
    p.add_argument('--label',   default='',          help='Label for this snapshot')
    p.add_argument('--list',    action='store_true',  help='List saved snapshots and exit')
    p.add_argument('--no-save', action='store_true',  help='Skip saving a snapshot')
    args = p.parse_args()

    if args.list:
        snaps = sorted(f for f in os.listdir(SNAPSHOT_DIR) if f.endswith('.json')) \
                if os.path.isdir(SNAPSHOT_DIR) else []
        print('\n'.join(snaps) if snaps else 'No snapshots found.')
        return

    print("Result of our Supply Chain Analysis\n")
    sbom     = read_json(SBOM_FILE)
    pkg_json = read_json(PACKAGE_FILE)
    results  = analyze(sbom, pkg_json)

    label = args.label or datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    diff  = None
    if args.compare:
        old  = load_snapshot(args.compare)
        diff = compare(old, results, label)

    report(results, diff)

    if not args.no_save:
        save_snapshot(results, args.label)

    print(f"\nTotal: {len(results)}  |  "
          f"Vulnerable: {sum(1 for r in results if r['vulns'])}  |  "
          f"Critical: {sum(1 for r in results if r['max_sev']=='critical')}  |  "
          f"High: {sum(1 for r in results if r['max_sev']=='high')}")

if __name__ == '__main__':
    main()