// ==========================================================================
// family-tree-core.js (เวอร์ชันปรับปรุงความแม่นยำ ล็อกตำแหน่งพ่อแม่-ลูก)
// ==========================================================================

function TAL(a, t, x, y, w, h, c) {
    if (a.length > 20000) return;
    a.push({ t: t, x: x, y: y, w: w, h: h, c: c });
}

function TAE(a, t, x, y, w, h, c, p, id) {
    if (a.length > 20000) return;
    a.push({ t: t, x: x, y: y, w: w, h: h, c: c, p: p, id: id });
}

export function VFT(em, f, i, m, ch, ph, oh, fp, fl, pg, zf, hr, md, sp, ar, rm) {
    var r = { b: [], l: [], w: 0, h: 0, xc: 0, yc: 0, bl: {}, ll: [] };
    
    // บล็อกนี้จะคำนวณ Generation (ระดับชั้น Y) และวางลำดับพี่น้องแบบจับกลุ่มครอบครัว
    var positions = {};
    var visited = {};
    
    // ตั้งต้นระดับชั้นความสูง (Y-Axis)
    function assignLevels(currentId, currentLevel) {
        if (!currentId || visited[currentId]) return;
        visited[currentId] = true;
        
        if (!positions[currentLevel]) positions[currentLevel] = [];
        if (!positions[currentLevel].includes(currentId)) {
            positions[currentLevel].push(currentId);
        }
        
        var person = f[currentId];
        if (!person) return;
        
        // พาคู่สมรสขึ้นมาอยู่ระดับชั้นเดียวกันทันที
        var pc = person.pc || [];
        pc.forEach(s => {
            if (!positions[currentLevel].includes(s.i)) {
                positions[currentLevel].push(s.i);
            }
            // พาลูกลงไปชั้นถัดไป
            var cc = s.c || [];
            cc.forEach(cId => assignLevels(cId, currentLevel + 1));
        });
        
        // พาพี่น้องคนอื่นที่มาจากพ่อแม่เดียวกันขึ้นมาระดับเดียวกัน
        if (person.m1 || person.f1) {
            for (var id in f) {
                if ((f[id].m1 === person.m1 && f[id].m1) || (f[id].f1 === person.f1 && f[id].f1)) {
                    if (!positions[currentLevel].includes(id)) {
                        positions[currentLevel].push(id);
                    }
                }
            }
        }
    }
    
    // รันการจัดชั้นจาก ID หลัก (เภา)
    assignLevels("1", 0);
    
    // จัดกลุ่มพิกัด X แบบสัมพันธ์กัน (ล็อกพ่อแม่เคียงข้างกัน และลูกอยู่ตรงกลางใต้คู่สมรส)
    var finalCoordinates = {};
    var currentXOffset = {};
    
    // ไล่จัดลำดับจากชั้นบนลงล่างอย่างเป็นระบบ
    var levels = Object.keys(positions).sort((a, b) => a - b);
    
    levels.forEach(lvl => {
        var idsInLevel = positions[lvl];
        var xStart = 50;
        
        idsInLevel.forEach(id => {
            if (finalCoordinates[id]) return; // จัดพิกัดไปแล้วข้าม
            
            var person = f[id];
            // ถ้าคนนี้มีพ่อแม่ ให้พยายามคำนวณตำแหน่ง X ให้อยู่กึ่งกลางใต้พ่อแม่ก่อน
            if (person && (person.m1 || person.f1)) {
                var p1X = finalCoordinates[person.m1] ? finalCoordinates[person.m1].x : null;
                var p2X = finalCoordinates[person.f1] ? finalCoordinates[person.f1].x : null;
                if (p1X !== null && p2X !== null) {
                    xStart = (p1X + p2X) / 2;
                } else if (p1X !== null) {
                    xStart = p1X;
                } else if (p2X !== null) {
                    xStart = p2X;
                }
            }
            
            // เช็กไม่ให้ทับกับกล่องก่อนหน้าในระดับเดียวกัน
            if (currentXOffset[lvl] && xStart < currentXOffset[lvl] + 160) {
                xStart = currentXOffset[lvl] + 160;
            }
            
            finalCoordinates[id] = { x: xStart, y: lvl * 160 + 50 };
            currentXOffset[lvl] = xStart;
            
            // ดึงคู่สมรสมาวางไว้ข้างๆ ทันที
            if (person && person.pc) {
                person.pc.forEach(s => {
                    if (!finalCoordinates[s.i]) {
                        xStart += 160;
                        finalCoordinates[s.i] = { x: xStart, y: lvl * 160 + 50 };
                        currentXOffset[lvl] = xStart;
                    }
                });
            }
        });
    });

    // สั่งบันทึกพิกัดกล่องส่งไปเรนเดอร์ใน index.html
    for (var id in finalCoordinates) {
        var p = f[id];
        if (p) {
            TAE(r.b, "box", finalCoordinates[id].x, finalCoordinates[id].y, 110, 60, "#ffffff", p.n, id);
        }
    }

    // คำนวณขีดเส้นโยงความสัมพันธ์ใหม่ทั้งหมดตามตำแหน่งพิกัดที่แท้จริง
    for (var id in f) {
        var person = f[id];
        if (!person || !finalCoordinates[id]) continue;
        
        var pc = person.pc || [];
        pc.forEach(s => {
            if (!finalCoordinates[s.i]) return;
            
            var x1 = finalCoordinates[id].x + 55;
            var y1 = finalCoordinates[id].y + 30;
            var x2 = finalCoordinates[s.i].x + 55;
            var y2 = finalCoordinates[s.i].y + 30;
            
            // ลากเส้นเชื่อมระหว่างคู่สมรส (เส้นสีแดงจุดประ)
            var startSpouseX = Math.min(x1, x2) + 55;
            var spouseLineW = Math.abs(x1 - x2) - 110;
            if (spouseLineW > 0) {
                TAL(r.l, "line", startSpouseX, y1, spouseLineW, 0, "#ff0000");
            }
            
            // ลากเส้นกิ่งแยกหักศรลงไปหาลูกๆ ทุกคนที่เกิดจากคู่นี้
            var cc = s.c || [];
            if (cc.length > 0) {
                var midSpouseX = (x1 + x2) / 2;
                var branchY = y1 + 50; // ระดับชั้นพักเส้นแนวนอน
                
                // ลากจากจุดกึ่งกลางคู่รักลงมาหาทางแยก
                TAL(r.l, "line", midSpouseX, y1, 0, 50, "#888888");
                
                var minChildX = Infinity;
                var maxChildX = -Infinity;
                var validChildren = [];
                
                cc.forEach(cId => {
                    if (finalCoordinates[cId]) {
                        var cx = finalCoordinates[cId].x + 55;
                        var cy = finalCoordinates[cId].y;
                        if (cx < minChildX) minChildX = cx;
                        if (cx > maxChildX) maxChildX = cx;
                        validChildren.push({ x: cx, y: cy });
                    }
                });
                
                if (validChildren.length > 0) {
                    // ขีดทางแยกแนวนอน
                    TAL(r.l, "line", minChildX, branchY, maxChildX - minChildX, 0, "#888888");
                    // ขีดเจาะหัวกล่องลูกแต่ละคน
                    validChildren.forEach(cb => {
                        TAL(r.l, "line", cb.x, branchY, 0, cb.y - branchY, "#888888");
                    });
                }
            }
        });
    }

    return r;
}
