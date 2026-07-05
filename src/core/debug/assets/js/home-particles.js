(function() {
    var cv = document.getElementById('op-canvas');
    var cx = cv.getContext('2d');
    var W, H;

    function resize() {
        W = cv.width  = window.innerWidth;
        H = cv.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    /* palette sable / poussière du désert */
    var COLORS = [
        '#150F04','#150F04','#150F04','#150F04',
        '#150F04','#150F04','#150F04','#150F04'
    ];

    /* génère une particule */
    function mkParticle() {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 2.2 + 0.4,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            alpha: Math.random() * 0.45 + 0.15,
            /* vitesse : chute lente + dérive latérale (vent du désert) */
            vy: Math.random() * 0.55 + 0.18,
            vx: (Math.random() - 0.38) * 0.30,
            /* oscillation sinusoïdale */
            wobble: Math.random() * Math.PI * 2,
            ws:     Math.random() * 0.018 + 0.004,
            wa:     Math.random() * 0.6 + 0.2,
        };
    }

    var N = 220;
    var pts = [];
    for (var i = 0; i < N; i++) pts.push(mkParticle());

    function tick() {
        cx.clearRect(0, 0, W, H);
        for (var i = 0; i < N; i++) {
            var p = pts[i];
            p.wobble += p.ws;
            p.x += p.vx + Math.sin(p.wobble) * p.wa * 0.25;
            p.y += p.vy;

            /* recycle en haut quand hors écran */
            if (p.y > H + 6)  { p.y = -6;  p.x = Math.random() * W; }
            if (p.x >  W + 6) { p.x = -6; }
            if (p.x < -6)     { p.x = W + 6; }

            cx.save();
            cx.globalAlpha = p.alpha;
            cx.fillStyle   = p.color;
            cx.beginPath();
            cx.arc(p.x, p.y, p.r, 0, 6.283);
            cx.fill();
            cx.restore();
        }
        requestAnimationFrame(tick);
    }
    tick();
})();