// app.js - 서로 다른 약과 영양제 상호작용 위험 분석 자바스크립트 파일
// 남건이 쉽게 이해할 수 있도록 친절한 한글 주석을 유지하면서 위험 분석 시나리오를 확장했습니다.

const sampleSelect = document.getElementById('sample-select');
const productTextInput = document.getElementById('product-text');
const existingMedsInput = document.getElementById('existing-meds');
const analyzeBtn = document.getElementById('analyze-btn');

// 결과 UI 요소
const resultSection = document.getElementById('result-section');
const riskBadge = document.getElementById('risk-badge');
const userSummary = document.getElementById('user-summary');
const warningAlertBox = document.getElementById('warning-alert-box');
const warningList = document.getElementById('warning-list');

const resProductName = document.getElementById('res-product-name');
const resProductType = document.getElementById('res-product-type');
const resConfidence = document.getElementById('res-confidence');
const resIngredientsList = document.getElementById('res-ingredients-list');
const resRecommendedDaily = document.getElementById('res-recommended-daily');
const resPrecautionsList = document.getElementById('res-precautions-list');

const jsonOutput = document.getElementById('json-output');
const copyJsonBtn = document.getElementById('copy-json-btn');

// 1. 서로 다른 약 & 영양제 간 상호작용 위험 데이터베이스 (테스트 샘플)
const sampleData = {
    vitamin_d: {
        input_text: "닥터비타 울트라 비타민D 5000 IU (주성분: 비타민D3 125mcg, 칼슘 200mg)",
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
                recommended_daily: "1일 1회, 1캡슐 식후 섭취",
                precautions: [
                    "기존 종합비타민에 포함된 비타민D 용량을 반드시 합산하여 확인하세요.",
                    "고칼슘혈증이나 독성 부작용 예방을 위해 상한 섭취량을 준수해야 합니다."
                ]
            },
            risk_analysis: {
                has_risk: true,
                risk_level: "WARNING",
                warnings: [
                    "성분 중복 과다 위험: 기존 종합비타민(1,000 IU)과 본 제품(5,000 IU)을 함께 먹으면 일일 상한 섭취량(4,000 IU)을 초과(총 6,000 IU)하여 체내 독성 및 고칼슘혈증을 유발할 수 있습니다."
                ]
            },
            user_summary: "🚨 [위험] 기존 종합비타민과 본 비타민D 제품을 함께 먹으면 비타민D 하루 최대 안전 섭취량을 초과하게 됩니다. 동시 섭취하지 마시고 함량을 조절하세요."
        }
    },
    aspirin_vitk: {
        input_text: "센트럼 파워 멀티비타민 (주성분: 비타민K 70mcg, 비타민C 100mg)",
        meds: "아스피린장용정 100mg (항응고/항혈소판제)",
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
                precautions: [
                    "항응고제(아스피린/와파린 등) 복용 환자는 비타민K 섭취 전 반드시 담당 의사와 상의하세요."
                ]
            },
            risk_analysis: {
                has_risk: true,
                risk_level: "WARNING",
                warnings: [
                    "약효 저해 상호작용: 비타민 K는 피를 굳게 만드는 지혈 응고 성분으로, 피를 묽게 만드는 아스피린의 약효를 방해하여 혈전 예방 효과를 떨어뜨립니다."
                ]
            },
            user_summary: "🚨 [위험] 복용 중이신 아스피린과 영양제의 비타민 K 성분이 서로 반대 작용을 하여 아스피린의 혈전 방지 약효가 저하될 수 있습니다."
        }
    },
    thyroid_calcium: {
        input_text: "파워 칼슘 앤 마그네슘 (주성분: 칼슘 300mg, 마그네슘 150mg)",
        meds: "신지로이드정 (갑상선 호르몬제)",
        result: {
            identification: {
                product_name: "파워 칼슘 앤 마그네슘",
                type: "건강기능식품",
                main_ingredients: [
                    { name: "칼슘", amount: "300mg" },
                    { name: "마그네슘", amount: "150mg" }
                ],
                confidence_score: "HIGH"
            },
            dosage_guide: {
                recommended_daily: "1일 1회 2정 섭취",
                precautions: [
                    "갑상선약과 칼슘제는 반드시 최소 4시간 이상 섭취 시간 간격을 두어야 합니다."
                ]
            },
            risk_analysis: {
                has_risk: true,
                risk_level: "CAUTION",
                warnings: [
                    "흡수 방해 상호작용: 칼슘 성분이 위장관에서 갑상선 호르몬제(신지로이드)와 결합하여 약물의 체내 흡수를 크게 방해합니다."
                ]
            },
            user_summary: "⚠️ [주의] 갑상선약과 칼슘 영양제를 동시에 드시면 약이 흡수되지 않습니다. 갑상선약 복용 후 최소 4시간 뒤에 칼슘제를 섭취하세요."
        }
    },
    acne_vita: {
        input_text: "니메겐 연질캡슐 (이소트레티노인 - 여드름 치료제)",
        meds: "비타민A 10000 IU 영양제",
        result: {
            identification: {
                product_name: "니메겐 연질캡슐 (이소트레티노인)",
                type: "의약품",
                main_ingredients: [
                    { name: "이소트레티노인", amount: "10mg" }
                ],
                confidence_score: "HIGH"
            },
            dosage_guide: {
                recommended_daily: "의사 처방 용법에 따름",
                precautions: [
                    "이소트레티노인 복용 중에는 비타민 A 영양제 섭취가 엄격히 금지됩니다."
                ]
            },
            risk_analysis: {
                has_risk: true,
                risk_level: "WARNING",
                warnings: [
                    "독성 과다 상호작용: 여드름약(이소트레티노인) 유도체 자체가 비타민 A 성분이므로, 비타민 A 영양제를 추가 섭취하면 비타민 A 과다증(두통, 뇌압 상승, 피부 탈락)이 발생합니다."
                ]
            },
            user_summary: "🚨 [강력 경고] 여드름 치료약과 비타민 A 영양제를 함께 먹으면 비타민 A 중독 위험이 발생하므로 절대로 같이 드시면 안 됩니다."
        }
    },
    unclear: {
        input_text: "알약 표면 각인 사진 (식별 불분명)",
        meds: "없음",
        result: {
            identification: {
                product_name: "식별 불가",
                type: "식별불가",
                main_ingredients: [],
                confidence_score: "LOW"
            },
            dosage_guide: {
                recommended_daily: "식별 불가",
                precautions: ["선명한 포장지 및 낱알 재촬영 필요"]
            },
            risk_analysis: {
                has_risk: false,
                risk_level: "SAFE",
                warnings: []
            },
            user_summary: "📷 제품 정보를 식별할 수 없습니다. 정확한 위험 분석을 위해 제품명과 성분표 사진을 선명하게 다시 찍어주세요."
        }
    }
};

// 샘플 드롭다운 선택 이벤트
sampleSelect.addEventListener('change', (e) => {
    const key = e.target.value;
    if (sampleData[key]) {
        productTextInput.value = sampleData[key].input_text;
        existingMedsInput.value = sampleData[key].meds;
    }
});

// 분석 버튼 클릭 핸들러
analyzeBtn.addEventListener('click', () => {
    const textVal = productTextInput.value.trim();
    const medsVal = existingMedsInput.value.trim();

    if (!textVal) {
        alert("분석할 약이나 영양제 이름을 입력해 주세요!");
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "⏳ 두 성분 간의 상호작용 및 위험성을 검증하고 있습니다...";

    setTimeout(() => {
        const selectedSampleKey = sampleSelect.value;
        let analysisResult;

        if (sampleData[selectedSampleKey] && productTextInput.value === sampleData[selectedSampleKey].input_text) {
            analysisResult = sampleData[selectedSampleKey].result;
        } else {
            analysisResult = generateCustomAnalysis(textVal, medsVal);
        }

        renderResult(analysisResult);

        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "🔍 두 약/영양제 간 위험 상호작용 검증하기";
    }, 600);
});

// 동적 입력 처리 로직
function generateCustomAnalysis(productText, existingMeds) {
    let riskLevel = "SAFE";
    let hasRisk = false;
    let warnings = [];
    let userSummaryText = "입력하신 약과 영양제 간에 특별한 위험 상호작용이 감지되지 않았습니다.";

    const text = (productText + " " + existingMeds).toLowerCase();

    // 동적 위험 감지 로직
    if ((text.includes("아스피린") || text.includes("와파린")) && text.includes("비타민k")) {
        riskLevel = "WARNING";
        hasRisk = true;
        warnings.push("아스피린(항응고제)과 비타민 K 성분 간 상호작용으로 약효 저하 위험이 있습니다.");
        userSummaryText = "🚨 아스피린과 비타민 K를 함께 먹으면 혈전 방지 약효가 떨어질 수 있습니다.";
    } else if (text.includes("갑상선") && (text.includes("칼슘") || text.includes("철분"))) {
        riskLevel = "CAUTION";
        hasRisk = true;
        warnings.push("갑상선약과 칼슘/철분 영양제를 함께 복용하면 약의 체내 흡수가 저하됩니다.");
        userSummaryText = "⚠️ 갑상선약과 칼슘제는 동시 복용을 피하시고 4시간 이상 간격을 두고 드세요.";
    } else if (text.includes("비타민d") && (text.includes("종합비타민") || text.includes("비타민 d"))) {
        riskLevel = "WARNING";
        hasRisk = true;
        warnings.push("비타민 D 중복 섭취로 인한 일일 권장 상한량 초과 위험이 존재합니다.");
        userSummaryText = "🚨 비타민 D 성분이 중복되어 하루 권장량을 초과할 수 있으니 함량을 확인하세요.";
    }

    return {
        identification: {
            product_name: productText.split('(')[0] || productText,
            type: productText.includes("약") ? "의약품" : "건강기능식품",
            main_ingredients: [
                { name: "입력 성분", amount: "표기 함량" }
            ],
            confidence_score: "HIGH"
        },
        dosage_guide: {
            recommended_daily: "제품 포장 용법에 따라 섭취하세요.",
            precautions: [
                "의약품과 영양제 병용 섭취 시 전문가 상담 권장",
                "참고용 정보이며 정확한 상호작용은 의사 또는 약사와 상의해야 함."
            ]
        },
        risk_analysis: {
            has_risk: hasRisk,
            risk_level: riskLevel,
            warnings: warnings
        },
        user_summary: userSummaryText
    };
}

// 결과 출력 렌더링
function renderResult(result) {
    resultSection.classList.remove('hidden');

    riskBadge.className = `risk-badge badge-${result.risk_analysis.risk_level.toLowerCase()}`;
    riskBadge.textContent = result.risk_analysis.risk_level;

    userSummary.textContent = result.user_summary;

    if (result.risk_analysis.risk_level === "WARNING" && result.risk_analysis.warnings.length > 0) {
        warningAlertBox.classList.remove('hidden');
        warningList.innerHTML = result.risk_analysis.warnings.map(w => `<li>${w}</li>`).join('');
    } else {
        warningAlertBox.classList.add('hidden');
    }

    resProductName.textContent = result.identification.product_name;
    resProductType.textContent = result.identification.type;
    resConfidence.textContent = result.identification.confidence_score;

    if (result.identification.main_ingredients.length > 0) {
        resIngredientsList.innerHTML = result.identification.main_ingredients.map(ing => 
            `<li><strong>${ing.name}:</strong> ${ing.amount}</li>`
        ).join('');
    } else {
        resIngredientsList.innerHTML = `<li>식별된 성분이 없습니다.</li>`;
    }

    resRecommendedDaily.textContent = result.dosage_guide.recommended_daily;
    resPrecautionsList.innerHTML = result.dosage_guide.precautions.map(p => `<li>${p}</li>`).join('');

    jsonOutput.textContent = JSON.stringify(result, null, 2);
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// JSON 복사
copyJsonBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(jsonOutput.textContent).then(() => {
        copyJsonBtn.textContent = "복사 완료! ✅";
        setTimeout(() => { copyJsonBtn.textContent = "JSON 복사"; }, 2000);
    });
});

console.log("약 & 영양제 상호작용 위험 분석 스크립트 로드 완료.");
