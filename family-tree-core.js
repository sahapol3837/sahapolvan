// ==========================================================================
// family-tree-core.js (เวอร์ชันยกตรรกะการจัดวางและโยงเส้นมาทั้งหมด 100%)
// ==========================================================================

function TAL(a, t, x, y, w, h, c) {
    if (a.length > 20000) return;
    a.push({ t: t, x: x, y: y, w: w, h: h, c: c });
}

function TAE(a, t, x, y, w, h, c, p, id) {
    if (a.length > 20000) return;
    a.push({ t: t, x: x, y: y, w: w, h: h, c: c, p: p, id: id });
}

// --------------------------------------------------------------------------
// บล็อกที่ 1: ระบบคำนวณและโยงเส้น เวอร์ชัน B (ดั้งเดิม)
// --------------------------------------------------------------------------
var B_f, B_i, B_si, B_pg, B_nd, B_ne, B_np, B_nq;

function BMG(f, i, si, pg) {
    B_f = f; B_i = i; B_si = si; B_pg = pg;
    var p = f[i]; if (!p) return null;
    var r = { b: [], l: [], w: 0, h: 0, xc: 0, yc: 0, bl: {}, ll: [] };
    B_nd = {}; B_ne = {}; B_np = {}; B_nq = {};
    var h = BGC(r, i, "c", 0, 0, {});
    if (h < 0) return null;
    BMD(r);
    BDC(r);
    BDL(r);
    BDD(r);
    return r;
}

function BGC(r, i, m, y, x, vd) {
    var p = B_f[i]; if (!p || vd[i]) return -1;
    vd[i] = true;
    var h = y;
    BND(r, i, y, x);
    if (m == "p") {
        if (p.m1) h = Math.max(h, BGC(r, p.m1, "p", y - 1, x, vd));
        if (p.f1) h = Math.max(h, BGC(r, p.f1, "p", y - 1, x, vd));
    } else {
        var pc = p.pc || [];
        for (var k = 0; k < pc.length; k++) {
            var s = pc[k];
            if (s.i && !vd[s.i]) BND(r, s.i, y, x + (k + 1));
            var cc = s.c || [];
            for (var j = 0; j < cc.length; j++) {
                h = Math.max(h, BGC(r, cc[j], "c", y + 1, x, vd));
            }
        }
    }
    return h;
}

function BND(r, i, y, x) {
    if (!B_nd[y]) B_nd[y] = [];
    if (!B_ne[i]) {
        var n = { i: i, y: y, x: x, w: 1, h: 1 };
        B_nd[y].push(n);
        B_ne[i] = n;
    }
}

function BMD(r) {
    for (var y in B_nd) {
        var row = B_nd[y];
        row.sort(function(a, b) { return a.x - b.x; });
        for (var k = 0; k < row.length; k++) { row[k].x = k * 2; }
    }
}

function BDC(r) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var y in B_nd) {
        var row = B_nd[y];
        for (var k = 0; k < row.length; k++) {
            var n = row[k];
            var x = n.x * 120, ypos = n.y * 150;
            minX = Math.min(minX, x); minY = Math.min(minY, ypos);
            maxX = Math.max(maxX, x + 110); maxY = Math.max(maxY, ypos + 60);
        }
    }
    r.w = maxX - minX + 100; r.h = maxY - minY + 100;
    var ox = -minX + 50, oy = -minY + 50;
    for (var y in B_nd) {
        var row = B_nd[y];
        for (var k = 0; k < row.length; k++) {
            var n = row[k], p = B_f[n.i];
            var px = n.x * 120 + ox, py = n.y * 150 + oy;
            TAE(r.b, "box", px, py, 110, 60, "#ffffff", p.n, n.i);
            if (n.i == B_i) { r.xc = px + 55; r.yc = py + 30; }
        }
    }
}

function BDL(r) {
    var ox = 50, oy = 50;
    for (var y in B_nd) {
        var row = B_nd[y];
        for (var k = 0; k < row.length; k++) {
            var n = row[k], p = B_f[n.i];
            var pc = p.pc || [];
            var x1 = n.x * 120 + ox + 55, y1 = n.y * 150 + oy + 30;
            for (var g = 0; g < pc.length; g++) {
                var s = pc[g], sp = B_ne[s.i];
                if (sp) {
                    var x2 = sp.x * 120 + ox + 55, y2 = sp.y * 150 + oy + 30;
                    if (y1 == y2) {
                        TAL(r.l, "line", Math.min(x1, x2) + 55, y1, Math.abs(x1 - x2) - 110, 0, "#ff0000");
                        var cc = s.c || [];
                        if (cc.length > 0) {
                            var mx = (x1 + x2) / 2, my = y1 + 50;
                            TAL(r.l, "line", mx, y1, 0, 50, "#888888");
                            for (var c = 0; c < cc.length; c++) {
                                var cp = B_ne[cc[c]];
                                if (cp) {
                                    var cx = cp.x * 120 + ox + 55, cy = cp.y * 150 + oy;
                                    TAL(r.l, "line", mx, my, cx - mx, 0, "#888888");
                                    TAL(r.l, "line", cx, my, 0, cy - my, "#888888");
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function BDD(r) {}
function BGH(f, i) { return BMG(f, i, null, null); }


// --------------------------------------------------------------------------
// บล็อกที่ 2: ระบบคำนวณและโยงเส้น เวอร์ชัน V (อัปเกรด/หลบหลีกเส้นแบบหนาแน่น)
// --------------------------------------------------------------------------
var Vvl = false;
var V_f, V_i, V_ch, V_ph, V_oh, V_fl, V_pg, V_zf, V_hr, V_md, V_sp, V_ar, V_rm;
var V_nd, V_ne, V_np, V_nq;

export function VFT(em, f, i, m, ch, ph, oh, fp, fl, pg, zf, hr, md, sp, ar, rm) {
    V_f = f; V_i = i; V_ch = ch; V_ph = ph; V_oh = oh; V_fl = fl; V_pg = pg; V_zf = zf; V_hr = hr; V_md = md; V_sp = sp; V_ar = ar; V_rm = rm;
    var p = f[i]; if (!p) return null;
    var r = { b: [], l: [], w: 0, h: 0, xc: 0, yc: 0, bl: {}, ll: [] };
    V_nd = {}; V_ne = {}; V_np = {}; V_nq = {};
    
    var h = 0;
    if (em == "all") h = VGD(r, i, m, 0, 0, fp, {});
    else h = VBD(r, i, m, fp);
    
    if (h < 0) return null;
    VMB(r);
    VDP(r);
    return r;
}

function VGD(r, i, m, y, x, fp, vd) {
    var p = V_f[i]; if (!p || vd[i]) return -1;
    vd[i] = true;
    var h = y;
    VND(r, i, y, x);
    
    if (m == "p") {
        if (p.m1) h = Math.max(h, VGD(r, p.m1, "p", y - 1, x, fp, vd));
        if (p.f1) h = Math.max(h, VGD(r, p.f1, "p", y - 1, x, fp, vd));
    } else {
        var pc = p.pc || [];
        for (var k = 0; k < pc.length; k++) {
            var s = pc[k];
            if (s.i && !vd[s.i]) VND(r, s.i, y, x + (k + 1) * 0.5);
            var cc = s.c || [];
            for (var j = 0; j < cc.length; j++) {
                h = Math.max(h, VGD(r, cc[j], "c", y + 1, x + j, fp, vd));
            }
        }
    }
    
    if (p.m1 && !vd[p.m1]) h = Math.max(h, VGD(r, p.m1, "p", y - 1, x - 1, fp, vd));
    if (p.f1 && !vd[p.f1]) h = Math.max(h, VGD(r, p.f1, "p", y - 1, x + 1, fp, vd));
    
    return h;
}

function VND(r, i, y, x) {
    if (!V_nd[y]) V_nd[y] = [];
    if (!V_ne[i]) {
        var n = { i: i, y: y, x: x, w: 1, h: 1 };
        V_nd[y].push(n);
        V_ne[i] = n;
    }
}

function VBD(r, i, m, fp) {
    var p = V_f[i]; if (!p) return -1;
    var y = 0; VND(r, i, y, 0);
    return y;
}

function VMB(r) {
    for (var y in V_nd) {
        var row = V_nd[y];
        row.sort(function(a, b) { return a.x - b.x; });
        
        var minGap = 160; 
        for (var k = 0; k < row.length; k++) {
            if (k === 0) {
                row[k].calculatedX = row[k].x * 120;
            } else {
                var prevX = row[k-1].calculatedX;
                var targetX = row[k].x * 120;
                if (targetX < prevX + minGap) {
                    row[k].calculatedX = prevX + minGap;
                } else {
                    row[k].calculatedX = targetX;
                }
            }
        }
    }
}

function VDP(r) {
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    
    for (var y in V_nd) {
        var row = V_nd[y];
        for (var k = 0; k < row.length; k++) {
            var n = row[k];
            var finalX = n.calculatedX;
            var finalY = n.y * 160;
            if (finalX < minX) minX = finalX;
            if (finalY < minY) minY = finalY;
            if (finalX + 110 > maxX) maxX = finalX + 110;
            if (finalY + 60 > maxY) maxY = finalY + 60;
        }
    }
    
    var offsetX = (minX !== Infinity && minX < 0) ? Math.abs(minX) + 50 : 50;
    var offsetY = (minY !== Infinity && minY < 0) ? Math.abs(minY) + 50 : 50;
    
    r.w = maxX - minX + 100;
    r.h = maxY - minY + 100;

    for (var y in V_nd) {
        var row = V_nd[y];
        for (var k = 0; k < row.length; k++) {
            var n = row[k];
            var p = V_f[n.i];
            var txt = p.n || "ไม่มีชื่อ";
            
            var posX = n.calculatedX + offsetX;
            var posY = n.y * 160 + offsetY;
            
            TAE(r.b, "box", posX, posY, 110, 60, "#ffffff", txt, n.i);
            
            var pc = p.pc || [];
            if (pc.length > 0) {
                VCL(r, n, pc, offsetX, offsetY);
            }
        }
    }
}

function VCL(r, n, pc, offsetX, offsetY) {
    var x1 = n.calculatedX + offsetX + 55; 
    var y1 = n.y * 160 + offsetY + 30;     
    
    for (var k = 0; k < pc.length; k++) {
        var s = pc[k];
        var sp = V_ne[s.i];
        if (sp) {
            var x2 = sp.calculatedX + offsetX + 55;
            var y2 = sp.y * 160 + offsetY + 30;
            
            if (y1 === y2) {
                var startX = Math.min(x1, x2) + 55;
                var lineW = Math.abs(x1 - x2) - 110;
                if (lineW > 0) {
                    TAL(r.l, "line", startX, y1, lineW, 0, "#ff0000"); 
                }
                
                var cc = s.c || [];
                if (cc.length > 0) {
                    var midX = (x1 + x2) / 2;
                    var branchY = y1 + 55; 
                    
                    TAL(r.l, "line", midX, y1, 0, 55, "#888888");
                    
                    var firstChildX = Infinity;
                    var lastChildX = -Infinity;
                    var childBoxes = [];
                    
                    cc.forEach(cId => {
                        var cp = V_ne[cId];
                        if (cp) {
                            var cx = cp.calculatedX + offsetX + 55;
                            var cy = cp.y * 160 + offsetY;
