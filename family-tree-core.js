// ==========================================================================
// family-tree-core.js (ชุดเต็มสำหรับการจัดโครงสร้างและคำนวณสายสัมพันธ์)
// ==========================================================================

function TAL(a, t, x, y, w, h, c) {
    if (a.length > 20000) return;
    a.push({ t: t, x: x, y: y, w: w, h: h, c: c });
}

function TAE(a, t, x, y, w, h, c, p, id) {
    if (a.length > 20000) return;
    a.push({ t: t, x: x, y: y, w: w, h: h, c: c, p: p, id: id });
}

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
    
    // ดึงเครือญาติสายตรงที่เหลือมาคำนวณตำแหน่งพื้นฐานร่วมด้วย
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
    // ระบบคำนวณและกระจายพิกัด X ของกล่องในระนาบเดียวกันเพื่อป้องกันไม่ให้กล่องซ้อนทับกัน
    for (var y in V_nd) {
        var row = V_nd[y];
        row.sort(function(a, b) { return a.x - b.x; });
        
        var minGap = 160; // ระยะห่างแนวนอนขั้นต่ำระหว่างศูนย์กลางกล่อง
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
    
    // ค้นหาขอบเขตพิกัดต่ำสุดเพื่อเซ็ตระยะชิดซ้าย-บนให้สมดุล
    for (var y in V_nd) {
        var row = V_nd[y];
        for (var k = 0; k < row.length; k++) {
            var n = row[k];
            var finalX = n.calculatedX;
            var finalY = n.y * 140;
            if (finalX < minX) minX = finalX;
            if (finalY < minY) minY = finalY;
        }
    }
    
    var offsetX = (minX !== Infinity && minX < 0) ? Math.abs(minX) + 50 : 50;
    var offsetY = (minY !== Infinity && minY < 0) ? Math.abs(minY) + 50 : 50;

    // ลูปหลักสั่งบันทึกพิกัดตำแหน่งกล่องและส่งต่อไปยังฟังก์ชันลากเส้น
    for (var y in V_nd) {
        var row = V_nd[y];
        for (var k = 0; k < row.length; k++) {
            var n = row[k];
            var p = V_f[n.i];
            var txt = p.n || "ไม่มีชื่อ";
            
            var posX = n.calculatedX + offsetX;
            var posY = n.y * 140 + offsetY;
            
            // บันทึกตำแหน่งกล่องลงในตัวแปรสำหรับเอาไปเรนเดอร์เป็น div หน้าเว็บ
            TAE(r.b, "box", posX, posY, 110, 60, "#ffffff", txt, n.i);
            
            var pc = p.pc || [];
            if (pc.length > 0) {
                VCL(r, n, pc, offsetX, offsetY);
            }
        }
    }
}

function VCL(r, n, pc, offsetX, offsetY) {
    var x1 = n.calculatedX + offsetX + 55; // จุดกึ่งกลางกล่องต้นทาง X
    var y1 = n.y * 140 + offsetY + 30;     // จุดกึ่งกลางกล่องต้นทาง Y
    
    for (var k = 0; k < pc.length; k++) {
        var s = pc[k];
        var sp = V_ne[s.i];
        if (sp) {
            var x2 = sp.calculatedX + offsetX + 55;
            var y2 = sp.y * 140 + offsetY + 30;
            
            // if-else ตรวจสอบประเภทคู่สมรสและลูกเพื่อแยกสไตล์การโยงเส้น
            if (y1 === y2) {
                // กรณีที่เป็นคู่สมรส (ระนาบเดียวกัน) ลากเส้นประเชื่อมตรงกันตรงกลาง
                var startX = Math.min(x1, x2) + 55;
                var lineW = Math.abs(x1 - x2) - 110;
                if (lineW > 0) {
                    TAL(r.l, "line", startX, y1, lineW, 0, "#ff0000"); // สีแดงสำหรับคู่ครอง
                }
                
                // คำนวณเส้นหักมุมลากเชื่อมจากคู่สมรสลงไปหาลูก ๆ (ถ้ามีลูก)
                var cc = s.c || [];
                if (cc.length > 0) {
                    var midX = (x1 + x2) / 2;
                    var branchY = y1 + 45; // จุดพักเส้นแนวนอนกึ่งกลางระหว่างรุ่น
                    
                    // เส้นหลักลากลงมาจากจุดกึ่งกลางคู่ครอง
                    TAL(r.l, "line", midX, y1, 0, 45, "#888888");
                    
                    var firstChildX = Infinity;
                    var lastChildX = -Infinity;
                    var childBoxes = [];
                    
                    cc.forEach(cId => {
                        var cp = V_ne[cId];
                        if (cp) {
                            var cx = cp.calculatedX + offsetX + 55;
                            var cy = cp.y * 140 + offsetY;
                            if (cx < firstChildX) firstChildX = cx;
                            if (cx > lastChildX) lastChildX = cx;
                            childBoxes.push({ x: cx, y: cy });
                        }
                    });
                    
                    // ลากเส้นแนวนอนกระจายกิ่งไปตามพิกัดของลูกทุกคน
                    if (childBoxes.length > 0) {
                        TAL(r.l, "line", firstChildX, branchY, lastChildX - firstChildX, 0, "#888888");
                        // ลากเส้นแนวดิ่งเจาะลงหัวกล่องของลูกแต่ละคน
                        childBoxes.forEach(cb => {
                            TAL(r.l, "line", cb.x, branchY, 0, cb.y - branchY, "#888888");
                        });
                    }
                }
            }
        }
    }
}

function VVR(hs, y, x1, x2) {
    if (x1 > x2) { var t = x1; x1 = x2; x2 = t; }
    if (!hs[y]) return false;
    for (var k = 0; k < hs[y].length; k++) {
        var h = hs[y][k];
        if (h.x1 < x2 && h.x2 > x1) return true;
    }
    return false;
}

function VVV(hs, y, x1, x2) {
    if (x1 > x2) { var t = x1; x1 = x2; x2 = t; }
    if (!hs[y]) hs[y] = [];
    hs[y].push({ x1: x1, x2: x2 });
}

function VAH(hs, y, x1, x2) {
    if (x1 == x2) return y;
    var d = 0;
    while (VVR(hs, y + d, x1, x2)) { d += 4; }
    VVV(hs, y + d, x1, x2);
    return y + d;
}

function VAV(vs, x, y1, y2) {
    if (y1 > y2) { var t = y1; y1 = y2; y2 = t; }
    if (!vs[x]) vs[x] = [];
    vs[x].push({ y1: y1, y2: y2 });
}

function VFC(hs, y1, y2, x) {
    for (var y = y1; y <= y2; y++) {
        if (VVR(hs, y, x, x)) return true;
    }
    return false;
}
