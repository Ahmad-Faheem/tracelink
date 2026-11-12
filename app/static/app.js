// TraceLink Frontend Script

const input = document.getElementById("long-url");
const button = document.getElementById("shorten-btn");
const message = document.getElementById("message");
const result = document.getElementById("result");
const shortLink = document.getElementById("short-link");
const longLink = document.getElementById("long-link");
const previewLink = document.getElementById("preview-link");
const copyBtn = document.getElementById("copy-btn");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

// --- 1. Theme Toggle Logic ---
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeIcon.textContent = savedTheme === "light" ? "☀️" : "🌙";
  } else {
    // Default dark theme
    document.documentElement.setAttribute("data-theme", "dark");
    themeIcon.textContent = "🌙";
  }
}

themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  themeIcon.textContent = newTheme === "light" ? "☀️" : "🌙";
});

initTheme();

// --- 2. Floating ML Nodes Canvas Animation ---
const canvas = document.getElementById("bg-nodes");
const ctx = canvas.getContext("2d");

let width, height;
let nodes = [];

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

class Node {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = (Math.random() - 0.5) * 0.8;
    this.radius = Math.random() * 2 + 1.5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  draw() {
    const nodeColor = getComputedStyle(document.documentElement).getPropertyValue('--node-color').trim() || "56, 189, 248";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${nodeColor}, 0.8)`;
    ctx.fill();
  }
}

function initNodes() {
  nodes = [];
  const count = Math.floor((width * height) / 18000); // Responsive density
  for (let i = 0; i < count; i++) {
    nodes.push(new Node());
  }
}

initNodes();

function animateNodes() {
  ctx.clearRect(0, 0, width, height);
  const nodeColor = getComputedStyle(document.documentElement).getPropertyValue('--node-color').trim() || "56, 189, 248";

  // Draw connections between close nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 130) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = `rgba(${nodeColor}, ${1 - dist / 130})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  }

  nodes.forEach(node => {
    node.update();
    node.draw();
  });

  requestAnimationFrame(animateNodes);
}

animateNodes();

// --- 3. Shortener Logic ---
function setMessage(text, kind) {
  message.textContent = text;
  message.className = "message" + (kind ? " " + kind : "");
}

async function shorten() {
  const longUrl = input.value.trim();
  if (!longUrl) { setMessage("Enter a URL first.", "error"); return; }

  button.disabled = true;
  setMessage("Shortening…");
  result.hidden = true;

  try {
    const res = await fetch("/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ long_url: longUrl }),
    });
    const data = await res.json();

    if (!res.ok) {
      const detail = Array.isArray(data.detail) ? data.detail[0].msg : data.detail;
      setMessage(detail || "Could not shorten that URL.", "error");
      return;
    }

    shortLink.href = data.short_url;
    shortLink.textContent = data.short_url;
    longLink.textContent = data.long_url;
    previewLink.href = data.short_url + "+";
    previewLink.textContent = data.short_url + "+";

    result.hidden = false;
    setMessage("Short link created.", "ok");
  } catch (err) {
    setMessage("Network error. Is the server running?", "error");
  } finally {
    button.disabled = false;
  }
}

button.addEventListener("click", shorten);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") shorten(); });
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shortLink.href);
    setMessage("Copied.", "ok");
  } catch {
    setMessage("Copy failed — select the link and copy manually.", "error");
  }
});