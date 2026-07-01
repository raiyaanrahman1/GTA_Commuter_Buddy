from cachetools import TTLCache

class SlidingTTLCache[K, V](TTLCache):
    def __getitem__(self, key: K) -> V:
        value = super().__getitem__(key)
        # Re-insert it to reset the TTL timer and update its place in the eviction queue
        super().__setitem__(key, value)
        return value