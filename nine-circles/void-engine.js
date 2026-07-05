/* ══════════════════════════════════════════════════════════════
   NINE CIRCLES — SHARED VOID ENGINE
   Generates the smoky "void" tendril/ooze layer used by both the
   Second Circle Header Creator and the Ov Grid Creator.

   Usage: each tool creates an offscreen canvas context (od), a
   seeded RNG via makeRng(seed), and a cfg object with the tuned
   parameters below, then calls spawnEdge / gapTendrils / oozeEdge /
   poolCluster to paint tendrils and pooled mass onto od. Finally
   call applyBlur(od-canvas, cfg.blur) and composite the result over
   the album art.

   cfg shape: { density, length, thickness, branch, ooze, wispy,
                opacity, blur }
   ══════════════════════════════════════════════════════════════ */

function makeRng(seed) {
    let s = seed >>> 0;
    return () => {
        s += 0x6D2B79F5;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function eblob(od, cx, cy, rx, ry, angleDeg) {
    const a = angleDeg * Math.PI / 180;
    od.beginPath();
    for (let i = 0; i <= 20; i++) {
        const t = i/20 * 2*Math.PI;
        const x = cx + rx*Math.cos(t)*Math.cos(a) - ry*Math.sin(t)*Math.sin(a);
        const y = cy + rx*Math.cos(t)*Math.sin(a) + ry*Math.sin(t)*Math.cos(a);
        i === 0 ? od.moveTo(x, y) : od.lineTo(x, y);
    }
    od.closePath();
    od.fill();
}

function buildSpine(rng, cfg, sx, sy, angle, length, rootR) {
    const steps = Math.max(10, Math.floor(length/8));
    const stepLen = length/steps;
    const f1 = 0.6+rng()*1.0, f2 = 2.0+rng()*2.5;
    const a1 = cfg.wispy*(0.35+rng()*0.35);
    const a2 = cfg.wispy*(0.18+rng()*0.22);
    const p1 = rng()*Math.PI*2, p2 = rng()*Math.PI*2;
    const bowBias = (rng()-0.5)*0.5;
    const doCoil = rng() < cfg.wispy*0.55;
    const coilStart = 0.5+rng()*0.25;
    const coilTurns = (1+rng()*1.3) * (rng()>0.5?1:-1);
    const taperExp = 1.0+rng()*0.9;
    const pinchFreq = 2+rng()*3;
    const pinchPhase = rng()*Math.PI*2;

    let curAngle = angle;
    let x = sx, y = sy;
    const pts = [[x,y]];
    const widths = [rootR];
    const alphas = [1];

    for (let i=1;i<=steps;i++) {
        const t = i/steps;
        curAngle += (Math.sin(t*f1*Math.PI*2+p1)*a1 + Math.sin(t*f2*Math.PI*2+p2)*a2) * 0.35;
        curAngle += bowBias*(1-t)*0.04;
        if (doCoil && t>coilStart) {
            curAngle += coilTurns*(Math.PI*2)*(1/steps)*3;
        }
        x += Math.cos(curAngle)*stepLen;
        y += Math.sin(curAngle)*stepLen;
        pts.push([x,y]);

        let w = rootR*Math.pow(1-t, taperExp) + 0.5;
        w *= 0.65+0.35*Math.sin(t*pinchFreq*Math.PI*2+pinchPhase);
        if (doCoil && t>coilStart) w *= 0.55;
        widths.push(Math.max(0.35,w));

        let al = 1 - t*0.5;
        al *= 0.7+0.3*Math.sin(t*(pinchFreq*1.7)*Math.PI*2+pinchPhase*1.3);
        alphas.push(Math.max(0.05, al));
    }
    return { pts, widths, alphas };
}

function fillRibbon(od, spine, baseAlpha) {
    const { pts, widths, alphas } = spine;
    if (pts.length < 2) return;
    for (let i = 0; i < pts.length-1; i++) {
        const [x0,y0] = pts[i], [x1,y1] = pts[i+1];
        const w0 = widths[i], w1 = widths[i+1];
        const dx = x1-x0, dy = y1-y0;
        const len = Math.hypot(dx,dy) || 1;
        const nx = -dy/len, ny = dx/len;
        const a = baseAlpha * ((alphas[i]+alphas[i+1])/2);
        od.beginPath();
        od.moveTo(x0+nx*w0, y0+ny*w0);
        od.lineTo(x1+nx*w1, y1+ny*w1);
        od.lineTo(x1-nx*w1, y1-ny*w1);
        od.lineTo(x0-nx*w0, y0-ny*w0);
        od.closePath();
        od.fillStyle = `rgba(0,0,0,${a.toFixed(3)})`;
        od.fill();
    }
}

function tendril(od, rng, cfg, sx, sy, angle, length, rootR, doRivulets=true) {
    const spine = buildSpine(rng, cfg, sx, sy, angle, length, rootR);
    fillRibbon(od, spine, cfg.opacity);
    if (!doRivulets || length < 10 || spine.pts.length < 4) return;

    const nBranches = Math.floor(rng()*3*cfg.branch);
    for (let b = 0; b < nBranches; b++) {
        const bi = 1 + Math.floor(rng()*(spine.pts.length-2));
        const [bx,by] = spine.pts[bi];
        const ba = angle + (rng()>0.5?1:-1)*(0.3+rng()*0.9);
        const bl = length*(0.2+rng()*0.5);
        const brt = spine.widths[bi]*(0.5+rng()*0.5);
        tendril(od, rng, cfg, bx, by, ba, bl, brt, bl > 10 && rng() < 0.4*cfg.branch);
    }
}

function spawnEdge(od, rng, cfg, x0,y0,x1,y1, baseAng, n) {
    n = Math.max(1, Math.round(n * cfg.density));
    for (let i = 0; i < n; i++) {
        const t   = 0.03 + rng()*0.94;
        let sx    = x0+(x1-x0)*t + (rng()-0.5)*10;
        let sy    = y0+(y1-y0)*t + (rng()-0.5)*10;
        const inset = 8 + rng()*20;
        sx += Math.cos(baseAng)*inset;
        sy += Math.sin(baseAng)*inset;
        tendril(od,rng,cfg, sx,sy,
                baseAng+(rng()-0.5)*1.3,
                (20+rng()*180)*cfg.length,
                (1.5+rng()*10)*cfg.thickness);
    }
}

function gapTendrils(od, rng, cfg, edgeL, edgeR, y0, y1, isVertical, GAP) {
    const n = Math.max(1, Math.round(30 * cfg.density));
    for (let i = 0; i < n; i++) {
        const p = y0 + 4 + rng()*(y1-y0-8);
        const lChoice = rng();
        const lenL = (lChoice < 0.4  ? 3 + rng()*GAP*0.6
                   : lChoice < 0.75 ? GAP*0.6 + rng()*GAP*0.9
                   :                  GAP*1.5 + rng()*GAP*3.0) * cfg.length;
        const angL = isVertical ? (rng()-0.5)*0.5
                                : Math.PI/2+(rng()-0.5)*0.5;
        const [sxL,syL] = isVertical ? [edgeL-2-rng()*8, p] : [p, edgeL-2-rng()*8];
        tendril(od,rng,cfg, sxL,syL, angL, lenL, (0.5+rng()*3)*cfg.thickness, lenL > GAP*1.5*cfg.length);

        const rChoice = rng();
        const lenR = (rChoice < 0.4  ? 3 + rng()*GAP*0.6
                   : rChoice < 0.75 ? GAP*0.6 + rng()*GAP*0.9
                   :                  GAP*1.5 + rng()*GAP*3.0) * cfg.length;
        const angR = isVertical ? Math.PI+(rng()-0.5)*0.5
                                : -Math.PI/2+(rng()-0.5)*0.5;
        const [sxR,syR] = isVertical ? [edgeR+2+rng()*8, p] : [p, edgeR+2+rng()*8];
        tendril(od,rng,cfg, sxR,syR, angR, lenR, (0.5+rng()*3)*cfg.thickness, lenR > GAP*1.5*cfg.length);
    }
    const mid = (edgeL+edgeR)/2;
    const nMid = Math.max(1, Math.round(6 * cfg.density));
    for (let i = 0; i < nMid; i++) {
        const p = y0 + 10 + rng()*(y1-y0-20);
        const perpAng = isVertical ? (rng()>0.5?Math.PI/2:-Math.PI/2)+(rng()-0.5)*0.5
                                   : (rng()>0.5?0:Math.PI)+(rng()-0.5)*0.5;
        const [scx,scy] = isVertical ? [mid+(rng()-0.5)*GAP, p] : [p, mid+(rng()-0.5)*GAP];
        tendril(od,rng,cfg, scx,scy, perpAng, (15+rng()*60)*cfg.length, (0.8+rng()*2.5)*cfg.thickness, false);
    }
}

function oozeEdge(od, rng, cfg, x0,y0,x1,y1, n, rlo,rhi, ea) {
    n = Math.max(1, Math.round(n * cfg.density));
    for (let i = 0; i < n; i++) {
        const t  = rng();
        const cx = x0+(x1-x0)*t + (rng()-0.5)*6;
        const cy = y0+(y1-y0)*t + (rng()-0.5)*6;
        const r  = (rlo + rng()*(rhi-rlo)) * cfg.ooze;
        poolCluster(od, rng, cfg, cx, cy, r, 2 + Math.floor(rng()*2));
    }
}

function applyBlur(sourceCanvas, radius) {
    if (radius <= 0) return sourceCanvas;
    const out = document.createElement('canvas');
    out.width = sourceCanvas.width; out.height = sourceCanvas.height;
    const octx = out.getContext('2d');
    octx.filter = `blur(${radius}px)`;
    octx.drawImage(sourceCanvas, 0, 0);
    return out;
}

function poolCluster(od, rng, cfg, cx, cy, baseR, count) {
    const boostedCfg = Object.assign({}, cfg, { wispy: Math.max(cfg.wispy, 0.55) });
    for (let i = 0; i < count; i++) {
        const ang = rng()*Math.PI*2;
        const len = baseR*(0.7+rng()*1.1);
        const rootR = baseR*(0.3+rng()*0.35);
        const ox = (rng()-0.5)*baseR*0.5;
        const oy = (rng()-0.5)*baseR*0.5;
        const spine = buildSpine(rng, boostedCfg, cx+ox, cy+oy, ang, len, rootR);
        fillRibbon(od, spine, cfg.opacity*(0.75+rng()*0.25));
    }
}

