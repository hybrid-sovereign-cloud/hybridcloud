#!/usr/bin/env bash
# Verify ArgoCD Application sync and health status.
# Usage:
#   ./verify-sync.sh [--context <oc-context>] [--namespace openshift-gitops] [--exclude <pattern>]
set -euo pipefail

OC_CONTEXT=""
ARGOCD_NS="openshift-gitops"
EXCLUDE_PATTERN=""
FAIL_ON_DEGRADED=true

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  --context <name>     oc context (default: current)
  --namespace <ns>     ArgoCD namespace (default: openshift-gitops)
  --exclude <regex>    Skip apps matching regex (e.g. 'aws')
  --allow-degraded     Do not fail on Degraded health (warn only)
  -h, --help           Show this help

Exit codes:
  0  All non-excluded Applications Synced + Healthy
  1  One or more Applications failed gate
  2  Prerequisites missing (oc not found, no apps)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --context) OC_CONTEXT="$2"; shift 2 ;;
    --namespace) ARGOCD_NS="$2"; shift 2 ;;
    --exclude) EXCLUDE_PATTERN="$2"; shift 2 ;;
    --allow-degraded) FAIL_ON_DEGRADED=false; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 2 ;;
  esac
done

if ! command -v oc &>/dev/null; then
  echo "ERROR: oc CLI not found" >&2
  exit 2
fi
if ! command -v jq &>/dev/null; then
  echo "ERROR: jq not found" >&2
  exit 2
fi

OC_OPTS=()
[[ -n "$OC_CONTEXT" ]] && OC_OPTS+=(--context="$OC_CONTEXT")

echo "ArgoCD Sync Verification"
echo "Namespace: ${ARGOCD_NS}"
[[ -n "$OC_CONTEXT" ]] && echo "Context:   ${OC_CONTEXT}"
echo "Time:      $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

APPS_JSON="$(oc "${OC_OPTS[@]}" get applications -n "$ARGOCD_NS" -o json 2>/dev/null || echo '{"items":[]}')"

COUNT="$(echo "$APPS_JSON" | jq '.items | length')"
if [[ "$COUNT" -eq 0 ]]; then
  echo "ERROR: no ArgoCD Applications found in ${ARGOCD_NS}" >&2
  exit 2
fi

PASS=0
FAIL=0
SKIP=0

echo "Application                          Sync       Health     Result"
echo "────────────────────────────────────────────────────────────────────"

while IFS=$'\t' read -r name sync health; do
  result="PASS"
  if [[ -n "$EXCLUDE_PATTERN" && "$name" =~ $EXCLUDE_PATTERN ]]; then
    result="SKIP"
    SKIP=$((SKIP + 1))
  elif [[ "$name" == "base-config-chart" || "$name" == "base-configs" ]]; then
    result="SKIP"
    SKIP=$((SKIP + 1))
  elif [[ "$sync" != "Synced" ]]; then
    result="FAIL"
    FAIL=$((FAIL + 1))
  elif [[ "$health" != "Healthy" ]]; then
    if [[ "$FAIL_ON_DEGRADED" == true ]]; then
      result="FAIL"
      FAIL=$((FAIL + 1))
    else
      result="WARN"
      PASS=$((PASS + 1))
    fi
  else
    PASS=$((PASS + 1))
  fi
  printf "%-36s %-10s %-10s %s\n" "$name" "$sync" "$health" "$result"
done < <(
  echo "$APPS_JSON" | jq -r '.items[] |
    [
      .metadata.name,
      (.status.sync.status // "Unknown"),
      (.status.health.status // "Unknown")
    ] | @tsv' | sort
)

echo ""
echo "────────────────────────────────────────"
echo "Summary: PASS=${PASS}  FAIL=${FAIL}  SKIP=${SKIP}  TOTAL=${COUNT}"
echo "────────────────────────────────────────"

if [[ ${FAIL} -gt 0 ]]; then
  echo ""
  echo "Failed applications — trigger hard refresh:"
  echo "$APPS_JSON" | jq -r --argjson fail "$FAIL" '
    .items[] |
    select(
      (.status.sync.status // "Unknown") != "Synced" or
      (.status.health.status // "Unknown") != "Healthy"
    ) |
    "  oc annotate application \(.metadata.name) -n '"${ARGOCD_NS}"' argocd.argoproj.io/refresh=hard --overwrite"' 2>/dev/null || true
  echo "$APPS_JSON" | jq -r '
    .items[] |
    select(
      (.status.sync.status // "Unknown") != "Synced" or
      (.status.health.status // "Unknown") != "Healthy"
    ) |
    "  oc annotate application \(.metadata.name) -n '"${ARGOCD_NS}"' argocd.argoproj.io/refresh=hard --overwrite"
  echo ""
  echo "Result: FAIL"
  exit 1
fi

echo "Result: PASS — all gated Applications Synced/Healthy"
exit 0
