// ============================================================
// Landing page: particles, clock, routing to gym or portfolio.
// Loaded as a classic script before main.js (module).
// ============================================================
(function () {
    'use strict';

    // ---------- Particle field ----------
    const canvas = document.getElementById('landing-canvas');
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let mouse = { x: -9999, y: -9999 };
    let rafId = null;
    let running = true;

    function resize() {
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Cool/calm palette — soft blue, sage, warm beige, slate
    const PALETTE = [
        { fill: 'rgba(29, 57, 212, 0.95)', glow: 'rgba(29, 57, 212, 0.55)' }, // blue
        { fill: 'rgba(180, 180, 180, 0.92)', glow: 'rgba(180, 180, 180, 0.5)' },  // sage
        { fill: 'rgba(240, 192, 64, 0.92)', glow: 'rgba(240, 192, 64, 0.5)' },  // beige
        { fill: 'rgba(46, 53, 64, 0.35)', glow: 'rgba(46, 53, 64, 0.0)' }          // slate dot
    ];

    function seed() {
        const density = Math.min(280, Math.floor((w * h) / 7000));
        particles = [];
        for (let i = 0; i < density; i++) {
            const palIdx = Math.random() < 0.6
                ? Math.floor(Math.random() * 3)              // bright accent
                : 3;                                         // slate dot
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.42,
                vy: (Math.random() - 0.5) * 0.42,
                r: Math.random() * 2.2 + 0.6,
                wobble: Math.random() * Math.PI * 2,
                palIdx
            });
        }
    }

    function step() {
        if (!running) return;
        ctx.clearRect(0, 0, w, h);

        const t = performance.now() * 0.001;

        // Connection lines
        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];
            a.x += a.vx + Math.sin(t + a.wobble) * 0.06;
            a.y += a.vy + Math.cos(t * 0.8 + a.wobble) * 0.06;
            if (a.x < 0 || a.x > w) a.vx *= -1;
            if (a.y < 0 || a.y > h) a.vy *= -1;

            // Mouse repel
            const mdx = a.x - mouse.x;
            const mdy = a.y - mouse.y;
            const md2 = mdx * mdx + mdy * mdy;
            if (md2 < 18000) {
                const f = (18000 - md2) / 18000;
                a.x += (mdx / Math.sqrt(md2 + 0.01)) * f * 1.6;
                a.y += (mdy / Math.sqrt(md2 + 0.01)) * f * 1.6;
            }

            for (let j = i + 1; j < particles.length; j++) {
                const b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < 16000) {
                    const alpha = (1 - d2 / 16000) * 0.32;
                    // alternate line tint based on particles' palette
                    const tint = (a.palIdx + b.palIdx) % 2 === 0
                        ? `rgba(29, 57, 212, ${alpha})`
                        : `rgba(180, 180, 180, ${alpha})`;
                    ctx.strokeStyle = tint;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        // Particles — pulsing radius
        for (const p of particles) {
            const col = PALETTE[p.palIdx];
            const pulse = p.palIdx < 3
                ? 1 + Math.sin(t * 1.4 + p.wobble) * 0.18
                : 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
            ctx.fillStyle = col.fill;
            if (p.palIdx < 3) {
                ctx.shadowColor = col.glow;
                ctx.shadowBlur = 18;
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        rafId = requestAnimationFrame(step);
    }

    function startParticles() {
        resize();
        seed();
        if (rafId) cancelAnimationFrame(rafId);
        running = true;
        step();
    }

    function stopParticles() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
    }

    window.addEventListener('resize', () => {
        if (document.getElementById('landing-page').classList.contains('fade-out')) return;
        resize();
        seed();
    });

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseout', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    // ---------- Clock ----------
    const clockEl = document.getElementById('footer-clock');
    function tickClock() {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        clockEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} LOCAL`;
    }
    tickClock();
    setInterval(tickClock, 1000);

    // ---------- Routing ----------
    const landing = document.getElementById('landing-page');
    const portfolio = document.getElementById('portfolio-page');

    function hideLanding() {
        landing.classList.add('fade-out');
        setTimeout(() => { landing.style.display = 'none'; stopParticles(); }, 650);
    }

    function showLanding() {
        landing.style.display = 'flex';
        landing.classList.remove('fade-out');
        startParticles();
    }

    function enterGym() {
        hideLanding();
        const loading = document.getElementById('loading-screen');
        loading.style.display = 'flex';
        loading.classList.remove('fade-out');

        // Resolution readout
        const resEl = document.getElementById('load-res');
        if (resEl) resEl.textContent = `${window.innerWidth}×${window.innerHeight}`;

        // Animate percentage counter from 0 → 100 in sync with CSS bar (1.4s, 0.3s delay)
        const pctEl = loading.querySelector('.load-pct');
        if (pctEl) {
            pctEl.textContent = '0';
            const DURATION = 1400;
            const DELAY = 300;
            const startAt = performance.now() + DELAY;
            const tick = (now) => {
                const t = Math.max(0, Math.min(1, (now - startAt) / DURATION));
                pctEl.textContent = Math.round(t * 100);
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }

        const tryInit = () => {
            if (typeof window.__initGym === 'function') {
                window.__initGym();
            } else {
                setTimeout(tryInit, 40);
            }
        };
        setTimeout(tryInit, 250);
    }

    function enterPortfolio() {
        hideLanding();
        setTimeout(() => {
            portfolio.style.display = 'flex';
            portfolio.scrollTop = 0;
        }, 500);
    }

    function backToLanding() {
        portfolio.style.display = 'none';
        showLanding();
    }

    document.getElementById('enter-gym-btn').addEventListener('click', enterGym);
    document.getElementById('view-portfolio-btn').addEventListener('click', enterPortfolio);
    document.getElementById('portfolio-back').addEventListener('click', backToLanding);
    document.getElementById('portfolio-to-gym').addEventListener('click', () => {
        portfolio.style.display = 'none';
        enterGym();
    });

    // Kick off
    startParticles();
})();
