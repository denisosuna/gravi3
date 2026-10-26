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
    const minute = Math.floor(now / 60_000);
    const hour = Math.floor(now / 3_600_000);
    for (const [id, bucket] of this.buckets) if (bucket.hour < hour) this.buckets.delete(id);
    if (this.global.hour !== hour) this.global = { hour, count: 0 };
    const bucket = this.buckets.get(key) ?? { minute, minuteCount: 0, hour, hourCount: 0 };
    if (bucket.minute !== minute) {
      bucket.minute = minute;
      bucket.minuteCount = 0;
    }
    if (this.global.count >= this.limits.globalPerHour || bucket.hourCount >= this.limits.perHour)
      throw new LimitError(Math.ceil(((hour + 1) * 3_600_000 - now) / 1000));
    if (bucket.minuteCount >= this.limits.perMinute)
      throw new LimitError(Math.ceil(((minute + 1) * 60_000 - now) / 1000));
    if (
      this.active >= this.limits.concurrent ||
      (!this.buckets.has(key) && this.buckets.size >= (this.limits.maxKeys ?? 2000))
    )
      throw new LimitError(60);
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

  get size() {
    return this.buckets.size;
  }
}
