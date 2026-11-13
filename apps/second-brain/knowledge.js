/* AIU-OS knowledge model. Pure functions shared by the app and Node tests. */
(function (root) {
  "use strict";
  const MAX_NOTES = 500;
  const MAX_FILE_BYTES = 256 * 1024;
  const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
  // JSON may escape one byte as six ASCII characters (for example a control).
  const MAX_BACKUP_BYTES = MAX_TOTAL_BYTES * 6 + MAX_NOTES * 4096;
  const blocked =
    /^(?:\.|node_modules$|vendor$|private$|personal$|12_Private$)/i;
  const bytes = (s) => new TextEncoder().encode(s).length;

  function cleanPath(raw) {
    if (typeof raw !== "string" || !raw || raw.length > 500) return null;
    const path = raw.replace(/\\/g, "/");
    if (/^[\/]|^[a-z]:|[\x00-\x1f]/i.test(path)) return null;
    const parts = path.split("/");
    if (parts.some((p) => !p || p === "." || p === ".." || blocked.test(p)))
      return null;
    return /\.(md|markdown)$/i.test(path) ? path.normalize("NFC") : null;
  }

  function titleOf(path, body) {
    const heading = body.match(/^#\s+(.+)$/m);
    return (
      heading
        ? heading[1].replace(/\s+#+\s*$/, "")
        : path
            .split("/")
            .pop()
            .replace(/\.(md|markdown)$/i, "")
    )
      .trim()
      .slice(0, 200);
  }

  function normalize(entries) {
    if (!Array.isArray(entries))
      throw new Error("Expected an array of Markdown notes.");
    const notes = [];
    const seen = new Set();
    let skipped = 0;
    let total = 0;
    // Limit work even if a malformed backup contains an excessive array.
    for (const item of entries.slice(0, 20000)) {
      const path = cleanPath(item && item.path);
      const body = item && item.body;
      if (
        !path ||
        typeof body !== "string" ||
        bytes(body) > MAX_FILE_BYTES ||
        seen.has(path.toLowerCase()) ||
        notes.length >= MAX_NOTES
      ) {
        skipped++;
        continue;
      }
      const size = bytes(body);
      if (total + size > MAX_TOTAL_BYTES) {
        skipped++;
        continue;
      }
      total += size;
      seen.add(path.toLowerCase());
      notes.push({
        id: path,
        path,
        title: titleOf(path, body),
        body,
        group: path.includes("/") ? path.split("/")[0] : "Notes",
      });
    }
    skipped += Math.max(0, entries.length - 20000);
    notes.sort((a, b) => a.path.localeCompare(b.path));
    return { notes, skipped, bytes: total };
  }

  function rawLinks(body) {
    // Code samples are not links. HTML stays inert everywhere in the viewer.
    const text = body
      .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "")
      .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, "")
      .replace(/`[^`\n]*`/g, "");
    const result = [];
    for (const m of text.matchAll(/(?<!!)\[\[([^\]\n]+)\]\]/g)) {
      const parts = m[1].split("|");
      result.push({
        target: parts[0].split("#")[0].trim(),
        label: (parts[1] || parts[0]).trim(),
        wiki: true,
      });
    }
    for (const m of text.matchAll(
      /(?<!!)\[([^\]\n]+)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g,
    )) {
      result.push({ target: m[2].split("#")[0], label: m[1], wiki: false });
    }
    return result.filter(
      (l) => l.target && !/^[a-z][a-z\d+.-]*:|^\/\/|^#/i.test(l.target),
    );
  }

  function buildGraph(notes) {
    const byId = new Map(notes.map((n) => [n.id, n]));
    const exact = new Map(
      notes.map((n) => [
        n.id.replace(/\.(md|markdown)$/i, "").toLowerCase(),
        n.id,
      ]),
    );
    const names = new Map();
    const addName = (name, id) => {
      const key = name.toLowerCase();
      const ids = names.get(key) || new Set();
      ids.add(id);
      names.set(key, ids);
    };
    notes.forEach((n) => {
      addName(n.title, n.id);
      addName(
        n.id
          .split("/")
          .pop()
          .replace(/\.(md|markdown)$/i, ""),
        n.id,
      );
    });
    function resolve(from, raw) {
      let target;
      try {
        target = decodeURIComponent(raw)
          .normalize("NFC")
          .replace(/\\/g, "/")
          .replace(/\.(md|markdown)$/i, "");
      } catch {
        return null;
      }
      if (/^[a-z][a-z\d+.-]*:|^\/\//i.test(target)) return null;
      const rooted = target.startsWith("/");
      const parts =
        !rooted && from.includes("/") ? from.split("/").slice(0, -1) : [];
      for (const p of target.split("/")) {
        if (p === "..") {
          if (!parts.length) return null;
          parts.pop();
        } else if (p && p !== ".") parts.push(p);
      }
      const local = exact.get(parts.join("/").toLowerCase());
      if (local) return local;
      const direct = exact.get(target.replace(/^\//, "").toLowerCase());
      if (direct) return direct;
      const candidates = names.get(target.toLowerCase());
      // Ambiguous basenames stay unresolved rather than choosing a random file.
      return candidates && candidates.size === 1 ? [...candidates][0] : null;
    }
    const outgoing = new Map(notes.map((n) => [n.id, []]));
    const backlinks = new Map(notes.map((n) => [n.id, []]));
    const unresolved = new Map();
    const links = [];
    for (const note of notes) {
      const used = new Set();
      const missing = new Set();
      for (const link of rawLinks(note.body)) {
        const target = resolve(note.id, link.target);
        if (!target) {
          missing.add(link.target);
          continue;
        }
        if (target === note.id || used.has(target)) continue;
        used.add(target);
        outgoing.get(note.id).push(target);
        backlinks.get(target).push(note.id);
        links.push({ source: note.id, target });
      }
      unresolved.set(note.id, [...missing]);
    }
    return {
      nodes: notes.map((n) => ({
        ...n,
        degree: new Set([...outgoing.get(n.id), ...backlinks.get(n.id)]).size,
      })),
      links,
      byId,
      outgoing,
      backlinks,
      unresolved,
      resolve,
    };
  }

  function search(notes, query, group = "") {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return notes
      .filter(
        (n) =>
          (!group || n.group === group) &&
          words.every((w) =>
            `${n.title}\n${n.path}\n${n.body}`.toLowerCase().includes(w),
          ),
      )
      .sort((a, b) => {
        const score = (n) =>
          words.reduce(
            (s, w) => s + (n.title.toLowerCase().includes(w) ? 4 : 0),
            0,
          );
        return score(b) - score(a) || a.title.localeCompare(b.title);
      });
  }

  function parseBackup(text) {
    if (bytes(text) > MAX_BACKUP_BYTES)
      throw new Error("This backup is too large.");
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("This is not a valid JSON backup.");
    }
    if (
      !data ||
      data.format !== "aiu-second-brain" ||
      data.version !== 1 ||
      !Array.isArray(data.notes)
    )
      throw new Error("Choose an AIU Second Brain library backup (version 1).");
    return normalize(data.notes);
  }

  function backup(notes) {
    return JSON.stringify(
      {
        format: "aiu-second-brain",
        version: 1,
        notes: notes.map(({ path, body }) => ({ path, body })),
      },
      null,
      2,
    );
  }

  const api = {
    MAX_NOTES,
    MAX_BACKUP_BYTES,
    MAX_FILE_BYTES,
    MAX_TOTAL_BYTES,
    bytes,
    cleanPath,
    titleOf,
    normalize,
    buildGraph,
    search,
    rawLinks,
    parseBackup,
    backup,
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AIUKnowledge = api;
})(typeof window === "object" ? window : globalThis);
