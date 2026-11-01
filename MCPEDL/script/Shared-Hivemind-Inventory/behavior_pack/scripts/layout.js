const DEBOUNCE = 20;

export function createLayout(d) {
  let pool = new Map();
  const baseline = new Map();
  const owed = new Map();
  const pending = new Map();
  let tickNo = 0;

  const keyOf = (item) => { const s = d.serializeItem(item); delete s.amount; return JSON.stringify(s); };
  const keyOfData = (data) => { const s = { ...data }; delete s.amount; return JSON.stringify(s); };
  const baseKeyOf = (proto) => { const s = { ...proto }; delete s.damage; return JSON.stringify(s); };
  const bump = (m, k, n) => { const v = (m.get(k) ?? 0) + n; if (v > 0) m.set(k, v); else m.delete(k); };
  const itemAt = (c, i) => d.visible(d.safe(() => c.getItem(i)));

  function maxStack(proto) {
    const probe = d.deserializeItem({ ...proto, amount: 1 });
    return probe?.maxAmount ?? 1;
  }

  function scan(player) {
    const c = d.containerOf(player);
    if (!c) return null;
    const counts = new Map();
    for (let i = 0; i < d.INV_SLOTS; i++) {
      const item = itemAt(c, i);
      if (!item) continue;
      const k = keyOf(item);
      counts.set(k, (counts.get(k) ?? 0) + item.amount);
    }
    return counts;
  }

  function removeUnits(player, key, n) {
    const c = d.containerOf(player);
    let left = n;
    for (let i = d.INV_SLOTS - 1; i >= 0 && left > 0; i--) {
      const live = itemAt(c, i);
      if (!live || keyOf(live) !== key) continue;
      const take = Math.min(left, live.amount);
      if (take >= live.amount) d.safe(() => c.setItem(i, undefined));
      else {
        live.amount -= take;
        d.safe(() => c.setItem(i, live));
      }
      left -= take;
    }
    return n - left;
  }

  function addUnits(player, key, n) {
    const c = d.containerOf(player);
    const proto = JSON.parse(key);
    const max = maxStack(proto);
    let left = n;
    for (let i = 0; i < d.INV_SLOTS && left > 0; i++) {
      const live = itemAt(c, i);
      if (!live || live.amount >= max || keyOf(live) !== key) continue;
      const add = Math.min(max - live.amount, left);
      live.amount += add;
      d.safe(() => c.setItem(i, live));
      left -= add;
    }
    for (let i = 0; i < d.INV_SLOTS && left > 0; i++) {
      if (d.safe(() => c.getItem(i))) continue;
      const m = Math.min(max, left);
      const item = d.deserializeItem({ ...proto, amount: m });
      if (!item) break;
      d.safe(() => c.setItem(i, item));
      left -= m;
    }
    return n - left;
  }

  function replaceUnits(player, from, to, n) {
    const c = d.containerOf(player);
    const proto = JSON.parse(to);
    let done = 0;
    for (let i = 0; i < d.INV_SLOTS && done < n; i++) {
      const live = itemAt(c, i);
      if (!live || keyOf(live) !== from) continue;
      const item = d.deserializeItem({ ...proto, amount: live.amount });
      if (!item) continue;
      d.safe(() => c.setItem(i, item));
      done += live.amount;
    }
    return Math.min(done, n);
  }

  function apply(player, key, diff) {
    const base = baseline.get(player.id);
    const ow = owed.get(player.id);
    if (diff > 0) {
      const placed = addUnits(player, key, diff);
      bump(base, key, placed);
      if (placed < diff) ow.set(key, (ow.get(key) ?? 0) + diff - placed);
      return;
    }
    let need = -diff;
    const o = ow.get(key) ?? 0;
    if (o > 0) {
      const c = Math.min(o, need);
      need -= c;
      if (o - c > 0) ow.set(key, o - c); else ow.delete(key);
    }
    if (need > 0) {
      removeUnits(player, key, need);
      bump(base, key, -need);
    }
  }

  function retryOwed(player) {
    const ow = owed.get(player.id);
    if (!ow?.size) return;
    const base = baseline.get(player.id);
    for (const [key, count] of [...ow]) {
      const placed = addUnits(player, key, count);
      if (placed <= 0) continue;
      bump(base, key, placed);
      if (count - placed > 0) ow.set(key, count - placed); else ow.delete(key);
    }
  }

  function adopt(player) {
    const counts = scan(player);
    if (!counts) return;
    baseline.set(player.id, new Map(counts));
    owed.set(player.id, new Map());
    pending.set(player.id, new Map());
    for (const key of new Set([...pool.keys(), ...counts.keys()])) {
      const want = pool.get(key) ?? 0;
      const have = counts.get(key) ?? 0;
      if (want !== have) apply(player, key, want - have);
    }
  }

  function build(players) {
    pool = new Map();
    for (const p of players) {
      const counts = scan(p);
      if (!counts) continue;
      for (const [k, n] of counts) bump(pool, k, n);
    }
  }

  function step(players) {
    tickNo++;
    const ids = new Set(players.map(p => p.id));
    for (const id of [...baseline.keys()]) {
      if (ids.has(id)) continue;
      baseline.delete(id);
      owed.delete(id);
      pending.delete(id);
    }
    const commits = [];
    for (const p of players) {
      if (!baseline.has(p.id)) { adopt(p); continue; }
      retryOwed(p);
      const counts = scan(p);
      if (!counts) continue;
      const base = baseline.get(p.id);
      const pend = pending.get(p.id);
      const diffs = new Map();
      for (const k of new Set([...counts.keys(), ...base.keys()])) diffs.set(k, (counts.get(k) ?? 0) - (base.get(k) ?? 0));
      const negs = [];
      const poss = [];
      for (const [k, df] of diffs) {
        if (df === 0) continue;
        const pr = JSON.parse(k);
        if (pr.damage === undefined) continue;
        (df < 0 ? negs : poss).push({ k, df, bk: baseKeyOf(pr) });
      }
      for (const ng of negs) {
        for (const ps of poss) {
          if (ng.bk !== ps.bk || ng.df >= 0 || ps.df <= 0) continue;
          const n = Math.min(-ng.df, ps.df);
          commits.push({ p, replace: [ng.k, ps.k], n });
          ng.df += n;
          ps.df -= n;
          diffs.set(ng.k, ng.df);
          diffs.set(ps.k, ps.df);
        }
      }
      for (const k of [...pend.keys()]) if (!diffs.has(k)) pend.delete(k);
      for (const [key, diff] of diffs) {
        if (diff === 0) { pend.delete(key); continue; }
        if (diff > 0) {
          pend.delete(key);
          commits.push({ p, key, diff });
          continue;
        }
        const e = pend.get(key);
        if (e && e.n === diff) {
          if (tickNo - e.since >= DEBOUNCE) {
            pend.delete(key);
            commits.push({ p, key, diff });
          }
        } else pend.set(key, { n: diff, since: tickNo });
      }
    }
    for (const c of commits) {
      if (c.replace) {
        const [from, to] = c.replace;
        const fromBefore = pool.get(from) ?? 0;
        bump(pool, from, -Math.min(c.n, fromBefore));
        bump(pool, to, c.n);
        bump(baseline.get(c.p.id), from, -c.n);
        bump(baseline.get(c.p.id), to, c.n);
        for (const o of players) {
          if (o.id === c.p.id || !baseline.has(o.id)) continue;
          const done = replaceUnits(o, from, to, c.n);
          const ob = baseline.get(o.id);
          bump(ob, from, -done);
          bump(ob, to, done);
          if (done < c.n) apply(o, to, c.n - done);
        }
        continue;
      }
      const before = pool.get(c.key) ?? 0;
      const after = Math.max(0, before + c.diff);
      if (after > 0) pool.set(c.key, after); else pool.delete(c.key);
      bump(baseline.get(c.p.id), c.key, c.diff);
      const eff = after - before;
      if (!eff) continue;
      for (const o of players) if (o.id !== c.p.id && baseline.has(o.id)) apply(o, c.key, eff);
    }
    return commits.length > 0;
  }

  function stacks() {
    const out = [];
    for (const [key, count] of pool) {
      const proto = JSON.parse(key);
      const max = maxStack(proto);
      for (let left = count; left > 0; left -= max) {
        const item = d.deserializeItem({ ...proto, amount: Math.min(max, left) });
        if (item) out.push(item);
      }
    }
    return out;
  }

  function serialize() {
    return [...pool.entries()].map(([k, n]) => ({ ...JSON.parse(k), amount: n }));
  }

  function load(list) {
    pool = new Map();
    for (const data of Array.isArray(list) ? list : []) {
      if (!data?.id || !Number.isInteger(data.amount) || data.amount < 1) continue;
      bump(pool, keyOfData(data), data.amount);
    }
  }

  function clear() { pool = new Map(); }

  function reset() {
    pool = new Map();
    baseline.clear();
    owed.clear();
    pending.clear();
    tickNo = 0;
  }

  return { adopt, build, step, stacks, serialize, load, clear, reset };
}
