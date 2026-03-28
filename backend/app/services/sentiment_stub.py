"""Lightweight placeholder sentiment until a real model is wired."""

_POS = frozenset(
    "beat growth strong profit win upgrade outlook gain rally recovery success".split()
)
_NEG = frozenset(
    "lawsuit SEC fine miss layoff warning decline debt probe crash loss cut".split()
)


def score_headline(title: str) -> float:
    t = title.lower()
    p = sum(1 for w in _POS if w in t)
    n = sum(1 for w in _NEG if w in t)
    if p == n == 0:
        return 0.0
    return max(-1.0, min(1.0, (p - n) * 0.25))


def aggregate_sentiment(titles: list[str]) -> tuple[float, str]:
    if not titles:
        return 0.0, "neutral"
    scores = [score_headline(x) for x in titles]
    avg = sum(scores) / len(scores)
    if avg > 0.15:
        label = "positive"
    elif avg < -0.15:
        label = "negative"
    else:
        label = "neutral"
    return round(avg, 3), label
