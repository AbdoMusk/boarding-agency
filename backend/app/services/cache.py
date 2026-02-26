"""
Simple caching layer to avoid redundant LLM calls.
Supports three strategies: "memory", "file" (default), and "redis".

Cache key = SHA-256 of the input bytes/text, so identical content always
hits the cache regardless of filename.
"""
import hashlib
import json
import os
import time
from pathlib import Path


class _MemoryCache:
    def __init__(self, ttl: int = 86400):
        self._store: dict = {}
        self._ttl = ttl

    def _key(self, raw: str) -> str:
        return hashlib.sha256(raw.encode()).hexdigest()

    def get(self, raw: str):
        k = self._key(raw)
        entry = self._store.get(k)
        if entry and (time.time() - entry["ts"] < self._ttl):
            return entry["value"]
        return None

    def set(self, raw: str, value):
        self._store[self._key(raw)] = {"value": value, "ts": time.time()}

    def invalidate(self, raw: str):
        self._store.pop(self._key(raw), None)

    def clear(self):
        self._store.clear()


class _FileCache:
    def __init__(self, cache_dir: str = "cache", ttl: int = 86400):
        self._dir = Path(cache_dir)
        self._dir.mkdir(parents=True, exist_ok=True)
        self._ttl = ttl

    def _path(self, raw: str) -> Path:
        key = hashlib.sha256(raw.encode()).hexdigest()
        return self._dir / f"{key}.json"

    def get(self, raw: str):
        p = self._path(raw)
        if not p.exists():
            return None
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            if time.time() - data.get("ts", 0) < self._ttl:
                return data["value"]
            p.unlink(missing_ok=True)
        except Exception:
            pass
        return None

    def set(self, raw: str, value):
        p = self._path(raw)
        p.write_text(
            json.dumps({"value": value, "ts": time.time()}, ensure_ascii=False),
            encoding="utf-8",
        )

    def invalidate(self, raw: str):
        self._path(raw).unlink(missing_ok=True)

    def clear(self):
        for f in self._dir.glob("*.json"):
            f.unlink(missing_ok=True)


class _RedisCache:
    def __init__(self, redis_url: str, ttl: int = 86400):
        import redis  # optional dependency
        self._r = redis.from_url(redis_url, decode_responses=True)
        self._ttl = ttl

    def _key(self, raw: str) -> str:
        return "boarding:llm:" + hashlib.sha256(raw.encode()).hexdigest()

    def get(self, raw: str):
        raw_data = self._r.get(self._key(raw))
        if raw_data:
            return json.loads(raw_data)
        return None

    def set(self, raw: str, value):
        self._r.setex(self._key(raw), self._ttl, json.dumps(value, ensure_ascii=False))

    def invalidate(self, raw: str):
        self._r.delete(self._key(raw))

    def clear(self):
        for k in self._r.scan_iter("boarding:llm:*"):
            self._r.delete(k)


# ─── Singleton ────────────────────────────────────────────────────────────────
_cache_instance = None


def get_cache():
    global _cache_instance
    if _cache_instance is not None:
        return _cache_instance

    from app.config import ACTIVE_CONFIG as cfg

    strategy = (cfg.CACHE_STRATEGY or "file").lower()
    ttl = cfg.CACHE_TTL_SECONDS

    if strategy == "memory":
        _cache_instance = _MemoryCache(ttl=ttl)
    elif strategy == "redis":
        try:
            _cache_instance = _RedisCache(redis_url=cfg.REDIS_URL, ttl=ttl)
        except Exception:
            # Fall back to file cache if Redis isn't available
            _cache_instance = _FileCache(cache_dir=cfg.CACHE_DIR, ttl=ttl)
    else:  # "file" (default)
        _cache_instance = _FileCache(cache_dir=cfg.CACHE_DIR, ttl=ttl)

    return _cache_instance


def cached_llm_call(key_data: str, fn):
    """
    Thin wrapper:  result = cached_llm_call(cache_key, lambda: provider.generate(prompt))
    """
    cache = get_cache()
    cached = cache.get(key_data)
    if cached is not None:
        return cached, True  # (value, from_cache)
    result = fn()
    cache.set(key_data, result)
    return result, False
