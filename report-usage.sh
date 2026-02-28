#!/bin/bash
# Reports OpenClaw gateway token usage to Ranking of Claws
set -euo pipefail

API_URL="http://localhost:5013/api/report"
GATEWAY_ID=$(python3 -c "import hashlib,os; print(hashlib.sha256(f'{os.uname().nodename}-{os.environ.get(\"HOME\",\"\")}-openclaw'.encode()).hexdigest()[:16])")
STATE_FILE="$HOME/.openclaw/workspace/memory/roc-last-report.json"

# Get current usage
USAGE=$(openclaw gateway usage-cost 2>/dev/null | tail -1)
TODAY_TOKENS=$(echo "$USAGE" | grep -oP '[\d.]+m tokens' | grep -oP '[\d.]+' | head -1)

if [ -z "$TODAY_TOKENS" ]; then
  exit 0
fi

# Convert to integer (multiply by 1M)
TOKENS_INT=$(python3 -c "print(int(float('$TODAY_TOKENS') * 1000000))")

# Read last reported value
LAST_TOKENS=0
if [ -f "$STATE_FILE" ]; then
  LAST_TOKENS=$(python3 -c "import json; print(json.load(open('$STATE_FILE')).get('last_tokens', 0))" 2>/dev/null || echo 0)
fi

# Calculate delta
DELTA=$((TOKENS_INT - LAST_TOKENS))
if [ "$DELTA" -le 0 ]; then
  exit 0
fi

DELTA_IN=$((DELTA * 40 / 100))
DELTA_OUT=$((DELTA * 60 / 100))

# Report
curl -sf -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"gateway_id\": \"$GATEWAY_ID\",
    \"agent_name\": \"Pika\",
    \"country\": \"CH\",
    \"tokens_delta\": $DELTA,
    \"tokens_in_delta\": $DELTA_IN,
    \"tokens_out_delta\": $DELTA_OUT,
    \"model\": \"anthropic/claude-opus-4\"
  }" > /dev/null

# Save state
echo "{\"last_tokens\": $TOKENS_INT, \"last_report\": \"$(date -Iseconds)\"}" > "$STATE_FILE"
