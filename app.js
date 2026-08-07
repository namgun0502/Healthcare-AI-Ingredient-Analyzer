// app.js - 실제 Gemini AI API 연동 + 약물 보관함(Cabinet) 저장 & 대조 분석 메인 로직
// 남건이 쉽게 이해하도록 한글 주석을 상세히 달았습니다.

// ──────────────────────────────────────────────────────────
//  1. DOM 요소 가져오기
// ──────────────────────────────────────────────────────────
const chatHistory     = document.getElementById('chat-history');
const chatInput       = document.getElementById('chat-input');
const sendBtn         = document.getElementById('send-btn');

const photoUploadBtn        = document.getElementById('photo-upload-btn');
const imageUploadInput      = document.getElementById('image-upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const previewFilename       = document.getElementById('preview-filename');
const removeImgBtn          = document.getElementById('remove-img-btn');

const cabinetListEl   = document.getElementById('cabinet-list');
const cabinetCountEl  = document.getElementById('cabinet-count');
const clearCabinetBtn = document.getElementById('clear-cabinet-btn');

const jsonOutput  = document.getElementById('json-output');
const copyJsonBtn = document.getElementById('copy-json-btn');

const apiKeyInput    = document.getElementById('api-key-input');
const saveApiKeyBtn  = document.getElementById('save-api-key-btn');
const apiKeyStatusEl = document.getElementById('api-key-status');
const aiStatusEl     = document.getElementById('ai-status');

// ──────────────────────────────────────────────────────────
//  2. Gemini API 키 상태 관리
// ──────────────────────────────────────────────────────────
// LocalStorage에서 저장된 API 키를 불러옵니다.
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key') || '';

// 초기 로드 시 API 키 상태 표시
if (GEMINI_API_KEY) {
    updateApiKeyStatus(true);
    apiKeyInput.value = GEMINI_API_KEY;
}

// API 키 저장 버튼 클릭 이벤트
saveApiKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    // API 키 최소 길이만 확인 (형식 제한 없음 - 다양한 형태의 키 허용)
    if (key.length < 6) {
        alert('API 키가 너무 짧습니다. 올바른 Gemini API 키를 입력해주세요.');
        return;
    }
    GEMINI_API_KEY = key;
    localStorage.setItem('gemini_api_key', key);
    updateApiKeyStatus(true);
    alert('✅ API 키가 성공적으로 저장되었습니다! 이제 실제 Gemini AI가 약 성분을 분석해 드립니다.');
});

// API 키 상태 표시 업데이트 함수
function updateApiKeyStatus(isSet) {
    if (isSet) {
        apiKeyStatusEl.textContent = '연결됨 ✅';
        apiKeyStatusEl.className = 'api-status-tag tag-set';
        aiStatusEl.innerHTML = '<span class="dot dot-green"></span> Gemini AI 연결됨';
    } else {
        apiKeyStatusEl.textContent = '미설정';
        apiKeyStatusEl.className = 'api-status-tag tag-unset';
        aiStatusEl.innerHTML = '<span class="dot dot-gray"></span> API 키 미설정';
    }
}

// ──────────────────────────────────────────────────────────
//  3. 내 약물 보관함 (Cabinet) - LocalStorage 연동
// ──────────────────────────────────────────────────────────
let cabinet = JSON.parse(localStorage.getItem('my_medicine_cabinet')) || [
    { id: 1, name: '종합비타민 (비타민D 1,000 IU)', type: '건강기능식품', selected: true },
    { id: 2, name: '아스피린장용정 100mg', type: '의약품', selected: true }
];

let selectedImageFile = null;
renderCabinet();

// ──────────────────────────────────────────────────────────
//  4. Gemini AI API 호출 핵심 함수
//  - 실제로 Google Gemini 1.5 Flash 모델에 요청을 보내서
//    진짜 약 성분/용법/상호작용 위험 정보를 받아오는 함수입니다.
// ──────────────────────────────────────────────────────────
async function callGeminiAPI(userMessage, cabinetItems, imageBase64 = null) {
    const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

    // 이 API 키로 실제 사용 가능한 모델 목록을 자동 조회합니다.
    // 모델을 하드코딩하지 않고 API 키마다 지원 모델이 다를 수 있으므로
    // 실제로 사용할 수 있는 모델을 동적으로 가져옵니다.
    let MODELS = [];
    try {
        const listRes = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`);
        if (listRes.ok) {
            const listData = await listRes.json();
            // generateContent를 지원하며 이름에 'gemini'가 포함된 모델만 필터링
            // gemini-2.5는 신규 사용자 사용 불가이므로 제외, experimental 제외
            MODELS = (listData.models || [])
                .filter(m =>
                    m.supportedGenerationMethods?.includes('generateContent') &&
                    m.name.includes('gemini') &&
                    !m.name.includes('gemini-2.5') &&
                    !m.name.includes('experimental') &&
                    !m.name.includes('preview')
                )
                .map(m => m.name.replace('models/', ''))
                // flash 계열 먼저, 숫자 낮은 버전(더 안정적) 우선 정렬
                .sort((a, b) => {
                    const aFlash = a.includes('flash') ? 0 : 1;
                    const bFlash = b.includes('flash') ? 0 : 1;
                    if (aFlash !== bFlash) return aFlash - bFlash;
                    return a.localeCompare(b);
                });
        }
    } catch (e) {
        console.warn('모델 목록 조회 실패, 기본 모델 목록 사용');
    }

    // 조회 실패 시 폴백 기본 목록
    if (MODELS.length === 0) {
        MODELS = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-pro'];
    }
    console.log('[사용 가능한 모델]', MODELS);

    // 보관함 선택 약물 목록을 텍스트로 구성
    const cabinetText = cabinetItems.length > 0
        ? `\n\n[내 약물 보관함 - 현재 복용 중인 약물 목록]:\n${cabinetItems.map((x, i) => `${i + 1}. ${x.name} (${x.type})`).join('\n')}`
        : '\n\n[내 약물 보관함]: 비어 있음';

    // Gemini에게 역할 및 출력 형식을 정확히 지정하는 '시스템 지시문' 입니다.
    const systemPrompt = `당신은 한국의 의약품 및 건강기능식품(영양제) 전문 AI 성분 분석 어시스턴트입니다.
사용자가 약품명, 영양제명, 또는 성분표를 제공하면 다음을 수행하세요:
1. 해당 제품의 실제 주성분, 함량, 효능/효과를 정확히 설명하세요.
2. 사용자가 제공한 [내 약물 보관함] 목록에 있는 복용 중인 약들과의 상호작용 위험(성분 중복 오남용, 약효 저해, 흡수 방해 등)을 분석하세요.
3. 일일 권장량 초과 시 WARNING, 주의 시 CAUTION, 안전 시 SAFE로 분류하세요.
4. 진단이 아닌 참고용 정보임을 명시하고, 정확한 상담은 의사/약사를 안내하세요.

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "identification": {
    "product_name": "제품명",
    "type": "의약품 또는 건강기능식품",
    "main_ingredients": [
      {"name": "성분명", "amount": "함량"}
    ],
    "confidence_score": "HIGH 또는 MEDIUM 또는 LOW"
  },
  "dosage_guide": {
    "recommended_daily": "권장 복용법",
    "precautions": ["주의사항1", "주의사항2"]
  },
  "risk_analysis": {
    "has_risk": true 또는 false,
    "risk_level": "WARNING 또는 CAUTION 또는 SAFE",
    "warnings": ["발견된 위험 내용 설명"]
  },
  "user_summary": "사용자가 읽기 쉬운 2~3줄 한국어 요약"
}`;

    // 실제 Gemini API에 보낼 메시지 내용 구성 (텍스트 + 이미지)
    const parts = [];

    // 이미지가 첨부된 경우 이미지 데이터 추가
    if (imageBase64) {
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64
            }
        });
    }

    // 텍스트 질문 + 보관함 정보 합쳐서 추가
    parts.push({ text: systemPrompt + cabinetText + '\n\n[사용자 질문]: ' + userMessage });

    const requestBody = {
        contents: [{
            parts: parts
        }],
        generationConfig: {
            temperature: 0.1,   // 낮은 온도 = 더 정확하고 일관된 의학적 응답
            maxOutputTokens: 1024
        }
    };

    // 모델을 순서대로 시도하며, 할당량 초과 시 다음 모델로 자동 전환합니다.
    let lastError = null;
    for (const model of MODELS) {
        const GEMINI_URL = `${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;
        try {
            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errData = await response.json();
                const errMsg = errData.error?.message || '';
                // quota 초과, 모델 없음, 사용 불가, 권한 없음 오류 시 다음 모델로 자동 전환
                const isSkippable = 
                    response.status === 429 ||
                    errMsg.toLowerCase().includes('quota') ||
                    errMsg.toLowerCase().includes('not found') ||
                    errMsg.toLowerCase().includes('not supported') ||
                    errMsg.toLowerCase().includes('no longer available') ||
                    errMsg.toLowerCase().includes('deprecated') ||
                    errMsg.toLowerCase().includes('permission') ||
                    errMsg.toLowerCase().includes('available to new');
                if (isSkippable) {
                    console.warn(`[모델 건너뜀] ${model} 사용 불가 → 다음 모델 시도 중...`, errMsg.substring(0, 80));
                    lastError = new Error(`${model}: ${errMsg}`);
                    continue; // 다음 모델로 이동
                }
                throw new Error(errMsg || `API 오류 (코드: ${response.status})`);
            }

            const data = await response.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanedText);

        } catch (err) {
            const msg = err.message?.toLowerCase() || '';
            if (msg.includes('quota') || msg.includes('not found') || msg.includes('not supported')) {
                lastError = err;
                continue; // 다음 모델로 이동
            }
            throw err; // 다른 종류의 오류는 즉시 상위로 전달
        }
    }

    // 모든 모델 시도 실패 시
    const lastMsg = lastError?.message || '알 수 없는 오류';
    throw new Error(`사용 가능한 Gemini 모델을 찾지 못했습니다.\n\n상세 오류: ${lastMsg.substring(0, 120)}\n\n💡 확인사항:\n1. API 키가 올바른지 다시 확인해주세요.\n2. Google AI Studio(aistudio.google.com)에서 API 키 상태를 확인해주세요.\n3. 잠시 후 다시 시도해주세요.`);
}

// ──────────────────────────────────────────────────────────
//  5. 보관함 UI 렌더링 함수
// ──────────────────────────────────────────────────────────
function renderCabinet() {
    cabinetCountEl.textContent = cabinet.length;
    localStorage.setItem('my_medicine_cabinet', JSON.stringify(cabinet));

    if (cabinet.length === 0) {
        cabinetListEl.innerHTML = `<div style="text-align:center;font-size:0.78rem;color:#8b949e;padding:1rem;">보관함이 비어 있습니다.<br>AI 분석 후 [보관함에 저장]해보세요!</div>`;
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

    document.querySelectorAll('.cabinet-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
            const id = Number(e.target.getAttribute('data-id'));
            const found = cabinet.find(x => x.id === id);
            if (found) { found.selected = e.target.checked; renderCabinet(); }
        });
    });

    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = Number(e.target.getAttribute('data-id'));
            cabinet = cabinet.filter(x => x.id !== id);
            renderCabinet();
        });
    });
}

clearCabinetBtn.addEventListener('click', () => {
    if (confirm('내 약물 보관함을 전부 비우시겠습니까?')) {
        cabinet = [];
        renderCabinet();
    }
});

// ──────────────────────────────────────────────────────────
//  6. 사진 첨부 기능
// ──────────────────────────────────────────────────────────
photoUploadBtn.addEventListener('click', () => imageUploadInput.click());

imageUploadInput.addEventListener('change', (e) => {
    if (e.target.files?.[0]) {
        selectedImageFile = e.target.files[0];
        previewFilename.textContent = selectedImageFile.name;
        imagePreviewContainer.classList.remove('hidden');
        if (!chatInput.value.trim()) {
            chatInput.value = `이 약/영양제 사진의 성분과 복용법을 분석하고, 내 보관함 약물들과의 상호작용 위험을 알려줘.`;
        }
    }
});

removeImgBtn.addEventListener('click', () => {
    selectedImageFile = null;
    imageUploadInput.value = '';
    imagePreviewContainer.classList.add('hidden');
});

// ──────────────────────────────────────────────────────────
//  7. 실제 약품명 칩 클릭 이벤트 (data-query 속성 기반)
// ──────────────────────────────────────────────────────────
document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        if (query) {
            chatInput.value = query;
            handleSendMessage();
        }
    });
});

// ──────────────────────────────────────────────────────────
//  8. 메시지 전송 핸들러 (AI 분석 실행 핵심)
// ──────────────────────────────────────────────────────────
sendBtn.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
});

async function handleSendMessage() {
    const userText = chatInput.value.trim();
    if (!userText && !selectedImageFile) return;

    const selectedCabinetItems = cabinet.filter(x => x.selected);

    appendUserMessage(userText || `[이미지 분석 요청: ${selectedImageFile.name}]`);
    chatInput.value = '';

    const capturedImageFile = selectedImageFile;
    selectedImageFile = null;
    imagePreviewContainer.classList.add('hidden');
    imageUploadInput.value = '';

    const loadingBubble = appendAiLoadingMessage();

    try {
        let analysisResult;

        if (!GEMINI_API_KEY) {
            // API 키가 없으면 로컬 지식베이스로 응답
            analysisResult = localKnowledgeBase(userText, selectedCabinetItems);
            await new Promise(r => setTimeout(r, 600));
        } else {
            // 이미지 파일을 base64로 변환 (사진 첨부 시)
            let imageBase64 = null;
            if (capturedImageFile) {
                imageBase64 = await fileToBase64(capturedImageFile);
            }
            // 실제 Gemini AI 호출
            analysisResult = await callGeminiAPI(userText, selectedCabinetItems, imageBase64);
        }

        chatHistory.removeChild(loadingBubble);
        appendAiResponseMessage(analysisResult);
        jsonOutput.textContent = JSON.stringify(analysisResult, null, 2);

    } catch (err) {
        chatHistory.removeChild(loadingBubble);
        appendErrorMessage(`AI 분석 중 오류가 발생했습니다: ${err.message}`);
    }

    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// ──────────────────────────────────────────────────────────
//  9. 이미지 → base64 변환 (사진을 API에 전송 가능한 형태로 변환)
// ──────────────────────────────────────────────────────────
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]); // "data:image/xxx;base64," 이후 데이터만 추출
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ──────────────────────────────────────────────────────────
//  10. 로컬 약품 지식베이스 (API 키 없을 때 폴백용)
//  - 한국 대표 약품/영양제의 실제 성분 데이터가 들어 있습니다.
// ──────────────────────────────────────────────────────────
function localKnowledgeBase(userText, cabinetItems) {
    const text = userText.toLowerCase();
    const cabinetNames = cabinetItems.map(x => x.name.toLowerCase()).join(' ');

    // 타이레놀 (아세트아미노펜)
    if (text.includes('타이레놀') || text.includes('아세트아미노펜')) {
        const hasDoubleAceta = cabinetNames.includes('게보린') || cabinetNames.includes('타이레놀');
        return {
            identification: { product_name: '타이레놀 500mg', type: '의약품', main_ingredients: [{ name: '아세트아미노펜', amount: '500mg' }], confidence_score: 'HIGH' },
            dosage_guide: { recommended_daily: '1회 1~2정, 하루 최대 4g(4,000mg) 초과 금지, 4~6시간 간격 복용', precautions: ['음주 중 복용 금지 (간 손상 위험)', '하루 총 아세트아미노펜 섭취량 4g 초과 시 간독성 발생'] },
            risk_analysis: { has_risk: hasDoubleAceta, risk_level: hasDoubleAceta ? 'WARNING' : 'SAFE', warnings: hasDoubleAceta ? ['⚠️ 보관함의 게보린/타이레놀과 성분(아세트아미노펜) 중복! 하루 4g 초과 시 간독성 위험'] : [] },
            user_summary: hasDoubleAceta ? '🚨 보관함에 동일 성분(아세트아미노펜) 약이 있습니다. 중복 복용 시 하루 최대 한도를 초과하면 간에 심각한 손상이 올 수 있습니다.' : '✅ 타이레놀은 아세트아미노펜 500mg 진통제입니다. 보관함 약물과의 심각한 상호작용은 발견되지 않았습니다.'
        };
    }

    // 우루사
    if (text.includes('우루사')) {
        return {
            identification: { product_name: '우루사 100mg', type: '의약품', main_ingredients: [{ name: '우르소데옥시콜산(UDCA)', amount: '100mg' }, { name: '비타민B1(티아민)', amount: '10mg' }], confidence_score: 'HIGH' },
            dosage_guide: { recommended_daily: '1일 3회, 1회 1정 식후 복용', precautions: ['담석증 환자는 전문의 상담 후 복용', '임신 초기 복용 금지'] },
            risk_analysis: { has_risk: false, risk_level: 'SAFE', warnings: [] },
            user_summary: '✅ 우루사는 우르소데옥시콜산(UDCA)이 주성분인 간 기능 개선 및 소화 촉진 의약품입니다. 보관함 약물들과 심각한 상호작용은 없습니다.'
        };
    }

    // 게보린
    if (text.includes('게보린')) {
        const hasAceta = cabinetNames.includes('타이레놀');
        return {
            identification: { product_name: '게보린정', type: '의약품', main_ingredients: [{ name: '아세트아미노펜', amount: '300mg' }, { name: '이소프로필안티피린', amount: '150mg' }, { name: '카페인무수물', amount: '50mg' }], confidence_score: 'HIGH' },
            dosage_guide: { recommended_daily: '1회 1정, 1일 3회 이내, 식후 복용', precautions: ['아세트아미노펜 포함으로 하루 복용량 주의', '카페인 민감자 주의'] },
            risk_analysis: { has_risk: hasAceta, risk_level: hasAceta ? 'WARNING' : 'CAUTION', warnings: hasAceta ? ['⚠️ 보관함의 타이레놀과 아세트아미노펜 성분 중복! 간독성 위험'] : ['카페인 성분 포함 (커피, 에너지음료와 함께 복용 시 카페인 과다 주의)'] },
            user_summary: hasAceta ? '🚨 보관함의 타이레놀과 게보린은 둘 다 아세트아미노펜을 포함하므로 동시 복용하면 간 독성 위험이 있습니다!' : '⚠️ 게보린은 아세트아미노펜+이소프로필안티피린+카페인 복합 진통제입니다. 카페인 과다에 주의하세요.'
        };
    }

    // 임팩타민
    if (text.includes('임팩타민')) {
        return {
            identification: { product_name: '임팩타민 파워', type: '건강기능식품', main_ingredients: [{ name: '벤포티아민(비타민B1)', amount: '50mg' }, { name: '비타민B2', amount: '20mg' }, { name: '비타민B6', amount: '30mg' }, { name: '비타민B12', amount: '250mcg' }], confidence_score: 'HIGH' },
            dosage_guide: { recommended_daily: '1일 1회 1정 식후 복용', precautions: ['고용량 비타민B6의 장기 복용은 신경병증 유발 가능'] },
            risk_analysis: { has_risk: false, risk_level: 'SAFE', warnings: [] },
            user_summary: '✅ 임팩타민은 고함량 비타민 B군 복합 영양제입니다. 피로 회복에 도움을 주며 보관함 약물들과의 심각한 상호작용은 없습니다.'
        };
    }

    // 오메가3
    if (text.includes('오메가3') || text.includes('오메가-3')) {
        const hasAspirin = cabinetNames.includes('아스피린') || cabinetNames.includes('와파린');
        return {
            identification: { product_name: '오메가3 EPA/DHA', type: '건강기능식품', main_ingredients: [{ name: 'EPA(에이코사펜타엔산)', amount: '180mg' }, { name: 'DHA(도코사헥사엔산)', amount: '120mg' }], confidence_score: 'HIGH' },
            dosage_guide: { recommended_daily: '1일 1~3캡슐 식후 복용', precautions: ['항응고제 복용 시 출혈 위험 주의', '수술 2주 전 복용 중단 권장'] },
            risk_analysis: { has_risk: hasAspirin, risk_level: hasAspirin ? 'CAUTION' : 'SAFE', warnings: hasAspirin ? ['⚠️ 보관함의 아스피린과 함께 복용 시 혈액 응고 억제 효과가 과도해져 출혈 위험이 증가할 수 있습니다.'] : [] },
            user_summary: hasAspirin ? '⚠️ 오메가3와 보관함의 아스피린을 함께 드시면 혈액이 너무 묽어질 수 있으므로 담당 의사와 상담 후 복용을 결정하세요.' : '✅ 오메가3는 EPA와 DHA를 주성분으로 하는 심혈관 건강 보조 영양제입니다. 보관함 약물들과 심각한 위험은 없습니다.'
        };
    }

    // 알 수 없는 약품 - 일반 응답
    return {
        identification: { product_name: userText.substring(0, 40), type: '분류 불명', main_ingredients: [{ name: '성분 확인 불가 (API 키 필요)', amount: '-' }], confidence_score: 'LOW' },
        dosage_guide: { recommended_daily: '제품 포장지 용법 참고', precautions: ['정확한 성분 분석을 위해 Gemini API 키를 설정해주세요.'] },
        risk_analysis: { has_risk: false, risk_level: 'SAFE', warnings: [] },
        user_summary: `💡 "${userText.substring(0,20)}..."에 대한 정보를 찾을 수 없습니다. 우측 패널에서 Gemini API 키를 설정하시면 어떤 약이든 실제 AI가 정확히 분석해 드립니다!`
    };
}

// ──────────────────────────────────────────────────────────
//  11. 채팅 말풍선 생성 함수들
// ──────────────────────────────────────────────────────────
function appendUserMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble user-bubble';
    bubble.innerHTML = `<div class="avatar">👤</div><div class="bubble-content"><p>${escapeHtml(text)}</p></div>`;
    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function appendAiLoadingMessage() {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble ai-bubble';
    bubble.innerHTML = `
        <div class="avatar">✨</div>
        <div class="bubble-content">
            <p style="color:#38bdf8;">🔬 Gemini AI가 실제 성분 DB를 분석하고 보관함 약물들과 대조 중입니다<span class="loading-dots"></span></p>
        </div>`;
    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return bubble;
}

function appendErrorMessage(msg) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble ai-bubble';
    bubble.innerHTML = `<div class="avatar">⚠️</div><div class="bubble-content"><p style="color:#f87171;">${escapeHtml(msg)}</p><p style="font-size:0.8rem;color:#8b949e;margin-top:0.4rem;">API 키가 올바른지 확인하거나 네트워크 연결을 점검해 주세요.</p></div>`;
    chatHistory.appendChild(bubble);
}

function appendAiResponseMessage(res) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble ai-bubble';

    const riskLevel  = res.risk_analysis?.risk_level || 'SAFE';
    const badgeClass = `badge-${riskLevel.toLowerCase()}`;

    let warningHtml = '';
    if (res.risk_analysis?.warnings?.length > 0) {
        warningHtml = `
            <div style="margin-top:0.5rem;padding:0.75rem;background:rgba(248,113,113,0.1);border:1px solid #f87171;border-radius:8px;">
                <strong style="color:#f87171;">⚠️ 보관함 대조 위험 발견:</strong>
                <ul style="padding-left:1.2rem;font-size:0.88rem;color:#fecdd3;margin-top:0.3rem;">
                    ${res.risk_analysis.warnings.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>`;
    }

    const prodName = res.identification?.product_name || '분석 결과';
    const prodType = res.identification?.type || '';
    const ingredients = res.identification?.main_ingredients?.map(i => `<span style="background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.2);border-radius:4px;padding:0.1rem 0.4rem;font-size:0.8rem;margin:0.1rem;display:inline-block;">${i.name} ${i.amount}</span>`).join('') || '정보 없음';

    bubble.innerHTML = `
        <div class="avatar">✨</div>
        <div class="bubble-content">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                <strong>🔬 AI 실제 성분 & 대조 분석 결과</strong>
                <span class="risk-badge-inline ${badgeClass}">${riskLevel}</span>
            </div>

            <p style="margin-bottom:0.7rem;line-height:1.6;">${res.user_summary}</p>

            ${warningHtml}

            <div class="report-card-inline" style="margin-top:0.75rem;">
                <p style="margin-bottom:0.3rem;"><strong>📦 제품명:</strong> ${prodName} <span style="color:#8b949e;font-size:0.8rem;">(${prodType})</span></p>
                <p style="margin-bottom:0.5rem;"><strong>🧪 주성분:</strong></p>
                <div style="display:flex;flex-wrap:wrap;gap:0.2rem;margin-bottom:0.5rem;">${ingredients}</div>
                <p style="margin-bottom:0.3rem;"><strong>📋 복용 가이드:</strong> ${res.dosage_guide?.recommended_daily || '-'}</p>
                ${res.dosage_guide?.precautions?.length > 0 ? `<ul style="padding-left:1.1rem;font-size:0.82rem;color:#94a3b8;margin-top:0.2rem;">${res.dosage_guide.precautions.map(p => `<li>${p}</li>`).join('')}</ul>` : ''}
                
                <button class="save-cabinet-btn" onclick="saveToCabinet('${escapeHtml(prodName)}', '${escapeHtml(prodType)}')">
                    💾 내 약물 보관함에 이 약 추가하기
                </button>
            </div>
        </div>`;

    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// ──────────────────────────────────────────────────────────
//  12. 보관함 저장 글로벌 함수
// ──────────────────────────────────────────────────────────
window.saveToCabinet = function(name, type) {
    if (cabinet.some(x => x.name === name)) {
        alert('이미 보관함에 저장되어 있는 제품입니다.');
        return;
    }
    cabinet.push({ id: Date.now(), name, type, selected: true });
    renderCabinet();
    alert(`✅ '${name}' 제품이 내 약물 보관함에 저장되었습니다!`);
};

// ──────────────────────────────────────────────────────────
//  13. JSON 복사 및 HTML 이스케이프 유틸리티
// ──────────────────────────────────────────────────────────
copyJsonBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(jsonOutput.textContent).then(() => {
        copyJsonBtn.textContent = '복사 완료! ✅';
        setTimeout(() => { copyJsonBtn.textContent = 'JSON 복사'; }, 2000);
    });
});

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

console.log('✅ 실제 Gemini AI 연동 약물 분석 어시스턴트 준비 완료');
