/* Original AI University MASTER Map. MIT. No network requests or third-party renderer. */
(() => {
  "use strict";
  const DATA = [
    {
      id: "memory",
      letter: "M",
      name: "Memory",
      point: [-220, -115, 65],
      text: "The context your agent needs: your goal, source notes, preferences and saved decisions.",
      searchFiles: [
        [".claude/skills/capture-context/SKILL.md", "Capture context"],
        [".agents/skills/capture-context/SKILL.md", "Capture context in Codex"],
        [".claude/skills/find-context/SKILL.md", "Find saved context"],
        [".agents/skills/find-context/SKILL.md", "Find context in Codex"],
      ],
      files: [
        ["brief/now.md", "Current practice goal"],
        ["assets/README.md", "Source index"],
        ["assets/dinner-notes.md", "Fictional source notes"],
      ],
    },
    {
      id: "apps",
      letter: "A",
      name: "Apps",
      point: [-230, 120, -110],
      text: "The tools your agent can reach. Start with local files, then add a connection when a task needs it.",
      files: [
        ["connections.md", "Access and test register"],
        ["docs/GETTING-STARTED.md", "Set up your workspace"],
      ],
    },
    {
      id: "skills",
      letter: "S",
      name: "Skills",
      point: [40, -185, -95],
      text: "Saved methods for jobs you repeat. Six skills cover setup, context, planning, checking and improvement.",
      searchFiles: [
        [".claude/skills/setup-workspace/SKILL.md", "Set up your workspace"],
        [".agents/skills/setup-workspace/SKILL.md", "Set up in Codex"],
      ],
      files: [
        ["docs/SKILLS.md", "Six commands and examples"],
        [
          ".claude/skills/plan-one-task/SKILL.md",
          "Claude Code planning method",
        ],
        [".agents/skills/plan-one-task/SKILL.md", "Matching Codex method"],
      ],
    },
    {
      id: "tasks",
      letter: "T",
      name: "Tasks",
      point: [245, -65, 90],
      text: "One clear job, its inputs, a place to save the result, and the next action.",
      files: [
        ["projects/first-task/README.md", "Practice task and requirements"],
        ["templates/task-brief.md", "Reusable task brief"],
        ["examples/README.md", "Three practice workflows"],
      ],
    },
    {
      id: "evaluation",
      letter: "E",
      name: "Evaluation",
      point: [170, 160, -100],
      text: "Review the result against what you asked for. Keep findings connected to actual evidence.",
      files: [
        ["CHECK-YOUR-MASTER.md", "Workspace review checklist"],
        [".claude/skills/check-work/SKILL.md", "Review method"],
        ["templates/run-record.md", "Actual run record"],
      ],
    },
    {
      id: "refinement",
      letter: "R",
      name: "Refinement",
      point: [-20, 165, 140],
      text: "Turn useful feedback into a focused change, then check whether the next result improves.",
      files: [
        ["templates/feedback.md", "Coaching note"],
        [".claude/skills/refine-workflow/SKILL.md", "Improve the saved method"],
        [".agents/skills/refine-workflow/SKILL.md", "Matching Codex method"],
      ],
    },
  ];
  const canvas = document.getElementById("map"),
    ctx = canvas.getContext("2d"),
    details = document.getElementById("details"),
    nav = document.getElementById("pillars"),
    pointer = document.getElementById("demo-pointer");
  let yaw = -0.16,
    pitch = 0.12,
    zoom = 1,
    selected = null,
    drag = null,
    touring = false,
    tourStart = 0,
    lastPoints = [],
    hits = [];
  const RED = "#A51C30",
    INK = "#1E1B1B",
    BG = "#FBF7F0";
  function el(tag, text, cls) {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }
  function fileLink(path, label) {
    const a = el("a", path, "file-link");
    a.href = "../../" + path;
    a.append(el("span", label));
    return a;
  }
  function select(id) {
    selected = DATA.find((d) => d.id === id) || null;
    details.replaceChildren();
    details.append(
      el("h2", selected ? selected.name : "AIU-OS"),
      el(
        "p",
        selected
          ? selected.text
          : "Your context, projects and methods in one local workspace. Select a pillar to see where it lives.",
      ),
    );
    if (selected)
      for (const [path, label] of selected.files)
        details.append(fileLink(path, label));
    else {
      details.append(
        fileLink("CLAUDE.md", "The Claude Code operating map"),
        fileLink("AGENTS.md", "The Codex operating map"),
      );
    }
    for (const b of nav.children)
      b.setAttribute("aria-pressed", String(b.dataset.id === id));
    draw();
  }
  for (const d of DATA) {
    const b = el("button", d.name);
    b.dataset.id = d.id;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      stopTour();
      select(d.id);
    });
    nav.append(b);
  }
  function size() {
    const r = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [r.width, r.height];
  }
  function project(p, w, h) {
    const cy = Math.cos(yaw),
      sy = Math.sin(yaw),
      cp = Math.cos(pitch),
      sp = Math.sin(pitch);
    const x = p[0] * cy + p[2] * sy,
      z = -p[0] * sy + p[2] * cy,
      y = p[1] * 0.65 * cp - z * sp,
      depth = p[1] * 0.65 * sp + z * cp;
    const perspective = 760 / (760 + depth),
      scale = Math.min(w / 760, h / 500) * zoom;
    return {
      x: w * 0.5 + x * perspective * scale,
      y: h * 0.5 + y * perspective * scale,
      z: depth,
      s: perspective * scale,
    };
  }
  function round(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }
  function draw() {
    const [w, h] = size();
    ctx.clearRect(0, 0, w, h);
    const center = project([0, 0, 0], w, h);
    ctx.strokeStyle = "#E7DFD4";
    ctx.lineWidth = 1;
    for (const radius of [140, 240, 330]) {
      ctx.beginPath();
      for (let j = 0; j <= 90; j++) {
        const a = (j / 90) * Math.PI * 2,
          p = project(
            [
              Math.cos(a) * radius,
              Math.sin(a) * radius * 0.42,
              Math.sin(a) * radius * 0.7,
            ],
            w,
            h,
          );
        if (j === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    lastPoints = DATA.map((d) => ({ ...project(d.point, w, h), data: d }));
    for (const p of lastPoints) {
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = selected?.id === p.data.id ? RED : "#CFC5B9";
      ctx.lineWidth = selected?.id === p.data.id ? 2 : 1.1;
      ctx.stroke();
    }
    for (const p of [...lastPoints].sort((a, b) => b.z - a.z)) {
      const active = selected?.id === p.data.id,
        r = 27 * p.s;
      ctx.globalAlpha = Math.max(0.68, 1 - p.z / 700);
      ctx.fillStyle = active ? RED : BG;
      ctx.strokeStyle = active ? RED : "#8A837B";
      ctx.lineWidth = active ? 2.5 : 1.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = active ? "#fff" : RED;
      ctx.font = `900 ${25 * p.s}px Doto`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.data.letter, p.x, p.y + 1);
      const labelW = ctx.measureText(p.data.name).width;
      ctx.fillStyle = "#F9F3EA";
      round(p.x - labelW / 2 - 12, p.y + r + 8, labelW + 24, 27, 4);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.font = `400 ${Math.max(13, 16 * p.s)}px Outfit`;
      ctx.fillText(p.data.name, p.x, p.y + r + 21);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = RED;
    round(center.x - 62, center.y - 29, 124, 60, 10);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "400 22px Outfit";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AIU-OS", center.x, center.y + 2);
  }
  function stopTour() {
    touring = false;
    document.getElementById("tour").textContent = "Play tour";
    document.body.classList.remove("demo-mode");
  }
  function renderAt(t) {
    document.getElementById("tour").textContent = "Pause tour";
    document.body.classList.add("demo-mode");
    yaw = -0.28 + t * 0.04;
    pitch = 0.09 + Math.sin(t * 0.15) * 0.045;
    zoom = 1;
    const phase =
      t < 2
        ? null
        : t < 7
          ? "memory"
          : t < 12
            ? "skills"
            : t < 17
              ? "refinement"
              : null;
    if (selected?.id !== phase) select(phase);
    draw();
    const ids = ["memory", "skills", "refinement"];
    const index = Math.max(0, Math.min(2, Math.floor((t - 2) / 5))),
      button = nav.querySelector(`[data-id="${ids[index]}"]`),
      b = button.getBoundingClientRect();
    const start = {
        x:
          canvas.getBoundingClientRect().left +
          canvas.getBoundingClientRect().width * 0.6,
        y: canvas.getBoundingClientRect().top + 100,
      },
      q = Math.max(0, Math.min(1, (t - (2 + index * 5) + 0.8) / 0.8));
    const ease = q * q * (3 - 2 * q);
    pointer.style.left =
      start.x + (b.left + b.width / 2 - start.x) * ease + "px";
    pointer.style.top =
      start.y + (b.top + b.height / 2 - start.y) * ease + "px";
    const click = Math.abs(t - (2 + index * 5));
    pointer.querySelector("i").style.opacity =
      click < 0.3 ? String(1 - click / 0.3) : "0";
    pointer.style.opacity = t > 17 ? "0" : "1";
  }
  window.renderAt = renderAt;
  canvas.addEventListener("pointerdown", (e) => {
    stopTour();
    drag = { x: e.clientX, y: e.clientY, moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
    yaw += dx * 0.006;
    pitch = Math.max(-0.7, Math.min(0.7, pitch + dy * 0.004));
    drag.x = e.clientX;
    drag.y = e.clientY;
    draw();
  });
  canvas.addEventListener("pointerup", (e) => {
    if (drag && !drag.moved) {
      const r = canvas.getBoundingClientRect(),
        x = e.clientX - r.left,
        y = e.clientY - r.top;
      const hit = [...lastPoints]
        .sort((a, b) => a.z - b.z)
        .find((p) => Math.hypot(p.x - x, p.y - y) < 38 * p.s);
      if (hit) select(hit.data.id);
    }
    drag = null;
  });
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      stopTour();
      zoom = Math.max(0.65, Math.min(1.6, zoom - e.deltaY * 0.001));
      draw();
    },
    { passive: false },
  );
  document.getElementById("reset").onclick = () => {
    stopTour();
    yaw = -0.16;
    pitch = 0.12;
    zoom = 1;
    select(null);
  };
  document.getElementById("tour").onclick = () => {
    if (touring) {
      stopTour();
      return;
    }
    touring = true;
    tourStart = performance.now();
    document.getElementById("tour").textContent = "Pause tour";
    requestAnimationFrame(tick);
  };
  function tick(now) {
    if (!touring) return;
    const t = (now - tourStart) / 1000;
    renderAt(Math.min(t, 20));
    if (t < 20) requestAnimationFrame(tick);
    else stopTour();
  }
  document.getElementById("search").oninput = (e) => {
    stopTour();
    const q = e.target.value.trim().toLowerCase(),
      r = document.getElementById("results");
    r.replaceChildren();
    if (!q) return;
    hits = DATA.flatMap((d) =>
      [...d.files, ...(d.searchFiles || [])]
        .filter((f) =>
          (f[0] + " " + f[1] + " " + d.name).toLowerCase().includes(q),
        )
        .map((f) => ({ d, f })),
    );
    const unique = [...new Map(hits.map((x) => [x.f[0], x])).values()];
    for (const { f } of unique.slice(0, 5)) r.append(fileLink(f[0], f[1]));
    if (!hits.length) r.append(el("p", "No matching starter files."));
    else select(hits[0].d.id);
  };
  addEventListener("resize", draw);
  document.fonts.ready.then(() => {
    select(null);
    const fixed = new URLSearchParams(location.search).get("t");
    if (fixed !== null) renderAt(Number(fixed) || 0);
  });
})();
