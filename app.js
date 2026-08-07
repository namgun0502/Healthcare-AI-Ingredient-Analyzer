// app.js - Google AI Studio 대화형 챗 어시스턴트 자바스크립트 로직
// 남건이 쉽게 이해할 수 있도록 대화 흐름 기반으로 동작하도록 구성했습니다.

const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const existingMedsInput = document.getElementById('existing-meds');
const jsonOutput = document.getElementById('json-output');
const copyJsonBtn = document.getElementById('copy-json-btn');

// 샘플 데이터
const sampleData = {
    vitamin_d: {
        text: "닥터비타 울트라 비타민D 5000 IU (주성분: 비타민D3 125mcg, 칼슘 200mg)",
        meds: "종합비타민 (비타민D 1,000 IU 포함)",
        result: {
            identification: {
                product_name: "닥터비타 울트라 비타민D 5000 IU",
                type: "건강기능식품",
                main_ingredients: [
                    { name: "비타민D3", amount: "125mcg (5,000 IU)" },
                    { name: "칼슘", amount: "200mg" }
                ],
                confidence_score: "HIGH"
            },
            dosage_guide: {
                recommended_daily: "1일 1회 1캡슐 식후 섭취",
                precautions: ["기존 종합비타민의 비타민D 용량을 합산해 확인하세요."]
            },
            risk_analysis: {
                has_risk: true,
                risk_level: "WARNING",
                warnings: [
                    "성분 중복 과다 위험: 기존 종합비타민(1,000 IU)과 본 제품(5,000 IU) 합산 시 일일 상한량(4,000 IU)을 초과하여 고칼슘혈증 독성 위험이 발생합니다."
                ]
            },
            user_summary: "🚨 [위험] 비타민 D 성분이 중복되어 하루 안전 상한 섭취량을 초과합니다. 동시 섭취하지 마세요!"
        }
    },
    aspirin_vitk: {
        text: "센트럼 파워 멀티비타민 (주성분: 비타민K 70mcg, 비타민C 100mg)",
        meds: "아스피린장용정 100mg",
        result: {
            identification: {
                product_name: "센트럼 파워 멀티비타민",
                type: "건강기능식품",
                main_ingredients: [
                    { name: "비타민K", amount: "70mcg" },
                    { name: "비타민C", amount: "100mg" }
                ],
                confidence_score: "HIGH"
            },
            dosage_guide: {
                recommended_daily: "1일 1회 1정 섭취",
                precautions: ["항응고제 복용 환자는 비타민 K 섭취 전 의사 상의 필요"]
            },
            risk_analysis: {
                has_risk: true,
                risk_level: "WARNING",
                warnings: [
                    "약효 저해 상호작용: 비타민 K의 지혈 작용이 아스피린의 피를 묽게 해주는 약효를 방해합니다."
                ]
            },
            user_summary: "🚨 [위험] 아스피린과 영양제의 비타민 K 성분이 반대 작용을 일으켜 아스피린의 약효가 떨어질 수 있습니다."
        }
    },
    thyroid_calcium: {
        text: "파워 칼슘 앤 마그네슘 (주성분: 칼슘 300mg)",
        meds: "신지로이드정 (갑상선약)",
        result: {
            identification: {
                product_name: "파워 칼슘 앤 마그네슘",
                type: "건강기능식품",
                main_ingredients: [
                    { name: "칼슘", amount: "300mg" }
                ],
                confidence_score: "HIGH"
            },
            dosage_guide: {
                recommended_daily: "1일 1회 섭취",
                precautions: ["갑상선약과 4시간 이상 시간 간격을 두세요."]
            },
            risk_analysis: {
                has_risk: true,
                risk_level: "CAUTION",
                warnings: [
                    "흡수 방해: 칼슘이 갑상선 호르몬제와 결합하여 약물 흡수를 방해합니다."
                ]
            },
            user_summary: "⚠️ [주의] 갑상선약과 칼슘 영양제를 같이 드시면 약이 흡수되지 않습니다. 4시간 간격을 두세요."
        }
    },
    acne_vita: {
        text: "니메겐 연질캡슐 (이소트레티노인 - 여드름 치료제)",
        meds: "비타민A 영양제",
        result: {
            identification: {
                product_name: "니메겐 연질캡슐",
                type: "의약품",
                main_ingredients: [
                    { name: "이소트레티노인", amount: "10mg" }
                ],
                confidence_score: "HIGH"
            },
            dosage_guide: {
                recommended_daily: "의사 처방용법 준수",
                precautions: ["비타민 A 영양제 병용 금지"]
            },
            risk_analysis: {
                has_risk: true,
                risk_level: "WARNING",
                warnings: [
                    "비타민 A 과다 중독 위험 발생 (두통, 뇌압 상승 등 부작용)"
                ]
            },
            user_summary: "🚨 [강력 경고] 여드름 약과 비타민 A 영양제를 함께 드시면 중독 부작용이 생기므로 절대 같이 드시지 마세요."
        }
    }
};

// 빠른 샘플 칩 클릭 이벤트
document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        if (sampleData[key]) {
            chatInput.value = sampleData[key].text;
            existingMedsInput.value = sampleData[key].meds;
            handleSendMessage();
        }
    });
});

// 전송 버튼 클릭 및 엔터키 전송
sendBtn.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

function handleSendMessage() {
    const userText = chatInput.value.trim();
    if (!userText) return;

    // 1. 유저 메시지 말풍선 생성 및 추가
    appendUserMessage(userText);
    chatInput.value = '';

    // 2. AI 로딩 메시지 말풍선 생성
    const loadingBubble = appendAiLoadingMessage();

    // 3. 분석 수행 (600ms 후 응답 출력)
    setTimeout(() => {
        chatHistory.removeChild(loadingBubble);

        let analysisResult;
        // 샘플 키 매칭 검사
        let matchedSampleKey = null;
        Object.keys(sampleData).forEach(k => {
            if (sampleData[k].text === userText) matchedSampleKey = k;
        });

        if (matchedSampleKey) {
            analysisResult = sampleData[matchedSampleKey].result;
        } else {
            analysisResult = generateCustomAnalysis(userText, existingMedsInput.value);
        }

        // AI 응답 말풍선 렌더링
        appendAiResponseMessage(analysisResult);

        // 우측 사이드바 JSON 업데이트
        jsonOutput.textContent = JSON.stringify(analysisResult, null, 2);

        // 대화창 최하단 스크롤
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }, 600);
}

// 유저 말풍선 생성
function appendUserMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble user-bubble';
    bubble.innerHTML = `
        <div class="avatar">👤</div>
        <div class="bubble-content">
            <p>${escapeHtml(text)}</p>
        </div>
    `;
    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// AI 로딩 메시지
function appendAiLoadingMessage() {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble ai-bubble';
    bubble.innerHTML = `
        <div class="avatar">✨</div>
        <div class="bubble-content">
            <p>⏳ 약물 및 영양제 상호작용 위험성을 분석 중입니다...</p>
        </div>
    `;
    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return bubble;
}

// AI 응답 말풍선 생성
function appendAiResponseMessage(res) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble ai-bubble';

    const riskLevel = res.risk_analysis.risk_level;
    const badgeClass = `badge-${riskLevel.toLowerCase()}`;

    let warningHtml = '';
    if (res.risk_analysis.warnings.length > 0) {
        warningHtml = `
            <div style="margin-top: 0.5rem; color: #f87171; font-weight: 600;">
                ⚠️ <strong>검출된 위험 사항:</strong>
                <ul style="padding-left: 1.2rem; font-size: 0.88rem; font-weight: normal; margin-top: 0.2rem;">
                    ${res.risk_analysis.warnings.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    bubble.innerHTML = `
        <div class="avatar">✨</div>
        <div class="bubble-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong>분석 결과 리포트</strong>
                <span class="risk-badge-inline ${badgeClass}">${riskLevel}</span>
            </div>
            
            <p style="margin-bottom: 0.6rem; line-height: 1.5;">${res.user_summary}</p>

            ${warningHtml}

            <div class="report-card-inline">
                <p><strong>제품명:</strong> ${res.identification.product_name} (${res.identification.type})</p>
                <p><strong>주성분:</strong> ${res.identification.main_ingredients.map(i => `${i.name} (${i.amount})`).join(', ') || '정보 없음'}</p>
                <p><strong>복용 가이드:</strong> ${res.dosage_guide.recommended_daily}</p>
            </div>
        </div>
    `;

    chatHistory.appendChild(bubble);
}

// 커스텀 입력 동적 처리
function generateCustomAnalysis(productText, existingMeds) {
    const text = (productText + " " + existingMeds).toLowerCase();
    let riskLevel = "SAFE";
    let hasRisk = false;
    let warnings = [];
    let userSummaryText = "입력하신 제품과 기존 복용약 간 특별한 위험 부작용이 검출되지 않았습니다.";

    if ((text.includes("아스피린") || text.includes("와파린")) && text.includes("비타민k")) {
        riskLevel = "WARNING";
        hasRisk = true;
        warnings.push("아스피린과 비타민 K 간 약효 저해 부작용 위험");
        userSummaryText = "🚨 아스피린과 비타민 K를 함께 먹으면 피를 묽게 해주는 아스피린 약효가 떨어집니다.";
    } else if (text.includes("갑상선") && (text.includes("칼슘") || text.includes("철분"))) {
        riskLevel = "CAUTION";
        hasRisk = true;
        warnings.push("갑상선 호르몬제의 장내 흡수 방해 부작용");
        userSummaryText = "⚠️ 갑상선약과 칼슘제는 동시 복용을 피하시고 4시간 간격을 두세요.";
    } else if (text.includes("비타민d") && (text.includes("종합비타민") || text.includes("비타민 d"))) {
        riskLevel = "WARNING";
        hasRisk = true;
        warnings.push("비타민 D 하루 안전 권장 상한량 초과 오남용 위험");
        userSummaryText = "🚨 기존 영양제와 비타민 D 성분이 중복되어 하루 권장량을 초과할 수 있습니다.";
    }

    return {
        identification: {
            product_name: productText.split('(')[0] || productText,
            type: productText.includes("약") ? "의약품" : "건강기능식품",
            main_ingredients: [{ name: "입력 성분", amount: "표기 함량" }],
            confidence_score: "HIGH"
        },
        dosage_guide: {
            recommended_daily: "제품 설명서 용법 준수",
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

// HTML 이스케이프
function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function (s) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[s];
    });
}

// JSON 복사
copyJsonBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(jsonOutput.textContent).then(() => {
        copyJsonBtn.textContent = "복사 완료! ✅";
        setTimeout(() => { copyJsonBtn.textContent = "JSON 복사"; }, 2000);
    });
});

console.log("Google AI Studio 대화형 챗 엔진 로드 완료.");
