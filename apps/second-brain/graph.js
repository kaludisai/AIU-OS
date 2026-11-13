/* AIU-OS perspective graph: seeded layout, orbit camera, real note connections. */
(function () {
  "use strict";
  function random(seed) {
    return () => {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class KnowledgeGraph {
    constructor(canvas, onSelect, onHover) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.onSelect = onSelect;
      this.onHover = onHover;
      this.nodes = [];
      this.links = [];
      this.selected = "";
      this.matches = null;
      this.neighbors = new Set();
      this.hover = null;
      this.rotating = false;
      this.cam = { yaw: 0.3, pitch: -0.1, distance: 800, target: 800 };
      this.width = 1;
      this.height = 1;
      this.projected = [];
      this.fit = this.fit.bind(this);
      this.resize = new ResizeObserver(this.fit);
      this.resize.observe(canvas);
      this.bind();
      this.previous = 0;
      this.loop = (time) => {
        const dt = Math.min(50, time - (this.previous || time));
        this.previous = time;
        if (
          this.rotating &&
          !this.drag &&
          !matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          this.cam.yaw += dt * 0.00009;
        this.cam.distance += (this.cam.target - this.cam.distance) * 0.18;
        this.draw();
        this.frame = requestAnimationFrame(this.loop);
      };
      this.frame = requestAnimationFrame(this.loop);
    }

    fit() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = Math.max(1, rect.width);
      this.height = Math.max(1, rect.height);
      const dpr = Math.min(devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.width * dpr);
      this.canvas.height = Math.round(this.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    setData(graph) {
      const rand = random(42026);
      const groups = [...new Set(graph.nodes.map((n) => n.group))].sort();
      this.nodes = graph.nodes.map((n) => {
        const angle =
          (groups.indexOf(n.group) / Math.max(1, groups.length)) * Math.PI * 2;
        const hub = n.degree > 8;
        return {
          ...n,
          x: Math.cos(angle) * (hub ? 150 : 210) + (rand() - 0.5) * 190,
          y: Math.sin(angle) * (hub ? 150 : 210) + (rand() - 0.5) * 190,
          z: (rand() - 0.5) * 380,
          vx: 0,
          vy: 0,
          vz: 0,
        };
      });
      const byId = new Map(this.nodes.map((n) => [n.id, n]));
      this.links = graph.links.map((l) => ({
        source: byId.get(l.source),
        target: byId.get(l.target),
      }));
      // Settle once. Nodes stay still while the camera moves, avoiding jitter.
      // Keep a bounded cost for larger imports (the app accepts up to 500 notes).
      const ticks = this.nodes.length > 250 ? 100 : 240;
      for (let tick = 0; tick < ticks; tick++) {
        const alpha = 1 - tick / ticks;
        for (let i = 0; i < this.nodes.length; i++) {
          const a = this.nodes[i];
          for (let j = i + 1; j < this.nodes.length; j++) {
            const b = this.nodes[j];
            const dx = b.x - a.x,
              dy = b.y - a.y,
              dz = b.z - a.z;
            const d2 = Math.max(4, dx * dx + dy * dy + dz * dz);
            if (d2 > 100000) continue;
            const force = ((1850 / d2) * alpha) / Math.sqrt(d2);
            a.vx -= dx * force;
            a.vy -= dy * force;
            a.vz -= dz * force;
            b.vx += dx * force;
            b.vy += dy * force;
            b.vz += dz * force;
          }
        }
        for (const { source: a, target: b } of this.links) {
          const dx = b.x - a.x,
            dy = b.y - a.y,
            dz = b.z - a.z;
          const d = Math.hypot(dx, dy, dz) || 1;
          const force = (0.007 * (d - 95) * alpha) / d;
          a.vx += dx * force;
          a.vy += dy * force;
          a.vz += dz * force;
          b.vx -= dx * force;
          b.vy -= dy * force;
          b.vz -= dz * force;
        }
        for (const n of this.nodes) {
          n.vx = (n.vx - n.x * 0.00025 * alpha) * 0.8;
          n.vy = (n.vy - n.y * 0.00025 * alpha) * 0.8;
          n.vz = (n.vz - n.z * 0.00025 * alpha) * 0.8;
          n.x += n.vx;
          n.y += n.vy;
          n.z += n.vz;
        }
      }
      this.setSelection(this.selected);
      this.reset();
    }

    reset() {
      const radius = Math.max(
        150,
        ...this.nodes.map((n) => Math.hypot(n.x, n.y, n.z)),
      );
      const focal = Math.min(this.width, this.height) * 0.98;
      const distance =
        radius + (radius * focal) / (Math.min(this.width, this.height) * 0.52);
      this.cam = { yaw: 0.3, pitch: -0.1, distance, target: distance };
    }

    setSelection(id) {
      this.selected = id;
      this.neighbors = new Set([id]);
      for (const l of this.links) {
        if (l.source.id === id) this.neighbors.add(l.target.id);
        if (l.target.id === id) this.neighbors.add(l.source.id);
      }
    }

    setMatches(ids) {
      this.matches = ids ? new Set(ids) : null;
    }

    project(n) {
      const { yaw, pitch, distance } = this.cam;
      const x = n.x * Math.cos(yaw) + n.z * Math.sin(yaw);
      const z = -n.x * Math.sin(yaw) + n.z * Math.cos(yaw);
      const y = n.y * Math.cos(pitch) - z * Math.sin(pitch);
      const vz = distance - (n.y * Math.sin(pitch) + z * Math.cos(pitch));
      if (vz <= 1) return null;
      const scale = (Math.min(this.width, this.height) * 0.98) / vz;
      return {
        node: n,
        x: this.width / 2 + x * scale,
        y: this.height / 2 - y * scale,
        scale,
        depth: vz,
      };
    }

    draw() {
      const ctx = this.ctx,
        w = this.width,
        h = this.height;
      ctx.clearRect(0, 0, w, h);
      // A quiet spatial grid establishes perspective without decorative UI.
      ctx.strokeStyle = "rgba(251,247,240,0.025)";
      ctx.lineWidth = 1;
      for (let x = (w / 2) % 44; x < w; x += 44) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = (h / 2) % 44; y < h; y += 44) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const projected = this.nodes.map((n) => this.project(n)).filter(Boolean);
      this.projected = projected;
      const byId = new Map(projected.map((p) => [p.node.id, p]));
      for (const link of this.links) {
        const a = byId.get(link.source.id),
          b = byId.get(link.target.id);
        if (!a || !b) continue;
        const active =
          a.node.id === this.selected || b.node.id === this.selected;
        const filtered =
          this.matches &&
          (!this.matches.has(a.node.id) || !this.matches.has(b.node.id));
        ctx.strokeStyle = filtered
          ? "rgba(207,58,82,0.035)"
          : active
            ? "rgba(234,96,116,0.6)"
            : "rgba(207,169,174,0.17)";
        ctx.lineWidth = active ? 1.1 : 0.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      const sorted = projected.sort((a, b) => b.depth - a.depth);
      for (const p of sorted) {
        const { node: n, x, y, scale } = p;
        const dim = this.matches && !this.matches.has(n.id);
        const selected = n.id === this.selected;
        const connected = this.neighbors.has(n.id);
        const radius = Math.max(
          1.7,
          Math.min(8, (3.2 + Math.sqrt(n.degree) * 1.4) * scale),
        );
        p.radius = radius;
        ctx.globalAlpha = dim
          ? 0.12
          : connected
            ? 1
            : Math.max(0.45, Math.min(0.9, scale));
        ctx.fillStyle = selected
          ? "#FBF7F0"
          : n.degree > 8
            ? "#EA6074"
            : connected
              ? "#DD7C8A"
              : "#A9767F";
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        if (selected || (this.hover && this.hover.id === n.id)) {
          ctx.strokeStyle = "#EA6074";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
          ctx.stroke();
          if (selected) {
            ctx.strokeStyle = "rgba(234,96,116,0.2)";
            ctx.beginPath();
            ctx.arc(x, y, radius + 11, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      // Greedy collision avoidance keeps hub labels readable at all zoom levels.
      const labels = [];
      const candidates = [...projected].sort(
        (a, b) =>
          Number(b.node.id === this.selected) -
            Number(a.node.id === this.selected) ||
          b.node.degree - a.node.degree,
      );
      ctx.font = "13px Outfit, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (const p of candidates) {
        if (this.matches && !this.matches.has(p.node.id)) continue;
        const selected = p.node.id === this.selected;
        if (!selected && p.node.degree < 5) continue;
        if (labels.length >= 13 && !selected) continue;
        const text =
          p.node.title.length > 30
            ? p.node.title.slice(0, 28) + "…"
            : p.node.title;
        const width = ctx.measureText(text).width + 12;
        const rect = {
          x: p.x - width / 2,
          y: p.y + p.radius + 9,
          w: width,
          h: 21,
        };
        if (
          rect.x < 8 ||
          rect.x + width > w - 8 ||
          rect.y > h - 40 ||
          rect.y < 2
        )
          continue;
        if (
          !selected &&
          labels.some(
            (r) =>
              rect.x < r.x + r.w &&
              rect.x + rect.w > r.x &&
              rect.y < r.y + r.h &&
              rect.y + rect.h > r.y,
          )
        )
          continue;
        labels.push(rect);
        ctx.fillStyle = "#161313";
        ctx.fillRect(rect.x, rect.y - 1, rect.w, rect.h);
        ctx.fillStyle = selected ? "#FBF7F0" : "#CFC8BF";
        ctx.fillText(text, p.x, rect.y + 1);
      }
    }

    bind() {
      const canvas = this.canvas;
      const point = (e) => {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
      };
      const pick = ({ x, y }) =>
        [...this.projected]
          .sort((a, b) => a.depth - b.depth)
          .find((p) => Math.hypot(p.x - x, p.y - y) < (p.radius || 5) + 6)
          ?.node;
      canvas.addEventListener("pointerdown", (e) => {
        this.drag = {
          ...point(e),
          yaw: this.cam.yaw,
          pitch: this.cam.pitch,
          moved: 0,
          node: pick(point(e)),
        };
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener("pointermove", (e) => {
        const p = point(e);
        if (this.drag) {
          const dx = p.x - this.drag.x,
            dy = p.y - this.drag.y;
          this.drag.moved = Math.max(this.drag.moved, Math.hypot(dx, dy));
          this.cam.yaw = this.drag.yaw + dx * 0.005;
          this.cam.pitch = Math.max(
            -1.4,
            Math.min(1.4, this.drag.pitch + dy * 0.005),
          );
        } else {
          this.hover = pick(p);
          canvas.style.cursor = this.hover ? "pointer" : "grab";
          this.onHover(this.hover);
        }
      });
      canvas.addEventListener("pointerup", (e) => {
        if (this.drag && this.drag.moved < 5 && this.drag.node)
          this.onSelect(this.drag.node.id);
        this.drag = null;
        if (canvas.hasPointerCapture(e.pointerId))
          canvas.releasePointerCapture(e.pointerId);
      });
      canvas.addEventListener("pointercancel", () => {
        this.drag = null;
      });
      canvas.addEventListener("pointerleave", () => {
        this.hover = null;
        this.onHover(null);
      });
      canvas.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          this.cam.target = Math.max(
            280,
            Math.min(3000, this.cam.target * Math.pow(1.001, e.deltaY)),
          );
        },
        { passive: false },
      );
    }
  }
  window.AIUGraph = KnowledgeGraph;
})();
