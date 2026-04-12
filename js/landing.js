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

    function seed() {
        const density = Math.min(140, Math.floor((w * h) / 14000));
        particles = [];
        for (let i = 0; i < density; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: Math.random() * 1.4 + 0.4,
                hue: Math.random() < 0.15 ? 'accent' : 'light'
            });
        }
    }

    function step() {
        if (!running) return;
        ctx.clearRect(0, 0, w, h);

        // Connection lines
        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];
            a.x += a.vx;
            a.y += a.vy;
            if (a.x < 0 || a.x > w) a.vx *= -1;
            if (a.y < 0 || a.y > h) a.vy *= -1;

            // Mouse repel
            const mdx = a.x - mouse.x;
            const mdy = a.y - mouse.y;
            const md2 = mdx * mdx + mdy * mdy;
            if (md2 < 14000) {
                const f = (14000 - md2) / 14000;
                a.x += (mdx / Math.sqrt(md2 + 0.01)) * f * 1.2;
                a.y += (mdy / Math.sqrt(md2 + 0.01)) * f * 1.2;
            }

            for (let j = i + 1; j < particles.length; j++) {
                const b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < 12000) {
                    const alpha = (1 - d2 / 12000) * 0.18;
                    ctx.strokeStyle = `rgba(233, 69, 96, ${alpha})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        // Particles
        for (const p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            if (p.hue === 'accent') {
                ctx.fillStyle = 'rgba(233, 69, 96, 0.9)';
                ctx.shadowColor = 'rgba(233, 69, 96, 0.7)';
                ctx.shadowBlur = 10;
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
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
        // Show gym loading screen then init three.js (exposed by main.js)
        const loading = document.getElementById('loading-screen');
        loading.style.display = 'flex';
        loading.classList.remove('fade-out');
        // main.js registers window.__initGym when module loads
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
