import math
import random
import shutil
import struct
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

SR = 22050
TAU = math.pi * 2


def n(sec):
    return int(sec * SR)


def rng_for(name):
    return random.Random(sum(ord(c) * (i + 3) for i, c in enumerate(name)))


def noise(count, rng):
    return [rng.uniform(-1.0, 1.0) for _ in range(count)]


def lp(x, fc):
    out = []
    y = 0.0
    for i, v in enumerate(x):
        f = fc(i / SR) if callable(fc) else fc
        a = 1.0 - math.exp(-TAU * max(f, 5.0) / SR)
        y += a * (v - y)
        out.append(y)
    return out


def hp(x, fc):
    low = lp(x, fc)
    return [a - b for a, b in zip(x, low)]


def bp(x, f_lo, f_hi):
    return lp(hp(x, f_lo), f_hi)


def sweep(count, f0, f1, shape=1.0, wave_fn=None):
    out = []
    phase = 0.0
    for i in range(count):
        t = i / max(count - 1, 1)
        f = f0 + (f1 - f0) * (t ** shape)
        phase = (phase + f / SR) % 1.0
        if wave_fn is None:
            out.append(math.sin(TAU * phase))
        else:
            out.append(wave_fn(phase))
    return out


def saw(p):
    return 2.0 * p - 1.0


def tone(count, freq, wave_fn=None):
    return sweep(count, freq, freq, 1.0, wave_fn)


def env(count, attack, tau, hold=0.0):
    out = []
    a = max(int(attack * SR), 1)
    h = int(hold * SR)
    for i in range(count):
        if i < a:
            out.append(i / a)
        elif i < a + h:
            out.append(1.0)
        else:
            out.append(math.exp(-(i - a - h) / (tau * SR)))
    return out


def swell(count, peak_at):
    out = []
    p = max(int(count * peak_at), 1)
    for i in range(count):
        if i < p:
            out.append((i / p) ** 2)
        else:
            out.append(max(0.0, 1.0 - (i - p) / max(count - p, 1)))
    return out


def reverse_swell(count):
    return [(i / count) ** 3 for i in range(count)]


def mul(x, e):
    return [a * b for a, b in zip(x, e)]


def mix(*parts):
    length = max(len(p[0]) for p in parts)
    out = [0.0] * length
    for samples, gain in parts:
        for i, v in enumerate(samples):
            out[i] += v * gain
    return out


def pad(x, count):
    if len(x) >= count:
        return x[:count]
    return x + [0.0] * (count - len(x))


def delay_line(x, taps):
    length = len(x) + max(int(d * SR) for d, g in taps)
    out = [0.0] * length
    for i, v in enumerate(x):
        out[i] += v
    for d, g in taps:
        o = int(d * SR)
        for i, v in enumerate(x):
            out[i + o] += v * g
    return out


def crackle(count, rng, density, decay):
    out = [0.0] * count
    y = 0.0
    for i in range(count):
        if rng.random() < density:
            y += rng.uniform(-1.0, 1.0)
        y *= decay
        out[i] = y
    return out


def finish(x, peak=0.9):
    m = max(max(abs(v) for v in x), 1e-9)
    x = [v / m * peak for v in x]
    f = int(0.004 * SR)
    for i in range(min(f, len(x))):
        k = i / f
        x[i] *= k
        x[-1 - i] *= k
    return x


def sweep_fc(f0, f1, dur):
    return lambda t: f0 + (f1 - f0) * min(t / dur, 1.0)


def aero_charge(r):
    c = n(0.28)
    w = bp(noise(c, r), 300, 2500)
    w = lp(w, sweep_fc(500, 2200, 0.28))
    return mix((mul(w, env(c, 0.03, 0.12)), 1.0), (mul(sweep(c, 600, 1100), env(c, 0.04, 0.1)), 0.15))


def aero_burst(r):
    c = n(0.9)
    w = lp(noise(c, r), sweep_fc(300, 3200, 0.5))
    a = mul(w, swell(c, 0.55))
    t = mul(sweep(c, 440, 880, 1.5), swell(c, 0.55))
    trem = [0.7 + 0.3 * math.sin(TAU * 9 * i / SR) for i in range(c)]
    return delay_line(mix((a, 1.0), (mul(t, trem), 0.18)), [(0.09, 0.3), (0.19, 0.18)])


def aero_launch(r):
    c = n(0.7)
    w = lp(noise(c, r), sweep_fc(3500, 500, 0.7))
    w = mul(w, [min(i / n(0.12), 1.0) * math.exp(-i / n(0.35)) for i in range(c)])
    thump = mul(sweep(c, 130, 55, 0.5), env(c, 0.004, 0.09))
    return mix((w, 1.0), (thump, 0.6))


def aero_impact(r):
    c = n(1.4)
    w = lp(noise(c, r), sweep_fc(4200, 300, 1.2))
    w = mul(w, env(c, 0.005, 0.28))
    thump = mul(sweep(c, 95, 38, 0.4), env(c, 0.004, 0.22))
    return delay_line(mix((w, 1.0), (thump, 0.8)), [(0.12, 0.28), (0.27, 0.16)])


def blaze_charge(r):
    c = n(0.28)
    k = crackle(c, r, 0.035, 0.82)
    low = mul(tone(c, 110), [0.5 + 0.5 * math.sin(TAU * 22 * i / SR) for i in range(c)])
    return mix((mul(k, env(c, 0.01, 0.14)), 0.9), (mul(low, env(c, 0.03, 0.14)), 0.35))


def blaze_burst(r):
    c = n(0.9)
    w = lp(noise(c, r), sweep_fc(200, 1800, 0.6))
    a = mul(w, swell(c, 0.7))
    t = mul(sweep(c, 80, 170, 1.4), swell(c, 0.7))
    k = mul(crackle(c, r, 0.03, 0.85), swell(c, 0.7))
    whump = [0.0] * c
    s = int(c * 0.72)
    for i in range(c - s):
        whump[s + i] = math.sin(TAU * 60 * i / SR) * math.exp(-i / (0.12 * SR))
    return delay_line(mix((a, 0.8), (t, 0.4), (k, 0.5), (whump, 0.9)), [(0.1, 0.25)])


def blaze_launch(r):
    c = n(0.7)
    w = lp(noise(c, r), sweep_fc(2600, 400, 0.7))
    w = mul(w, [min(i / n(0.05), 1.0) * math.exp(-i / n(0.3)) for i in range(c)])
    boom = mul(sweep(c, 210, 60, 0.5), env(c, 0.004, 0.14))
    k = mul(crackle(c, r, 0.04, 0.85), env(c, 0.01, 0.3))
    return mix((w, 0.9), (boom, 0.7), (k, 0.5))


def blaze_impact(r):
    c = n(1.5)
    w = lp(noise(c, r), lambda t: 200 + 3200 * math.exp(-t / 0.18))
    w = mul(w, env(c, 0.004, 0.32))
    boom = mul(sweep(c, 72, 28, 0.45), env(c, 0.004, 0.3))
    k = mul(crackle(c, r, 0.05, 0.86), env(c, 0.2, 0.45))
    return delay_line(mix((w, 1.0), (boom, 0.9), (k, 0.45)), [(0.13, 0.3), (0.29, 0.18)])


def frost_charge(r):
    c = n(0.3)
    parts = []
    for f, g in ((1800, 1.0), (2430, 0.6), (3150, 0.4)):
        parts.append((mul(tone(c, f), env(c, 0.002, 0.07)), g))
    return mix(*parts)


def frost_burst(r):
    c = n(0.9)
    parts = []
    for f, g in ((880, 0.8), (1320, 0.7), (1760, 0.6), (2640, 0.4), (3520, 0.3)):
        shimmer = [0.75 + 0.25 * math.sin(TAU * (5 + f / 800) * i / SR) for i in range(c)]
        parts.append((mul(mul(tone(c, f), swell(c, 0.4)), shimmer), g))
    sp = hp(noise(c, r), 4000)
    parts.append((mul(sp, swell(c, 0.45)), 0.25))
    return delay_line(mix(*parts), [(0.11, 0.3), (0.23, 0.2)])


def frost_launch(r):
    c = n(0.7)
    z = mul(sweep(c, 3000, 900, 0.5), env(c, 0.003, 0.14))
    s = mul(hp(noise(c, r), 3500), env(c, 0.003, 0.12))
    ch = mul(tone(c, 2430), env(c, 0.003, 0.2))
    return mix((z, 0.8), (s, 0.5), (ch, 0.4))


def frost_impact(r):
    c = n(1.4)
    out = [0.0] * c
    for _ in range(45):
        start = int(r.random() ** 1.6 * 0.6 * SR)
        length = n(r.uniform(0.04, 0.14))
        f = r.uniform(2200, 6500)
        g = r.uniform(0.2, 1.0)
        for i in range(min(length, c - start)):
            e = math.exp(-i / (length * 0.35))
            out[start + i] += (math.sin(TAU * f * i / SR) * 0.6 + r.uniform(-0.4, 0.4)) * e * g
    thud = mul(sweep(c, 90, 45, 0.5), env(c, 0.003, 0.1))
    ring = mul(tone(c, 2900), env(c, 0.003, 0.35))
    return delay_line(mix((out, 0.5), (thud, 0.7), (ring, 0.25)), [(0.1, 0.3), (0.21, 0.18)])


def storm_charge(r):
    c = n(0.28)
    a = tone(c, 90, saw)
    b = tone(c, 91.5, saw)
    gate = [1.0 if r.random() > 0.35 else 0.2 for _ in range(c // 220 + 1)]
    am = [gate[i // 220] for i in range(c)]
    buzz = bp(mix((a, 0.5), (b, 0.5)), 120, 1800)
    return mix((mul(mul(buzz, am), env(c, 0.02, 0.15)), 1.0), (mul(crackle(c, r, 0.02, 0.7), env(c, 0.01, 0.12)), 0.5))


def storm_burst(r):
    c = n(0.9)
    s = mul(sweep(c, 60, 420, 1.6, saw), swell(c, 0.8))
    s = bp(s, 100, 2400)
    k = mul(crackle(c, r, 0.04, 0.75), swell(c, 0.8))
    zap = [0.0] * c
    st = int(c * 0.8)
    z = mul(sweep(c - st, 3000, 300, 0.4), env(c - st, 0.002, 0.08))
    for i, v in enumerate(z):
        zap[st + i] = v
    return delay_line(mix((s, 0.7), (k, 0.6), (zap, 0.8)), [(0.08, 0.25)])


def storm_launch(r):
    c = n(0.7)
    z = mul(sweep(c, 2500, 200, 0.4, saw), env(c, 0.002, 0.12))
    z = lp(z, 4500)
    b = mul(hp(noise(c, r), 1500), env(c, 0.002, 0.09))
    return mix((z, 0.6), (b, 0.6))


def storm_impact(r):
    c = n(1.6)
    crack = mul(noise(c, r), env(c, 0.001, 0.035))
    rumble = lp(noise(c, r), 260)
    mod = [0.6 + 0.4 * math.sin(TAU * 6 * i / SR + math.sin(TAU * 1.3 * i / SR) * 3) for i in range(c)]
    rumble = mul(mul(rumble, mod), env(c, 0.05, 0.55))
    sub = mul(sweep(c, 55, 36, 0.4), env(c, 0.003, 0.4))
    zap = mul(sweep(c, 3200, 400, 0.4, saw), env(c, 0.001, 0.05))
    return delay_line(mix((crack, 0.9), (rumble, 2.2), (sub, 0.8), (zap, 0.4)), [(0.14, 0.3), (0.31, 0.18)])


def void_charge(r):
    c = n(0.3)
    vib = [1.0 + 0.01 * math.sin(TAU * 5 * i / SR) for i in range(c)]
    a = mul(sweep(c, 150, 168), vib)
    b = mul(sweep(c, 156, 175), vib)
    h = mul(sweep(c, 300, 336), vib)
    m = mul(sweep(c, 452, 506), vib)
    return mul(mix((a, 0.5), (b, 0.5), (h, 0.35), (m, 0.2)), env(c, 0.06, 0.12))


def void_burst(r):
    c = n(1.0)
    parts = []
    for f, g in ((55, 0.8), (82, 0.6), (110, 0.5), (113, 0.4)):
        parts.append((mul(tone(c, f), reverse_swell(c)), g))
    parts.append((mul(lp(noise(c, r), 500), reverse_swell(c)), 0.5))
    base = mix(*parts)
    boom = [0.0] * c
    s = int(c * 0.9)
    for i in range(c - s):
        boom[s + i] = math.sin(TAU * 45 * i / SR) * math.exp(-i / (0.05 * SR))
    return delay_line(mix((base, 0.8), (boom, 0.7)), [(0.12, 0.3)])


def void_launch(r):
    c = n(0.7)
    s = mul(sweep(c, 80, 650, 1.6), reverse_swell(c))
    w = lp(noise(c, r), sweep_fc(150, 2200, 0.7))
    w = mul(w, reverse_swell(c))
    return mix((s, 0.7), (w, 0.6))


def void_impact(r):
    c = n(1.7)
    inhale = [0.0] * c
    L = n(0.28)
    w = lp(noise(L, r), sweep_fc(200, 2400, 0.28))
    for i, v in enumerate(mul(w, reverse_swell(L))):
        inhale[i] = v
    boom = [0.0] * c
    st = L
    for i in range(c - st):
        t = i / SR
        f = 28 + 40 * math.exp(-t / 0.12)
        boom[st + i] = math.sin(TAU * f * t) * math.exp(-t / 0.55)
    wash = [0.0] * c
    nz = lp(noise(c - st, r), 700)
    for i, v in enumerate(nz):
        wash[st + i] = v * math.exp(-i / (0.3 * SR))
    tail = [0.0] * c
    for f, g in ((90, 0.3), (97, 0.3), (140, 0.2)):
        for i in range(c - st):
            tail[st + i] += math.sin(TAU * f * i / SR) * math.exp(-i / (0.6 * SR)) * g
    return delay_line(mix((inhale, 0.9), (boom, 1.0), (wash, 0.9), (tail, 0.5)), [(0.15, 0.3), (0.33, 0.2)])


def bubbles(c, r, count, f_lo, f_hi, tau, start=0.0, span=1.0):
    out = [0.0] * c
    for _ in range(count):
        s = int((start + r.random() * span) * c)
        f0 = r.uniform(f_lo, f_hi)
        length = min(n(r.uniform(0.04, 0.1)), c - s)
        for i in range(max(length, 0)):
            t = i / SR
            f = f0 * (1.0 + 2.5 * t / 0.08)
            out[s + i] += math.sin(TAU * f * t) * math.exp(-i / (tau * SR))
    return out


def clicks(c, r, interval, tau):
    out = [0.0] * c
    step = n(interval)
    for s in range(0, c, step):
        length = min(n(0.012), c - s)
        for i in range(length):
            out[s + i] += (r.uniform(-1.0, 1.0) * 0.6 + math.sin(TAU * 2200 * i / SR)) * math.exp(-i / (tau * SR))
    return out


def bell(c, freq, tau, parts=((1.0, 1.0), (2.01, 0.55), (2.76, 0.4), (4.07, 0.25), (5.4, 0.15))):
    return mix(*[(mul(tone(c, freq * k), env(c, 0.002, tau / (1 + 0.6 * j))), g) for j, (k, g) in enumerate(parts)])


def exciter(x):
    peak = max(max(abs(v) for v in x), 1e-9)
    sat = [math.tanh(9.0 * v / peak) for v in x]
    return mix((x, 1.0), (bp(sat, 120, 2400), 1.1))


def terra_charge(r):
    c = n(0.28)
    low = lp(noise(c, r), 260)
    k = crackle(c, r, 0.03, 0.9)
    thump = mul(sweep(c, 90, 55, 0.5), env(c, 0.01, 0.1))
    return mix((mul(low, env(c, 0.02, 0.14)), 1.0), (mul(lp(k, 900), env(c, 0.01, 0.12)), 0.6), (thump, 0.6))


def terra_burst(r):
    c = n(0.9)
    grind = bp(noise(c, r), 120, 900)
    am = [0.55 + 0.45 * math.sin(TAU * 13 * i / SR + math.sin(TAU * 3 * i / SR) * 2) for i in range(c)]
    g = mul(mul(grind, am), swell(c, 0.75))
    sub = mul(sweep(c, 45, 90, 1.5), swell(c, 0.75))
    boom = [0.0] * c
    s = int(c * 0.78)
    for i in range(c - s):
        boom[s + i] = math.sin(TAU * 52 * i / SR) * math.exp(-i / (0.09 * SR))
    return exciter(delay_line(mix((g, 1.0), (sub, 0.5), (boom, 0.9)), [(0.1, 0.25)]))


def terra_launch(r):
    c = n(0.7)
    w = lp(noise(c, r), sweep_fc(1800, 300, 0.7))
    w = mul(w, [min(i / n(0.1), 1.0) * math.exp(-i / n(0.3)) for i in range(c)])
    thud = mul(sweep(c, 120, 48, 0.5), env(c, 0.004, 0.12))
    rocks = mul(crackle(c, r, 0.03, 0.8), env(c, 0.01, 0.25))
    return mix((w, 0.9), (thud, 0.9), (lp(rocks, 2500), 0.5))


def terra_impact(r):
    c = n(1.6)
    w = lp(noise(c, r), lambda t: 250 + 1800 * math.exp(-t / 0.2))
    w = mul(w, env(c, 0.003, 0.35))
    boom = mul(sweep(c, 62, 28, 0.45), env(c, 0.003, 0.4))
    debris = mul(lp(crackle(c, r, 0.06, 0.88), 3000), env(c, 0.15, 0.5))
    return exciter(delay_line(mix((w, 1.0), (boom, 1.0), (debris, 0.6)), [(0.14, 0.3), (0.31, 0.18)]))


def toxic_charge(r):
    c = n(0.28)
    b = bubbles(c, r, 5, 350, 700, 0.045, 0.0, 0.6)
    h = mul(hp(noise(c, r), 3000), env(c, 0.02, 0.1))
    return mix((b, 0.8), (h, 0.25))


def toxic_burst(r):
    c = n(0.9)
    hiss = mul(hp(noise(c, r), 2500), swell(c, 0.7))
    b = mul(bubbles(c, r, 26, 250, 650, 0.05), swell(c, 0.8))
    gur = mul(sweep(c, 90, 140, 1.4), swell(c, 0.8))
    return delay_line(mix((hiss, 0.4), (b, 0.7), (gur, 0.5)), [(0.09, 0.25)])


def toxic_launch(r):
    c = n(0.7)
    w = bp(noise(c, r), 400, 3000)
    w = mul(lp(w, sweep_fc(3000, 500, 0.7)), env(c, 0.01, 0.2))
    b = bubbles(c, r, 6, 300, 800, 0.05, 0.0, 0.5)
    return mix((w, 0.8), (b, 0.7))


def toxic_impact(r):
    c = n(1.5)
    splat = mul(lp(noise(c, r), lambda t: 200 + 2600 * math.exp(-t / 0.08)), env(c, 0.002, 0.16))
    b = mul(bubbles(c, r, 30, 200, 700, 0.06, 0.05, 0.8), env(c, 0.05, 0.6))
    hiss = mul(hp(noise(c, r), 3500), env(c, 0.05, 0.5))
    boom = mul(sweep(c, 100, 45, 0.5), env(c, 0.003, 0.15))
    return delay_line(mix((splat, 1.0), (b, 0.6), (hiss, 0.25), (boom, 0.6)), [(0.12, 0.25)])


def gravity_charge(r):
    c = n(0.3)
    mod = [math.sin(TAU * 7 * i / SR) for i in range(c)]
    out = []
    ph = 0.0
    for i in range(c):
        f = 220 + 160 * i / c + 40 * mod[i]
        ph += f / SR
        out.append(math.sin(TAU * ph) + 0.4 * math.sin(TAU * ph * 2))
    return mul(out, env(c, 0.04, 0.12))


def gravity_burst(r):
    c = n(1.0)
    sub = mul(sweep(c, 48, 52), swell(c, 0.8))
    up = mul(sweep(c, 100, 900, 1.8), swell(c, 0.8))
    pulse = [0.5 + 0.5 * math.sin(TAU * (4 + 10 * i / c) * i / SR) for i in range(c)]
    pl = mul(mul(tone(c, 180), pulse), swell(c, 0.8))
    boom = [0.0] * c
    s = int(c * 0.82)
    for i in range(c - s):
        boom[s + i] = math.sin(TAU * 40 * i / SR) * math.exp(-i / (0.1 * SR))
    return exciter(delay_line(mix((sub, 0.7), (up, 0.35), (pl, 0.4), (boom, 0.9)), [(0.12, 0.3)]))


def gravity_launch(r):
    c = n(0.7)
    a = [0.0] * c
    ph = 0.0
    for i in range(c):
        t = i / c
        f = 150 + 750 * math.sin(math.pi * min(t * 1.4, 1.0)) ** 2 - 350 * max(0.0, t - 0.7)
        ph += max(f, 40) / SR
        a[i] = math.sin(TAU * ph)
    return mix((mul(a, env(c, 0.01, 0.35)), 0.8), (mul(lp(noise(c, r), 900), env(c, 0.01, 0.2)), 0.35))


def gravity_impact(r):
    c = n(1.7)
    boom = mul(sweep(c, 55, 34, 0.45), env(c, 0.004, 0.5))
    trem = [0.4 + 0.6 * abs(math.sin(TAU * 3 * i / SR)) for i in range(c)]
    wob = mul(mul(mix((tone(c, 90), 1.0), (tone(c, 270), 0.5), (tone(c, 450), 0.3)), trem), env(c, 0.05, 0.6))
    shimmer = mul(mul(hp(noise(c, r), 3000), trem), env(c, 0.05, 0.35))
    return exciter(delay_line(mix((boom, 1.0), (wob, 0.6), (shimmer, 0.2)), [(0.2, 0.4), (0.42, 0.28), (0.66, 0.16)]))


def life_charge(r):
    c = n(0.3)
    parts = []
    for k, f in enumerate((523, 659, 784)):
        s = int(k * 0.06 * SR)
        t = mul(tone(c - s, f), env(c - s, 0.004, 0.09))
        parts.append(([0.0] * s + t, 0.8))
    return mix(*parts)


def life_burst(r):
    c = n(0.9)
    parts = []
    for f, g in ((523, 0.8), (659, 0.7), (784, 0.7), (1047, 0.6), (1319, 0.3)):
        shimmer = [0.8 + 0.2 * math.sin(TAU * 6 * i / SR) for i in range(c)]
        parts.append((mul(mul(tone(c, f), swell(c, 0.5)), shimmer), g))
    sp = mul(hp(noise(c, r), 5000), swell(c, 0.6))
    parts.append((sp, 0.12))
    return delay_line(mix(*parts), [(0.1, 0.3), (0.22, 0.2)])


def life_launch(r):
    c = n(0.7)
    s = mul(sweep(c, 600, 1800, 0.8), env(c, 0.01, 0.25))
    ch = mul(tone(c, 1568), env(c, 0.01, 0.2))
    sp = mul(hp(noise(c, r), 5000), env(c, 0.005, 0.1))
    return mix((s, 0.6), (ch, 0.4), (sp, 0.15))


def life_impact(r):
    c = n(1.6)
    parts = []
    for k, (f, g) in enumerate(((261.6, 0.7), (329.6, 0.7), (392.0, 0.7), (523.3, 0.8), (659.3, 0.4))):
        parts.append((mul(tone(c, f), env(c, 0.015, 0.45)), g))
    sp = mul(hp(noise(c, r), 4500), env(c, 0.01, 0.2))
    bloom = mul(lp(noise(c, r), 500), env(c, 0.05, 0.3))
    parts.append((sp, 0.15))
    parts.append((bloom, 0.3))
    return delay_line(mix(*parts), [(0.13, 0.3), (0.28, 0.2)])


def chrono_charge(r):
    c = n(0.28)
    k = clicks(c, r, 0.07, 0.006)
    t = mul(tone(c, 440), env(c, 0.01, 0.1))
    return mix((k, 0.8), (t, 0.25))


def chrono_burst(r):
    c = n(1.0)
    k = mul(clicks(c, r, 0.06, 0.005), swell(c, 0.8))
    b = [0.0] * c
    s = int(c * 0.75)
    for i, v in enumerate(bell(c - s, 880, 0.35)):
        b[s + i] = v
    sw = mul(sweep(c, 200, 1400, 1.8), swell(c, 0.75))
    return delay_line(mix((k, 0.7), (b, 0.8), (sw, 0.25)), [(0.12, 0.25)])


def chrono_launch(r):
    c = n(0.7)
    k = mul(clicks(c, r, 0.05, 0.005), env(c, 0.001, 0.25))
    s = mul(sweep(c, 1600, 300, 0.6), env(c, 0.005, 0.2))
    return mix((k, 0.7), (s, 0.5))


def chrono_impact(r):
    c = n(1.8)
    inhale = [0.0] * c
    L = n(0.25)
    for i, v in enumerate(mul(bp(noise(L, r), 300, 3000), reverse_swell(L))):
        inhale[i] = v
    gong = [0.0] * c
    for i, v in enumerate(bell(c - L, 110, 0.9, ((1.0, 1.0), (2.0, 0.6), (2.76, 0.5), (4.2, 0.3), (5.4, 0.2)))):
        gong[L + i] = v
    boom = [0.0] * c
    for i, v in enumerate(mul(sweep(c - L, 70, 32, 0.45), env(c - L, 0.003, 0.3))):
        boom[L + i] = v
    return exciter(delay_line(mix((inhale, 0.8), (gong, 0.9), (boom, 0.8)), [(0.18, 0.3), (0.4, 0.2)]))


SOUNDS = {
    "aero_charge": aero_charge, "aero_burst": aero_burst, "aero_launch": aero_launch, "aero_impact": aero_impact,
    "blaze_charge": blaze_charge, "blaze_burst": blaze_burst, "blaze_launch": blaze_launch, "blaze_impact": blaze_impact,
    "frost_charge": frost_charge, "frost_burst": frost_burst, "frost_launch": frost_launch, "frost_impact": frost_impact,
    "storm_charge": storm_charge, "storm_burst": storm_burst, "storm_launch": storm_launch, "storm_impact": storm_impact,
    "void_charge": void_charge, "void_burst": void_burst, "void_launch": void_launch, "void_impact": void_impact,
    "terra_charge": terra_charge, "terra_burst": terra_burst, "terra_launch": terra_launch, "terra_impact": terra_impact,
    "toxic_charge": toxic_charge, "toxic_burst": toxic_burst, "toxic_launch": toxic_launch, "toxic_impact": toxic_impact,
    "gravity_charge": gravity_charge, "gravity_burst": gravity_burst, "gravity_launch": gravity_launch, "gravity_impact": gravity_impact,
    "life_charge": life_charge, "life_burst": life_burst, "life_launch": life_launch, "life_impact": life_impact,
    "chrono_charge": chrono_charge, "chrono_burst": chrono_burst, "chrono_launch": chrono_launch, "chrono_impact": chrono_impact,
}


def write_wav(path, samples):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1.0, min(1.0, v)) * 32767)) for v in samples))


def main():
    if len(sys.argv) > 2:
        print("usage: python3 MCPEDL/Addons/ALNSpiritSphere/sound_sources/make_sounds.py [PROJECT_FOLDER]")
        return 2
    project = Path(sys.argv[1]) if len(sys.argv) == 2 else Path(__file__).resolve().parent.parent
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        print("ffmpeg is required to write .ogg files. In Termux run: pkg install ffmpeg")
        return 1
    out_dir = project / "resource_pack" / "sounds" / "aln" / "spirit"
    out_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for name, fn in SOUNDS.items():
            samples = finish(fn(rng_for(name)))
            wav = Path(tmp) / f"{name}.wav"
            write_wav(wav, samples)
            target = out_dir / f"{name}.ogg"
            result = subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "libvorbis", "-q:a", "5", str(target)])
            if result.returncode != 0:
                print("ffmpeg failed for", name)
                return 1
            print("wrote", target, f"({len(samples) / SR:.2f}s)")
    print(f"SOUNDS OK: {len(SOUNDS)} file(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
