## Retry & Error Recovery

Agents MUST NOT invent ad-hoc retry logic. Use a consistent policy so failures are predictable, debuggable, and cost-controlled.

### 1) Classify failures before retrying

Before retrying, classify the error as:

- **Retryable (transient):** network timeouts, 429 rate limits, 5xx server errors, temporary DNS issues, lock contention, temporary service unavailability.
- **Non-retryable (permanent):** validation errors, 4xx (except 408/429), auth/permission errors, schema mismatch, missing required data, deterministic test failures.
  - **409 Conflict:** non-retryable by default. Retry ONLY for explicit transient conflict types (optimistic lock / ETag version mismatch) where the client will re-read state before retrying. Business conflicts (duplicate resource, state violation) are permanent — do not retry.
- **Unknown:** treat as non-retryable unless you can justify why it is transient.

If classification is unclear, STOP and surface the assumption (what you believe is transient and why).

### 2) Default retry policy (unless project overrides)

- **Max attempts:** 3 total (initial try + 2 retries)
- **Backoff:** exponential with jitter
  - wait = min(base \* 2^n + random(0..jitter), max\_backoff)
  - base = 500ms, jitter = 250ms, n starts at 0 (first retry waits ~500-750ms)
  - max\_backoff = 30s
- **Total retry deadline:** 60s (or caller-specified). After this elapsed time from the first attempt, stop retrying regardless of remaining attempts.
- **Rate limits (429):** respect `Retry-After` header if present.
  - `Retry-After` may be seconds (integer) or an HTTP-date. Parse both formats.
  - Cap at max\_retry\_after = 60s. If the server requests longer, treat as non-retryable and surface to the caller.
  - `Retry-After` takes precedence over calculated backoff when present.
- **Timeouts:** increase timeout only once (e.g., 1.5x) to avoid infinite slow retries.

Never retry in tight loops.

### 3) Idempotency and safety

Retry only if the operation is **idempotent** OR you provide an idempotency key / dedupe mechanism.

Examples:

- Safe to retry: GET/read-only queries, pure computations, re-fetching metadata, uploading with idempotency keys, creating records with unique keys.
- NOT safe to retry blindly: payments, order creation, irreversible mutations, emails/sends, deletions.

If the operation is not clearly idempotent, DO NOT retry — surface the risk and propose a safe alternative (idempotency key, transactional outbox, dedupe table).

### 4) Observability requirements

On each failed attempt, log structured context:

- operation name
- attempt number / max attempts
- error class (retryable/non-retryable/unknown)
- status code (if any) and relevant headers (e.g., Retry-After)
- elapsed time
- correlation/request id if available

Logs MUST NOT include secrets.

### 5) Escalation and fallback

After max attempts:

- Fail fast with a clear error message and suggested next action
- Prefer safe fallbacks (cached result, degraded mode, queue for later) over repeated retries

### 6) Circuit breaker

When a dependency fails repeatedly, stop calling it to avoid wasting resources and amplifying the failure.

- **Trip threshold:** after 5 consecutive failures to the same dependency, open the circuit (stop all calls).
- **Cooldown:** wait 30s before probing.
- **Probe:** send a single request after cooldown. If it succeeds, close the circuit and resume normal traffic. If it fails, re-open and reset the cooldown timer.
- Circuit breaker state (open/closed/half-open) should be observable via logs or metrics.

### 7) Retry budgets

Retries must not overwhelm a recovering dependency.

- Retries should not exceed 10-20% of total request volume to the same dependency.
- Track the retry ratio. If it exceeds the budget, fail fast without retrying.
- This prevents retry amplification during partial outages where every client retries simultaneously.

### 8) Distributed retry concerns

In multi-instance deployments, uncoordinated retries can cause cascading failures.

- **Jitter is mandatory**, not optional — sufficient randomization prevents thundering herd after outages.
- **Single retry owner:** pick one layer in the call stack to own retries. Never retry from multiple layers simultaneously (e.g., both the HTTP client and the service layer).
- **Coordinate when possible:** if retry policies are configurable, align them across service instances to avoid compounding retry storms.

### 9) Queue / async retry

For queue-based or background job retries:

- **Dead-letter queue:** after max attempts in a queue consumer, move the message to a dead-letter queue. Never silently drop failed messages.
- **Final failure logging:** log the final failure with full context (message ID, payload summary, all attempt errors) before dead-lettering.
- **Poison pill detection:** if the same message fails deterministically (e.g., deserialization error, schema mismatch), dead-letter immediately. Do not burn all retry attempts on a message that will never succeed.
- **Backoff between attempts:** use the same exponential backoff policy as synchronous retries. Avoid immediate redelivery.

### 10) Test expectations

If retry logic is added/changed:

- Add tests for: retryable vs non-retryable classification, max-attempt behavior, and idempotency safeguards.
- Test `Retry-After` precedence over calculated backoff.
- Test timeout increase behavior (1.5x applied only once).
- Test backoff + jitter bounds validation (wait never exceeds `max_backoff`).
- Test total retry deadline enforcement (retries stop after `max_total_retry_time`).
- Test 409 transient vs permanent conflict classification.
- Run existing test suite before and after changes.
