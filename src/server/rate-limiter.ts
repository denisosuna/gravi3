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

  acquire(key: string, now = Date.now()) {
    const minute = Math.floor(now / MINUTE_MS);
    const hour = Math.floor(now / HOUR_MS);
    this.expire(hour);
    const bucket = this.bucketFor(key, minute, hour);
    this.assertWithinLimits(key, bucket, now);
    bucket.minuteCount++;
    bucket.hourCount++;
    this.global.count++;
    this.active++;
    this.buckets.set(key, bucket);
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

  private assertWithinLimits(key: string, bucket: Bucket, now: number) {
    const secondsUntil = (windowEnd: number) => Math.ceil((windowEnd - now) / 1000);
    if (this.global.count >= this.limits.globalPerHour || bucket.hourCount >= this.limits.perHour)
      throw new LimitError(secondsUntil((bucket.hour + 1) * HOUR_MS));
    if (bucket.minuteCount >= this.limits.perMinute)
      throw new LimitError(secondsUntil((bucket.minute + 1) * MINUTE_MS));
    const isNewKey = !this.buckets.has(key);
    const maxKeys = this.limits.maxKeys ?? DEFAULT_MAX_KEYS;
    if (this.active >= this.limits.concurrent || (isNewKey && this.buckets.size >= maxKeys))
      throw new LimitError(CONCURRENCY_RETRY_AFTER_SECONDS);
  }

  get size() {
    return this.buckets.size;
  }
}
