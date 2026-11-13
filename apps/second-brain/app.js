/* AIU Second Brain — no server, telemetry, account, or network requests. */
(function () {
  "use strict";
  const K = window.AIUKnowledge;
  const $ = (id) => document.getElementById(id);
  const state = {
    notes: [],
    graph: null,
    selected: "",
    group: "",
    query: "",
    demo: true,
    dirty: false,
    saved: false,
  };
  const storageKey = "aiu-second-brain-v1";
  let timer,
    editingId = null;
  const graph = new window.AIUGraph($("graph"), select, (note) => {
    $("hover-label").hidden = !note;
    if (note)
      $("hover-label").textContent =
        `${note.title} · ${note.degree} connections`;
  });

  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function message(text) {
    $("toast").textContent = text;
    $("toast").hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => {
      $("toast").hidden = true;
    }, 4500);
  }

  function load(notes, { demo = false, saved = false } = {}) {
    state.notes = notes;
    state.graph = K.buildGraph(notes);
    state.selected = "";
    state.group = "";
    state.query = "";
    state.demo = demo;
    state.saved = saved;
    state.dirty = false;
    $("search").value = "";
    graph.setData(state.graph);
    $("graph-empty").hidden = notes.length > 0;
    renderGroups();
    renderList();
    const first = notes.find((n) => n.title === "My AI workspace") || notes[0];
    select(first ? first.id : "");
    status();
  }

  function status() {
    const groupCount = new Set(state.notes.map((n) => n.group)).size;
    $("library-summary").textContent =
      `${state.notes.length} notes · ${state.graph.links.length} links · ${groupCount} folders`;
    $("graph-subtitle").textContent =
      `${state.notes.length} notes. ${state.graph.links.length} links. Your ideas, connected.`;
    $("mode-badge").textContent = state.demo
      ? "FICTIONAL DEMO"
      : "YOUR LOCAL LIBRARY";
    $("storage-status").textContent = state.dirty
      ? "Changes in memory · export or save"
      : state.saved
        ? "Saved snapshot in this browser"
        : state.demo
          ? "Fictional demo · not saved"
          : "In memory · export or save to keep";
  }

  function renderGroups() {
    const groups = new Map();
    for (const note of state.notes)
      groups.set(note.group, (groups.get(note.group) || 0) + 1);
    $("groups").replaceChildren();
    for (const [name, count] of [
      ["", state.notes.length],
      ...[...groups].sort((a, b) => a[0].localeCompare(b[0])),
    ]) {
      const button = el(
        "button",
        undefined,
        "group" + (state.group === name ? " active" : ""),
      );
      button.append(
        el("span", name ? "▱" : "⌘", "folder-icon"),
        el("span", name || "All knowledge"),
        el("span", String(count), "count"),
      );
      button.setAttribute("aria-pressed", String(state.group === name));
      button.addEventListener("click", () => {
        state.group = name;
        renderGroups();
        renderList();
      });
      $("groups").append(button);
    }
  }

  function renderList() {
    const results = K.search(state.notes, state.query, state.group);
    $("notes").replaceChildren();
    $("result-label").textContent = state.query
      ? "SEARCH RESULTS"
      : state.group
        ? "FOLDER NOTES"
        : "ALL NOTES";
    $("result-count").textContent = results.length;
    graph.setMatches(
      state.query || state.group ? results.map((n) => n.id) : null,
    );
    for (const note of results) {
      const button = el(
        "button",
        undefined,
        "note-row" + (note.id === state.selected ? " active" : ""),
      );
      button.dataset.id = note.id;
      button.setAttribute("aria-current", String(note.id === state.selected));
      button.append(
        el("strong", note.title),
        el(
          "small",
          `${note.group} · ${state.graph.nodes.find((n) => n.id === note.id).degree} connections`,
        ),
      );
      button.addEventListener("click", () => select(note.id));
      $("notes").append(button);
    }
    if (!results.length)
      $("notes").append(
        el("p", "No notes match. Try another search or folder.", "empty-list"),
      );
  }

  function inline(parent, text, source) {
    // Never insert imported HTML. Only internal note links become buttons.
    const re =
      /\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
    let previous = 0;
    for (const match of text.matchAll(re)) {
      parent.append(document.createTextNode(text.slice(previous, match.index)));
      if (match[1] || match[2]) {
        const raw = match[1]
          ? match[1].split("|")[0].split("#")[0]
          : match[3].split("#")[0];
        const label = match[1] ? match[1].split("|")[1] || match[1] : match[2];
        const id = state.graph.resolve(source, raw.trim());
        if (id) {
          const button = el("button", label, "wiki-link");
          button.addEventListener("click", () => select(id));
          parent.append(button);
        } else parent.append(el("span", label, "missing-link"));
      } else
        parent.append(el(match[4] ? "strong" : "code", match[4] || match[5]));
      previous = match.index + match[0].length;
    }
    parent.append(document.createTextNode(text.slice(previous)));
  }

  function renderBody(note) {
    const container = $("note-content");
    container.replaceChildren();
    if (!note) {
      container.append(
        el("h2", "A place for what you know."),
        el(
          "p",
          "Import your Markdown notes, or create one. Use [[Note title]] to connect ideas. Every node is a note you can open.",
        ),
      );
      return;
    }
    if (state.demo)
      container.append(
        el(
          "div",
          "FICTIONAL DEMO · Explore these examples, then import your own notes.",
          "demo-note",
        ),
      );
    container.append(el("h2", note.title));
    const body = note.body
      .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "")
      .replace(/^#\s+.+\r?\n?/, "")
      .trim();
    let paragraph = [],
      list = null,
      code = null,
      fence = null;
    const flush = () => {
      if (paragraph.length) {
        const p = el("p");
        inline(p, paragraph.join("\n"), note.id);
        container.append(p);
        paragraph = [];
      }
      list = null;
    };
    for (const line of body.split(/\r?\n/)) {
      if (/^\s*(```|~~~)/.test(line)) {
        if (code) {
          container.append(el("pre", code.join("\n")));
          code = null;
          fence = null;
        } else {
          flush();
          code = [];
          fence = line.trim().slice(0, 3);
        }
        continue;
      }
      if (code) {
        code.push(line);
        continue;
      }
      const heading = line.match(/^#{2,6}\s+(.+)/);
      const bullet = line.match(/^\s*[-*]\s+(.+)/);
      if (heading) {
        flush();
        const h = el("h3");
        inline(h, heading[1], note.id);
        container.append(h);
      } else if (bullet) {
        if (paragraph.length) flush();
        if (!list) {
          list = el("ul");
          container.append(list);
        }
        const li = el("li");
        inline(li, bullet[1], note.id);
        list.append(li);
      } else if (!line.trim()) flush();
      else {
        list = null;
        paragraph.push(line);
      }
    }
    flush();
    if (code) container.append(el("pre", code.join("\n")));
    container.scrollTop = 0;
  }

  function connectionList(id, container, outgoing) {
    const ids =
      (outgoing ? state.graph.outgoing : state.graph.backlinks).get(id) || [];
    $(container).replaceChildren();
    for (const target of ids) {
      const note = state.graph.byId.get(target);
      const button = el("button", undefined, "connection");
      button.append(el("span", outgoing ? "↗" : "↙"), el("span", note.title));
      button.addEventListener("click", () => select(target));
      $(container).append(button);
    }
    if (!ids.length)
      $(container).append(
        el(
          "div",
          outgoing ? "No linked notes yet." : "No backlinks yet.",
          "none",
        ),
      );
    return ids.length;
  }

  function select(id) {
    state.selected = id;
    const note = state.graph.byId.get(id);
    graph.setSelection(id);
    $("note-group").textContent = note ? note.group : "START HERE";
    $("note-path").textContent = note
      ? note.path
      : "Markdown files · portable by design";
    $("edit-note").disabled = !note;
    $("download-note").disabled = !note;
    $("reader")?.classList.remove("collapsed");
    document.querySelector(".reader").classList.remove("collapsed");
    renderBody(note);
    $("outgoing-count").textContent = connectionList(id, "outgoing", true);
    $("backlink-count").textContent = connectionList(id, "backlinks", false);
    for (const row of $("notes").querySelectorAll(".note-row")) {
      row.classList.toggle("active", row.dataset.id === id);
      row.setAttribute("aria-current", String(row.dataset.id === id));
    }
  }

  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = el("a");
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function importFiles(files, folder) {
    if (!files.length) return;
    const button = $("import");
    button.disabled = true;
    try {
      let result;
      if (files.length === 1 && /\.json$/i.test(files[0].name)) {
        if (files[0].size > K.MAX_BACKUP_BYTES)
          throw new Error("This backup is too large.");
        result = K.parseBackup(await files[0].text());
      } else {
        const entries = [];
        let skipped = 0,
          total = 0;
        for (const file of files) {
          if (folder && !K.cleanPath(file.webkitRelativePath)) {
            skipped++;
            continue;
          }
          const rel = folder
            ? file.webkitRelativePath.split("/").slice(1).join("/")
            : file.name;
          const path = K.cleanPath(rel);
          if (
            !path ||
            file.size > K.MAX_FILE_BYTES ||
            entries.length >= K.MAX_NOTES ||
            total + file.size > K.MAX_TOTAL_BYTES
          ) {
            skipped++;
            continue;
          }
          total += file.size;
          entries.push({ path, body: await file.text() });
        }
        result = K.normalize(entries);
        result.skipped += skipped;
      }
      if (!result.notes.length)
        throw new Error(
          "No eligible Markdown notes found. The current library was kept.",
        );
      if (
        (state.dirty || (!state.demo && state.notes.length)) &&
        !confirm(
          "Replace this view? Export first if you want to keep the current library or unsaved changes.",
        )
      )
        return;
      // Personal imports replace the demo; no fiction is mixed into real data.
      load(result.notes);
      $("import-dialog").close();
      message(
        `Imported ${result.notes.length} notes${result.skipped ? ` · ${result.skipped} skipped (unsupported, private, duplicate or over limits)` : ""}. Export or save in browser to keep them.`,
      );
    } catch (error) {
      $("import-report").textContent = error.message;
      message(error.message);
    } finally {
      button.disabled = false;
      $("file-input").value = "";
      $("folder-input").value = "";
    }
  }

  function openEditor(note) {
    editingId = note ? note.id : null;
    $("edit-path").value = note ? note.path : "Notes/Untitled.md";
    $("edit-body").value = note ? note.body : "# Untitled\n\n";
    $("editor-error").textContent = "";
    $("editor-dialog").showModal();
  }

  $("search").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderList();
  });
  $("import").addEventListener("click", () => {
    $("import-report").textContent = "";
    $("import-dialog").showModal();
  });
  $("choose-folder").addEventListener("click", () => $("folder-input").click());
  $("choose-files").addEventListener("click", () => $("file-input").click());
  $("folder-input").addEventListener("change", (e) =>
    importFiles([...e.target.files], true),
  );
  $("file-input").addEventListener("change", (e) =>
    importFiles([...e.target.files], false),
  );
  $("export").addEventListener("click", () => {
    download(
      "AIU-Second-Brain.json",
      K.backup(state.notes),
      "application/json",
    );
    message("Library exported. Store the backup somewhere you trust.");
  });
  $("download-note").addEventListener("click", () => {
    const note = state.graph.byId.get(state.selected);
    if (note)
      download(
        note.path.split("/").pop(),
        note.body,
        "text/markdown;charset=utf-8",
      );
  });
  $("save-browser").addEventListener("click", () => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ demo: state.demo, library: K.backup(state.notes) }),
      );
      state.saved = true;
      state.dirty = false;
      status();
      message(
        "Snapshot saved in this browser. Export a backup for another device. Shared-device users can read this snapshot.",
      );
    } catch {
      message(
        "Browser storage is unavailable or full. Export the library instead.",
      );
    }
  });
  $("demo").addEventListener("click", () => {
    if (
      (!state.demo || state.dirty) &&
      !confirm(
        "Load the fictional demo? Export first to keep the current view.",
      )
    )
      return;
    load(K.normalize(window.AIUDemo).notes, { demo: true });
    message("Fictional demo loaded. Any saved browser snapshot is unchanged.");
  });
  $("clear").addEventListener("click", () => {
    if (
      !confirm(
        "Clear this library and its saved browser snapshot? Export first to keep a copy. Your original files are untouched.",
      )
    )
      return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* Storage may be disabled. */
    }
    load([]);
    message(
      "View and saved browser snapshot cleared. Original files were not changed.",
    );
  });
  $("new-note").addEventListener("click", () => openEditor(null));
  $("edit-note").addEventListener("click", () =>
    openEditor(state.graph.byId.get(state.selected)),
  );
  $("close-editor").addEventListener("click", () => $("editor-dialog").close());
  $("editor").addEventListener("submit", (e) => {
    e.preventDefault();
    const path = K.cleanPath($("edit-path").value.trim());
    const body = $("edit-body").value;
    if (!path) {
      $("editor-error").textContent =
        "Use a relative .md path outside hidden or private folders.";
      return;
    }
    if (K.bytes(body) > K.MAX_FILE_BYTES) {
      $("editor-error").textContent = "This note exceeds 256 KB.";
      return;
    }
    if (
      state.notes.some(
        (n) =>
          n.id !== editingId && n.path.toLowerCase() === path.toLowerCase(),
      )
    ) {
      $("editor-error").textContent =
        "That path already exists. Choose another file name.";
      return;
    }
    const input = [
      ...state.notes.filter((n) => n.id !== editingId),
      { path, body },
    ];
    const result = K.normalize(input);
    if (result.skipped) {
      $("editor-error").textContent =
        "Library limit reached. Export and use a smaller set of notes.";
      return;
    }
    const demo = state.demo;
    load(result.notes, { demo });
    state.dirty = true;
    state.saved = false;
    status();
    select(path);
    $("editor-dialog").close();
    message(
      "Note updated in this view. Export or save in browser to keep the change.",
    );
  });
  $("rotate").addEventListener("click", () => {
    graph.rotating = !graph.rotating;
    $("rotate").setAttribute("aria-pressed", String(graph.rotating));
  });
  $("reset").addEventListener("click", () => graph.reset());
  $("focus-view").addEventListener("click", () => {
    const active = document.body.classList.toggle("focus");
    $("focus-view").setAttribute("aria-pressed", String(active));
    setTimeout(() => graph.reset(), 20);
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "/" &&
      !/input|textarea/i.test(document.activeElement.tagName) &&
      !document.querySelector("dialog[open]")
    ) {
      e.preventDefault();
      $("search").focus();
    }
    if (e.key === "Escape") {
      document.body.classList.remove("focus");
      $("focus-view").setAttribute("aria-pressed", "false");
      if (innerWidth <= 920)
        document.querySelector(".reader").classList.add("collapsed");
    }
  });
  window.addEventListener("beforeunload", (e) => {
    if (state.dirty || (!state.demo && !state.saved && state.notes.length)) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  let restored = false;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const data = JSON.parse(stored);
      load(K.parseBackup(data.library).notes, {
        demo: data.demo === true,
        saved: true,
      });
      restored = true;
    }
  } catch {
    /* An invalid or disabled snapshot never prevents opening the app. */
  }
  if (!restored) load(K.normalize(window.AIUDemo).notes, { demo: true });
  if (innerWidth <= 920)
    document.querySelector(".reader").classList.add("collapsed");
})();
