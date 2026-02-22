# Chat History Sessions

- **Status**: Confirmed
- **Created:** 2026-02-22
- **Last Updated:** 2026-02-22

## Confirmed Solution

Session-based localStorage with 50 session cap. Title = first 30 chars of first user message. "Clear All Data" wipes everything.

See full details in previous draft. Decisions:

- Max 50 sessions (oldest evicted on overflow)
- "Clear Data" → "Clear All Data" — clears all sessions + resets app
