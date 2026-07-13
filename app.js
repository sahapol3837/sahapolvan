// ฐานข้อมูลครอบครัว (จัดรูปแบบโครงข่าย Network)
const allFamilyData = {
    "father": {
        name: "คุณพ่อ สมชาย",
        gender: "male",
        relationships: [
            { spouseId: "ex_wife", type: "divorced", children: ["child_1"] },
            { spouseId: "current_wife", type: "married", children: ["child_2", "child_3"] }
        ]
    },
    "ex_wife": { name: "น้าดา (เมียเก่า)", gender: "female" },
    "current_wife": { name: "น้าฝน (เมียใหม่)", gender: "female" },
    "child_1": { name: "ลูกเมียเก่า (โต)", gender: "male" },
    "child_2": { name: "ลูกเมียใหม่ (กลาง)", gender: "female" },
    "child_3": { name: "ลูกเมียใหม่ (เล็ก)", gender: "male" }
};
// 1. ฟังก์ชันคำนวณพิกัดกล่อง (ที่ถอดรหัสมา)
function calculateFamilyLayout(person, allFamilyData) {
    const layoutResult = { spousePositions: {}, childrenPositions: {} };
    const allPartners = person.relationships || []; 
    if (allPartners.length === 0) return layoutResult;

    const baseGap = 1.6; // ระยะห่างช่องไฟ
    let leftOffset = -baseGap; 
    let rightOffset = baseGap;  

    allPartners.forEach((relation) => {
        const partnerId = relation.spouseId;
        let calculatedX = (relation.type === "divorced") ? leftOffset : rightOffset;
        if (relation.type === "divorced") leftOffset -= baseGap; else rightOffset += baseGap;

        layoutResult.spousePositions[partnerId] = { x: calculatedX, y: 0, type: relation.type };

        const childrenOfThisCouple = relation.children || [];
        if (childrenOfThisCouple.length > 0) {
            const centerOfCoupleX = (0 + calculatedX) / 2;
            const totalChildren = childrenOfThisCouple.length;
            const childSpacing = 1.2; 
            let currentChildX = centerOfCoupleX - ((totalChildren - 1) * childSpacing) / 2;

            childrenOfThisCouple.forEach((childId) => {
                layoutResult.childrenPositions[childId] = {
                    x: currentChildX,
                    y: 1.2, // ดันลูกลงไปเลเยอร์ด้านล่าง
                    parentConnectionX: centerOfCoupleX,
                    partnerX: calculatedX // พิกัดแกน X ของตัวแม่
                };
                currentChildX += childSpacing;
            });
        }
    });
    return layoutResult;
}
// กำหนดตัวแปรสำหรับแปลงพิกัดเป็นพิกเซลจอจริง
const scaleX = 160;   // กว้าง 1 หน่วย = 160px
const scaleY = 140;   // สูง 1 หน่วย = 140px
const centerX = 800;  // จุดกึ่งกลางจอ (ตำแหน่งของพ่อนั่นเอง)
const centerY = 150;  // ระยะห่างจากขอบบนเว็บ

const container = document.getElementById('tree-container');
const svgLayer = document.getElementById('svg-layer');

// ฟังก์ชันสร้างกล่องข้อความ HTML
function createBox(name, x, y, gender) {
    const box = document.createElement('div');
    box.className = `person-box ${gender}`;
    box.style.left = `${x - 70}px`; // ลบครึ่งหนึ่งของความกว้างกล่องเพื่อให้จุดศูนย์กลางแม่นยำ
    box.style.top = `${y - 30}px`;  // ลบครึ่งหนึ่งของความสูงกล่อง
    box.innerHTML = name;
    container.appendChild(box);
}

// ฟังก์ชันลากเส้น SVG หักฉากหลบกล่องสไตล์ Family Echo
function drawLine(x1, y1, x2, y2, isDivorced) {
    const path = document.createElementNS('http://w3.org', 'path');
    const midY = y1 + (y2 - y1) / 2; // หาจุดกึ่งกลางเลเยอร์ Y เพื่อหักเลี้ยวแนวราบ
    
    // M = จุดเริ่ม, L = ลากเส้นฉากตรงไปจุดต่างๆ
    const dValue = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
    path.setAttribute('d', dValue);
    path.setAttribute('class', `tree-line ${isDivorced ? 'divorced-line' : ''}`);
    svgLayer.appendChild(path);
}

// ================== เริ่มต้นทำงาน (Execution) ==================
const fatherData = allFamilyData["father"];

// 1. วาดพ่อไว้ตรงกลางเด่นๆ คนเดียว
createBox(fatherData.name, centerX, centerY, fatherData.gender);

// 2. คำนวณพิกัดด้วยสมองของ Family Echo
const layout = calculateFamilyLayout(fatherData, allFamilyData);

// 3. วาดเมียๆ และลากเส้นแต่งงานหลบกัน
Object.keys(layout.spousePositions).forEach(spouseId => {
    const pos = layout.spousePositions[spouseId];
    const sX = centerX + (pos.x * scaleX);
    const sY = centerY + (pos.y * scaleY);
    
    createBox(allFamilyData[spouseId].name, sX, sY, allFamilyData[spouseId].gender);
    
    // ลากเส้นแนวนอนเชื่อมคู่ครอง (หย่าร้างจะเป็นเส้นประสีแดง)
    drawLine(centerX, centerY, sX, sY, pos.type === "divorced");
});

// 4. วาดลูกๆ และลากเส้นดิ่งลงมาจากจุดกึ่งกลางของแต่ละคู่รัก
Object.keys(layout.childrenPositions).forEach(childId => {
    const pos = layout.childrenPositions[childId];
    const cX = centerX + (pos.x * scaleX);
    const cY = centerY + (pos.y * scaleY);
    
    createBox(allFamilyData[childId].name, cX, cY, allFamilyData[childId].gender);
    
    // หาจุดกึ่งกลางระหว่าง พ่อ กับ แม่คนนั้นๆ จริงๆ บนหน้าจอ
    const realParentPivotX = centerX + (pos.parentConnectionX * scaleX);
    const realParentPivotY = centerY + (scaleY / 2); // จุดหักเลี้ยวระหว่างชั้นของพ่อแม่
    
    // ลากเส้นจากจุดกึ่งกลางคู่รักดิ่งลงไปหาตัวลูก
    drawLine(realParentPivotX, realParentPivotY, cX, cY, false);
});
