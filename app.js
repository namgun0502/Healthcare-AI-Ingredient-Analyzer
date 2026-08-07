// app.js - 약물 보관함(Cabinet) 등록 & 챗봇 대조 분석 자바스크립트 비즈니스 로직
// 남건이 이해하기 쉽도록 주석을 상세하게 달았습니다.

// DOM 요소
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

const photoUploadBtn = document.getElementById('photo-upload-btn');
const imageUploadInput = document.getElementById('image-upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const previewFilename = document.getElementById('preview-filename');
const removeImgBtn = document.getElementById('remove-img-btn');

const cabinetListEl = document.getElementById('cabinet-list');
const cabinetCountEl = document.getElementById('cabinet-count');
const clearCabinetBtn = document.getElementById('clear-cabinet-btn');

const jsonOutput = document.getElementById('json-output');
const copyJsonBtn = document.getElementById('copy-json-btn');

// 1. 내 약물 보관함 (Cabinet) 상태 관리 (LocalStorage 연동)
let cabinet = JSON.parse(localStorage.getItem('my_medicine_cabinet')) || [
    { id: 1, name: "종합비타민 (비타민D 1,000 IU)", type: "건강기능식품", selected: true, ingredients: ["비타민D", "비타민C", "아연"] },
    { id: 2, name: "아스피린장용정 100mg", type: "의약품", selected: true, ingredients: ["아스피린"] }
];

let selectedImageFile = null;

// 초기 보관함 렌더링
renderCabinet();

// 샘플 시나리오 데이터
const sampleData = {
    vitamin_d: {
        text: "닥터비타 울트라 비타민D 5000 IU (주성분: 비타민D3 125mcg, 칼슘 200mg)",
        result: {
            identification: {
                product_name: "닥터비타 울트라 비타민D 5000 IU",
                type: "건강기능식품",
                main_ingredients: [{ name: "비타민D3", amount: "125mcg (5,000 IU)" }, { name: "칼슘", amount: "200mg" }],
                confidence_score: "HIGH"
            },
            dosage_guide: { recommended_daily: "1일 1회 1캡슐 식후 섭취", precautions: ["기존 종합비타민 용량을 합산해 확인하세요."] },
            risk_analysis: { has_risk: true, risk_level: "WARNING", warnings: ["성분 중복 과다 위험: 보관함의 '종합비타민(1,000 IU)'과 본 제품(5,000 IU)을 함께 드시면 일일 상한량(4,000 IU)을 초과하여 고칼슘혈증 및 독성 위험이 발생합니다."] },
            user_summary: "🚨 [보관함 대조 분석] 선택하신 '종합비타민'과 신규 '비타민 D 5000IU' 성분이 중복되어 하루 권장량을 초과합니다!"
        }
    },
    aspirin_vitk: {
        text: "센트럼 파워 멀티비타민 (주성분: 비타민K 70mcg, 비타민C 100mg)",
        result: {
            identification: {
                product_name: "센트럼 파워 멀티비타민",
                type: "건강기능식품",
                main_ingredients: [{ name: "비타민K", amount: "70mcg" }, { name: "비타민C", amount: "100mg" }],
                confidence_score: "HIGH"
            },
            dosage_guide: { recommended_daily: "1일 1회 1정 섭취", precautions: ["항응고제 복용 환자는 비타민 K 섭취 전 의사 상의 필요"] },
            risk_analysis: { has_risk: true, risk_level: "WARNING", warnings: ["약효 저해 상호작용: 보관함의 '아스피린(항응고제)'과 신규 제품의 비타민 K 지혈 작용이 아스피린의 약효를 방해합니다."] },
            user_summary: "🚨 [보관함 대조 분석] 보관함에 등록된 '아스피린'과 본 제품의 비타민 K 성분이 반대 작용을 유발합니다."
        }
    },
    thyroid_calcium: {
        text: "파워 칼슘 앤 마그네슘 (주성분: 칼슘 300mg)",
        result: {
            identification: {
                product_name: "파워 칼슘 앤 마그네슘",
                type: "건강기능식품",
                main_ingredients: [{ name: "칼슘", amount: "300mg" }],
                confidence_score: "HIGH"
            },
            dosage_guide: { recommended_daily: "1일 1회 섭취", precautions: ["갑상선약과 4시간 이상 간격을 두세요."] },
            risk_analysis: { has_risk: true, risk_level: "CAUTION", warnings: ["흡수 방해: 칼슘이 갑상선 호르몬제(신지로이드)와 결합하여 약물 흡수를 방해합니다."] },
            user_summary: "⚠️ [보관함 대조 분석] 보관함의 '갑상선약'과 본 칼슘 영양제를 같이 드시면 약이 흡수되지 않으므로 4시간 간격을 두세요."
        }
    },
    acne_vita: {
        text: "니메겐 연질캡슐 (이소트레티노인 - 여드름 치료제)",
        result: {
            identification: {
                product_name: "니메겐 연질캡슐",
                type: "의약품",
                main_ingredients: [{ name: "이소트레티노인", amount: "10mg" }],
                confidence_score: "HIGH"
            },
            dosage_guide: { recommended_daily: "의사 처방용법 준수", precautions: ["비타민 A 영양제 병용 금지"] },
            risk_analysis: { has_risk: true, risk_level: "WARNING", warnings: ["비타민 A 과다 중독 위험 발생 (두통, 뇌압 상승 등 부작용)"] },
            user_summary: "🚨 [보관함 대조 분석] 여드름약과 비타민 A 영양제 병용 시 중독 부작용 위험이 있으니 절대 동시 복용하지 마세요."
        }
    }
};

// 2. 약물 보관함 (Cabinet) UI 렌더링 함수
function renderCabinet() {
    cabinetCountEl.textContent = cabinet.length;
    localStorage.setItem('my_medicine_cabinet', JSON.stringify(cabinet));

    if (cabinet.length === 0) {
        cabinetListEl.innerHTML = `<div style="text-align: center; font-size: 0.78rem; color: #8b949e; padding: 1rem;">보관함이 비어 있습니다.<br>사진/텍스트 분석 후 [보관함에 저장]해보세요!</div>`;
        return;
    }

    cabinetListEl.innerHTML = cabinet.map(item => `
        <div class="cabinet-item ${item.selected ? 'selected' : ''}">
            <div class="cabinet-item-left">
                <input type="checkbox" data-id="${item.id}" ${item.selected ? 'checked' : ''} class="cabinet-checkbox">
                <div class="cabinet-item-info">
                    <span class="cabinet-name" title="${item.name}">${item.name}</span>
                    <span class="cabinet-type">${item.type}</span>
                </div>
            </div>
            <button class="delete-item-btn" data-id="${item.id}" title="삭제">✕</button>
        </div>
    `).join('');

    // 체크박스 클릭 이벤트 연결
    document.querySelectorAll('.cabinet-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
            const id = Number(e.target.getAttribute('data-id'));
            const target = cabinet.find(x => x.id === id);
            if (target) {
                target.selected = e.target.checked;
                renderCabinet();
            }
        });
    });

    // 개별 삭제 이벤트
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = Number(e.target.getAttribute('data-id'));
            cabinet = cabinet.filter(x => x.id !== id);
            renderCabinet();
        });
    });
}

// 전체 비우기
clearCabinetBtn.addEventListener('click', () => {
    if (confirm("내 약물 보관함을 비우시겠습니까?")) {
        cabinet = [];
        renderCabinet();
    }
});

// 3. 사진 업로드 픽커 이벤트
photoUploadBtn.addEventListener('click', () => imageUploadInput.click());

imageUploadInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        selectedImageFile = e.target.files[0];
        previewFilename.textContent = selectedImageFile.name;
        imagePreviewContainer.classList.remove('hidden');
        if (!chatInput.value.trim()) {
            chatInput.value = `[약/영양제 이미지 첨부: ${selectedImageFile.name}] 이 약 성분을 분석하고 내 보관함 복용약들과 대조해 줘.`;
        }
    }
});

removeImgBtn.addEventListener('click', () => {
    selectedImageFile = null;
    imageUploadInput.value = '';
    imagePreviewContainer.classList.add('hidden');
});

// 4. 샘플 칩 클릭
document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        if (sampleData[key]) {
            chatInput.value = sampleData[key].text;
            handleSendMessage();
        }
    });
});

// 5. 메시지 전송 및 대조 처리
sendBtn.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

function handleSendMessage() {
    const userText = chatInput.value.trim();
    if (!userText && !selectedImageFile) return;

    // 선택된 보관함 복용약 목록 가져오기
    const selectedCabinetItems = cabinet.filter(x => x.selected);

    appendUserMessage(userText || `[이미지 분석 요청: ${selectedImageFile.name}]`);

    chatInput.value = '';
    selectedImageFile = null;
    imagePreviewContainer.classList.add('hidden');

    const loadingBubble = appendAiLoadingMessage();

    setTimeout(() => {
        chatHistory.removeChild(loadingBubble);

        let analysisResult;
        let matchedSampleKey = null;

        Object.keys(sampleData).forEach(k => {
            if (sampleData[k].text === userText) matchedSampleKey = k;
        });

        if (matchedSampleKey) {
            analysisResult = sampleData[matchedSampleKey].result;
        } else {
            analysisResult = generateCustomCrossCheckAnalysis(userText, selectedCabinetItems);
        }

        // AI 응답 말풍선 출력 (내 보관함 저장 버튼 포함)
        appendAiResponseMessage(analysisResult);

        // JSON 업데이트
        jsonOutput.textContent = JSON.stringify(analysisResult, null, 2);

        chatHistory.scrollTop = chatHistory.scrollHeight;
    }, 600);
}

// 유저 말풍선
function appendUserMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble user-bubble';
    bubble.innerHTML = `
        <div class="avatar">👤</div>
        <div class="bubble-content"><p>${escapeHtml(text)}</p></div>
    `;
    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// AI 로딩
function appendAiLoadingMessage() {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble ai-bubble';
    bubble.innerHTML = `
        <div class="avatar">✨</div>
        <div class="bubble-content"><p>⏳ 선택하신 보관함 약물들과 대조하여 성분 및 위험성을 분석 중입니다...</p></div>
    `;
    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return bubble;
}

// AI 응답 말풍선 (보관함 추가 버튼 기능 제공)
function appendAiResponseMessage(res) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble ai-bubble';

    const riskLevel = res.risk_analysis.risk_level;
    const badgeClass = `badge-${riskLevel.toLowerCase()}`;

    let warningHtml = '';
    if (res.risk_analysis.warnings.length > 0) {
        warningHtml = `
            <div style="margin-top: 0.5rem; color: #f87171; font-weight: 600;">
                ⚠️ <strong>보관함 약물 대조 위험:</strong>
                <ul style="padding-left: 1.2rem; font-size: 0.88rem; font-weight: normal; margin-top: 0.2rem;">
                    ${res.risk_analysis.warnings.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    const prodName = res.identification.product_name;
    const prodType = res.identification.type;

    bubble.innerHTML = `
        <div class="avatar">✨</div>
        <div class="bubble-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong>AI 성분 & 대조 분석 결과</strong>
                <span class="risk-badge-inline ${badgeClass}">${riskLevel}</span>
            </div>
            
            <p style="margin-bottom: 0.6rem; line-height: 1.5;">${res.user_summary}</p>

            ${warningHtml}

            <div class="report-card-inline">
                <p><strong>제품명:</strong> ${prodName} (${prodType})</p>
                <p><strong>주성분:</strong> ${res.identification.main_ingredients.map(i => `${i.name} (${i.amount})`).join(', ') || '정보 없음'}</p>
                <p><strong>복용 가이드:</strong> ${res.dosage_guide.recommended_daily}</p>
                
                <button class="save-cabinet-btn" onclick="saveToCabinet('${escapeHtml(prodName)}', '${escapeHtml(prodType)}')">
                    💾 [내 약물 보관함]에 이 약 추가하기
                </button>
            </div>
        </div>
    `;

    chatHistory.appendChild(bubble);
}

// 보관함 저장 글로벌 함수
window.saveToCabinet = function(name, type) {
    if (cabinet.some(x => x.name === name)) {
        alert("이미 보관함에 저장되어 있는 제품입니다.");
        return;
    }
    cabinet.push({
        id: Date.now(),
        name: name,
        type: type,
        selected: true,
        ingredients: [name]
    });
    renderCabinet();
    alert(`'${name}' 제품이 내 약물 보관함에 성공적으로 저장되었습니다!`);
};

// 동적 보관함 대조 분석 엔진
function generateCustomCrossCheckAnalysis(productText, selectedCabinetItems) {
    const cabinetNames = selectedCabinetItems.map(x => x.name).join(", ");
    const text = (productText + " " + cabinetNames).toLowerCase();

    let riskLevel = "SAFE";
    let hasRisk = false;
    let warnings = [];
    let userSummaryText = selectedCabinetItems.length > 0 
        ? `선택하신 보관함 약물들(${selectedCabinetItems.length}개)과 본 제품 간 부작용이 발견되지 않았습니다.` 
        : "제품 분석이 완료되었습니다. 보관함에서 대조할 복용약을 체크해 주세요.";

    if ((text.includes("아스피린") || text.includes("와파린")) && text.includes("비타민k")) {
        riskLevel = "WARNING";
        hasRisk = true;
        warnings.push("보관함의 아스피린과 신규 제품의 비타민 K 간 약효 방해 작용 검출");
        userSummaryText = "🚨 [보관함 대조] 보관함의 아스피린과 신규 제품의 비타민 K가 약효를 방해합니다.";
    } else if (text.includes("갑상선") && (text.includes("칼슘") || text.includes("철분"))) {
        riskLevel = "CAUTION";
        hasRisk = true;
        warnings.push("보관함의 갑상선약과 칼슘/철분제 간 흡수 방해 작용 검출");
        userSummaryText = "⚠️ [보관함 대조] 보관함의 갑상선약과 본 제품은 4시간 이상 간격을 두어야 합니다.";
    } else if (text.includes("비타민d") && (text.includes("종합비타민") || text.includes("비타민 d"))) {
        riskLevel = "WARNING";
        hasRisk = true;
        warnings.push("보관함 기존 영양제와 비타민 D 성분 중복으로 일일 권장 상한량 초과 위험");
        userSummaryText = "🚨 [보관함 대조] 보관함 약물과 비타민 D 성분이 중복되어 하루 권장량을 초과할 수 있습니다.";
    }

    return {
        identification: {
            product_name: productText.split('(')[0] || productText,
            type: productText.includes("약") ? "의약품" : "건강기능식품",
            main_ingredients: [{ name: "입력/추출 성분", amount: "표기 함량" }],
            confidence_score: "HIGH"
        },
        dosage_guide: {
            recommended_daily: "제품 용법 준수",
            precautions: ["의사 또는 약사와 상담 권장"]
        },
        risk_analysis: {
            has_risk: hasRisk,
            risk_level: riskLevel,
            warnings: warnings
        },
        user_summary: userSummaryText
    };
}

function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function (s) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s];
    });
}

// JSON 복사
copyJsonBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(jsonOutput.textContent).then(() => {
        copyJsonBtn.textContent = "복사 완료! ✅";
        setTimeout(() => { copyJsonBtn.textContent = "JSON 복사"; }, 2000);
    });
});

console.log("보관함 저장 & 대조 분석 스크립트 준비 완료.");
