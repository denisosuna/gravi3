const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DEFAULT_MAX_KEYS = 2000;
const CONCURRENCY_RETRY_AFTER_SECONDS = 60;

interface Limits {
  perMinute: number;
  perHour: number;
  globalPerHour: number;
  concurrent: number;
  maxKeys?: number;
}
interface Bucket {
  minute: number;
  minuteCount: number;
  hour: number;
  hourCount: number;
}

const secondsUntil = (windowEnd: number, now: number) => Math.ceil((windowEnd - now) / 1000);

export class LimitError extends Error {
  constructor(readonly retryAfter: number) {
    super('Tutor request limit reached.');
  }
}

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private global = { hour: -1, count: 0 };
  private active = 0;
  constructor(private limits: Limits) {}

  // Clients without a trustworthy key only count against the global and concurrency limits,
  // so one anonymous user cannot exhaust a per-client quota shared by everyone.
  acquire(key: string | undefined, now = Date.now()) {
    const minute = Math.floor(now / MINUTE_MS);
    const hour = Math.floor(now / HOUR_MS);
    this.expire(hour);
    const bucket = key === undefined ? undefined : this.bucketFor(key, minute, hour);
    this.assertGlobalLimits(now, hour);
    if (key !== undefined && bucket) {
      this.assertClientLimits(key, bucket, now);
      bucket.minuteCount++;
      bucket.hourCount++;
      this.buckets.set(key, bucket);
    }
    this.global.count++;
    this.active++;
    let released = false;
    return () => {
      if (!released) {
        this.active--;
        released = true;
      }
    };
  }

  private expire(hour: number) {
    for (const [id, bucket] of this.buckets) if (bucket.hour < hour) this.buckets.delete(id);
    if (this.global.hour !== hour) this.global = { hour, count: 0 };
  }

  private bucketFor(key: string, minute: number, hour: number): Bucket {
    const bucket = this.buckets.get(key) ?? { minute, minuteCount: 0, hour, hourCount: 0 };
    if (bucket.minute !== minute) {
      bucket.minute = minute;
      bucket.minuteCount = 0;
    }
    return bucket;
  }

  private assertGlobalLimits(now: number, hour: number) {
    if (this.global.count >= this.limits.globalPerHour)
      throw new LimitError(secondsUntil((hour + 1) * HOUR_MS, now));
    if (this.active >= this.limits.concurrent)
      throw new LimitError(CONCURRENCY_RETRY_AFTER_SECONDS);
  }

  private assertClientLimits(key: string, bucket: Bucket, now: number) {
    if (bucket.hourCount >= this.limits.perHour)
      throw new LimitError(secondsUntil((bucket.hour + 1) * HOUR_MS, now));
    if (bucket.minuteCount >= this.limits.perMinute)
      throw new LimitError(secondsUntil((bucket.minute + 1) * MINUTE_MS, now));
    const maxKeys = this.limits.maxKeys ?? DEFAULT_MAX_KEYS;
    if (!this.buckets.has(key) && this.buckets.size >= maxKeys)
      throw new LimitError(CONCURRENCY_RETRY_AFTER_SECONDS);
  }

  get size() {
    return this.buckets.size;
  }
}
