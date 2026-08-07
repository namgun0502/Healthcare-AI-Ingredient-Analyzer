// app.js - 실제 Gemini AI API 연동 + 약물 보관함(Cabinet) 저장 & 대조 분석 메인 로직
// 남건이 쉽게 이해하도록 한글 주석을 상세히 달았습니다.

// ──────────────────────────────────────────────────────────
//  1. DOM 요소 가져오기
// ──────────────────────────────────────────────────────────
// 로그인/메인 화면 전환용 요소
const authScreen  = document.getElementById('auth-screen');
const mainApp     = document.getElementById('main-app');

// 로그인 폼 요소들
const loginForm          = document.getElementById('login-form');
const loginEmail         = document.getElementById('login-email');
const loginPassword      = document.getElementById('login-password');
const loginBtnText       = document.getElementById('login-btn-text');
const forgotPwBtn        = document.getElementById('forgot-pw-btn'); // 🔑 비밀번호 찾기 버튼

// 회원가입 폼 요소들
const registerForm           = document.getElementById('register-form');
const regNickname            = document.getElementById('reg-nickname');
const regEmail               = document.getElementById('reg-email');
const regPassword            = document.getElementById('reg-password');
const regPasswordConfirm     = document.getElementById('reg-password-confirm');
const registerBtnText        = document.getElementById('register-btn-text');

// Auth 탭 전환 버튼
const authTabLogin    = document.getElementById('auth-tab-login');
const authTabRegister = document.getElementById('auth-tab-register');

// Auth 메시지 박스
const authErrorBox   = document.getElementById('auth-error-box');
const authSuccessBox = document.getElementById('auth-success-box');

// 로그아웃 버튼, 사용자 이메일 표시
const logoutBtn         = document.getElementById('logout-btn');
const userEmailDisplay  = document.getElementById('user-email-display');
const editNicknameBtn   = document.getElementById('edit-nickname-btn'); // ✏️ 닉네임 수정 버튼
const changePwBtn       = document.getElementById('change-pw-btn');     // 🔒 비밀번호 변경 버튼

// 닉네임 설정/수정 모달 요소들
const nicknameModal         = document.getElementById('nickname-modal');
const modalNicknameInput    = document.getElementById('modal-nickname-input');
const closeNicknameModalBtn = document.getElementById('close-nickname-modal-btn');
const saveNicknameModalBtn  = document.getElementById('save-nickname-modal-btn');

// 비밀번호 재설정 이메일 발송 모달 요소들
const resetPwModal         = document.getElementById('reset-pw-modal');
const resetEmailInput      = document.getElementById('reset-email-input');
const closeResetPwModalBtn = document.getElementById('close-reset-pw-modal-btn');
const sendResetPwBtn       = document.getElementById('send-reset-pw-btn');

// 비밀번호 변경 모달 요소들
const changePwModal         = document.getElementById('change-pw-modal');
const newPwInput            = document.getElementById('new-pw-input');
const newPwConfirmInput     = document.getElementById('new-pw-confirm-input');
const closeChangePwModalBtn = document.getElementById('close-change-pw-modal-btn');
const saveChangePwBtn       = document.getElementById('save-change-pw-btn');

// 채팅 관련 요소들
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
//  1-1. Supabase 데이터베이스 & Auth 클라이언트 초기화
// ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://qzhgsshyhmnczmreagqd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6aGdzc2h5aG1uY3ptcmVhZ3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzc0NzksImV4cCI6MjA5Nzg1MzQ3OX0.2NZxyClmIpj7WtUuZtexZqAMuTnC7udF5FejwitzvcU";

let supabaseClient = null;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase DB + Auth 클라이언트 연결 성공!');
}

// 현재 로그인된 사용자 정보를 저장하는 변수
let currentUser = null;
let currentNickname = '사용자';

// ──────────────────────────────────────────────────────────
//  1-2. 🔐 Supabase Auth — 로그인/회원가입/로그아웃 로직
// ──────────────────────────────────────────────────────────

// [로그인 탭] ↔ [회원가입 탭] 전환
authTabLogin?.addEventListener('click', () => {
    authTabLogin.classList.add('active');
    authTabRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    clearAuthMessages();
});

authTabRegister?.addEventListener('click', () => {
    authTabRegister.classList.add('active');
    authTabLogin.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    clearAuthMessages();
});

function clearAuthMessages() {
    authErrorBox.classList.add('hidden');
    authErrorBox.textContent = '';
    authSuccessBox.classList.add('hidden');
    authSuccessBox.textContent = '';
}

function showAuthError(msg) {
    authErrorBox.textContent = msg;
    authErrorBox.classList.remove('hidden');
    authSuccessBox.classList.add('hidden');
}

function showAuthSuccess(msg) {
    authSuccessBox.textContent = msg;
    authSuccessBox.classList.remove('hidden');
    authErrorBox.classList.add('hidden');
}

// 로그인 성공 후 메인 앱 화면으로 전환
async function showMainApp(user) {
    currentUser = user;
    authScreen.classList.add('hidden');   // 로그인 화면 숨기기
    mainApp.classList.remove('hidden');   // 메인 앱 보이기

    let userNickname = '';

    if (supabaseClient && user) {
        try {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('nickname')
                .eq('id', user.id)
                .single();

            if (data && data.nickname && data.nickname.trim() !== '') {
                userNickname = data.nickname.trim();
            } else if (user.user_metadata && user.user_metadata.nickname && user.user_metadata.nickname.trim() !== '') {
                userNickname = user.user_metadata.nickname.trim();
            }
        } catch (e) {
            console.warn('프로필 닉네임 조회 실패:', e);
        }
    }

    if (!userNickname || userNickname === '사용자') {
        currentNickname = '사용자';
        updateUserDisplayInfo('사용자', user.email);
        
        setTimeout(() => {
            openNicknameModal(true);
        }, 500);
    } else {
        currentNickname = userNickname;
        updateUserDisplayInfo(userNickname, user.email);
    }

    console.log('✅ 로그인 완료:', currentNickname, user.email);
    fetchMedicinesFromSupabase();
}

function updateUserDisplayInfo(nickname, email) {
    currentNickname = nickname;
    if (userEmailDisplay) {
        userEmailDisplay.textContent = `👤 ${nickname} (${email})`;
    }

    const supabaseUserInfo = document.getElementById('supabase-user-info');
    if (supabaseUserInfo) {
        supabaseUserInfo.textContent = `${nickname}님(${email}) 계정의 약물 데이터가 Supabase에 실시간 저장됩니다.`;
    }
}

// ──────────────────────────────────────────────────────────
//  1-3. ✏️ 닉네임 설정/수정 팝업 모달 제어 로직
// ──────────────────────────────────────────────────────────
function openNicknameModal(isMandatory = false) {
    if (!nicknameModal) return;
    nicknameModal.classList.remove('hidden');
    if (modalNicknameInput) {
        modalNicknameInput.value = (currentNickname && currentNickname !== '사용자') ? currentNickname : '';
        modalNicknameInput.focus();
    }
}

function closeNicknameModal() {
    if (!nicknameModal) return;
    nicknameModal.classList.add('hidden');
}

editNicknameBtn?.addEventListener('click', () => {
    openNicknameModal(false);
});

closeNicknameModalBtn?.addEventListener('click', () => {
    closeNicknameModal();
});

saveNicknameModalBtn?.addEventListener('click', async () => {
    await handleSaveNickname();
});

modalNicknameInput?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        await handleSaveNickname();
    }
});

async function handleSaveNickname() {
    if (!modalNicknameInput) return;
    const newNickname = modalNicknameInput.value.trim();

    if (!newNickname) {
        alert('사용하실 닉네임을 입력해주세요.');
        modalNicknameInput.focus();
        return;
    }

    if (!currentUser || !supabaseClient) {
        alert('로그인 세션이 유효하지 않습니다.');
        return;
    }

    saveNicknameModalBtn.textContent = '저장 중...';

    try {
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .upsert({
                id: currentUser.id,
                email: currentUser.email,
                nickname: newNickname,
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            console.warn('profiles 테이블 업데이트 시도:', profileError.message);
        }

        const { error: authError } = await supabaseClient.auth.updateUser({
            data: { nickname: newNickname }
        });

        if (authError) {
            console.warn('auth 메타데이터 업데이트 시도:', authError.message);
        }

        updateUserDisplayInfo(newNickname, currentUser.email);
        closeNicknameModal();
        alert(`✅ 닉네임이 '${newNickname}'(으)로 성공적으로 설정되었습니다!`);

    } catch (err) {
        alert(`❌ 닉네임 저장 중 오류가 발생했습니다: ${err.message}`);
    } finally {
        saveNicknameModalBtn.textContent = '💾 저장하기';
    }
}

// ──────────────────────────────────────────────────────────
//  1-4. 🔑 비밀번호 재설정 (로그인 전 이메일 발송) 제어 로직
// ──────────────────────────────────────────────────────────
forgotPwBtn?.addEventListener('click', () => {
    if (resetPwModal) {
        resetPwModal.classList.remove('hidden');
        if (resetEmailInput && loginEmail) {
            resetEmailInput.value = loginEmail.value.trim();
        }
        resetEmailInput?.focus();
    }
});

closeResetPwModalBtn?.addEventListener('click', () => {
    if (resetPwModal) resetPwModal.classList.add('hidden');
});

sendResetPwBtn?.addEventListener('click', async () => {
    const email = resetEmailInput ? resetEmailInput.value.trim() : '';

    if (!email) {
        alert('가입하신 이메일 주소를 입력해주세요.');
        resetEmailInput?.focus();
        return;
    }

    sendResetPwBtn.textContent = '발송 중...';

    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href
        });

        if (error) {
            alert(`❌ 비밀번호 재설정 이메일 발송 실패: ${error.message}`);
        } else {
            alert(`📧 '${email}' 주소로 비밀번호 재설정 이메일을 발송했습니다!\n메일함을 확인하여 안내에 따라 재설정을 진행해 주세요.`);
            if (resetPwModal) resetPwModal.classList.add('hidden');
        }
    } catch (err) {
        alert(`❌ 오류 발생: ${err.message}`);
    } finally {
        sendResetPwBtn.textContent = '📧 재설정 메일 발송';
    }
});

// ──────────────────────────────────────────────────────────
//  1-5. 🔒 비밀번호 변경 (로그인 후 즉시 변경) 제어 로직
// ──────────────────────────────────────────────────────────
changePwBtn?.addEventListener('click', () => {
    if (changePwModal) {
        changePwModal.classList.remove('hidden');
        if (newPwInput) newPwInput.value = '';
        if (newPwConfirmInput) newPwConfirmInput.value = '';
        newPwInput?.focus();
    }
});

closeChangePwModalBtn?.addEventListener('click', () => {
    if (changePwModal) changePwModal.classList.add('hidden');
});

saveChangePwBtn?.addEventListener('click', async () => {
    await handleSaveChangePw();
});

async function handleSaveChangePw() {
    const newPw = newPwInput ? newPwInput.value : '';
    const confirmPw = newPwConfirmInput ? newPwConfirmInput.value : '';

    if (!newPw) {
        alert('새 비밀번호를 입력해주세요.');
        newPwInput?.focus();
        return;
    }

    if (newPw.length < 6) {
        alert('비밀번호는 최소 6자 이상이어야 합니다.');
        newPwInput?.focus();
        return;
    }

    if (newPw !== confirmPw) {
        alert('새 비밀번호와 재입력 비밀번호가 서로 일치하지 않습니다.');
        newPwConfirmInput?.focus();
        return;
    }

    saveChangePwBtn.textContent = '변경 중...';

    try {
        const { error } = await supabaseClient.auth.updateUser({
            password: newPw
        });

        if (error) {
            alert(`❌ 비밀번호 변경 실패: ${error.message}`);
        } else {
            alert('🔒 비밀번호가 성공적으로 변경되었습니다!\n다음 로그인부터는 새로운 비밀번호를 사용하세요.');
            if (changePwModal) changePwModal.classList.add('hidden');
        }
    } catch (err) {
        alert(`❌ 비밀번호 변경 오류: ${err.message}`);
    } finally {
        saveChangePwBtn.textContent = '🔒 비밀번호 변경';
    }
}

// 📧 로그인 폼 제출
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthMessages();

    const email    = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
        showAuthError('이메일과 비밀번호를 모두 입력해주세요.');
        return;
    }

    if (loginBtnText) loginBtnText.textContent = '로그인 중...';

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                showAuthError('❌ 이메일 또는 비밀번호가 일치하지 않습니다.');
            } else if (error.message.includes('Email not confirmed')) {
                showAuthError('❌ 이메일 인증이 필요합니다. 받은 메일함을 확인하세요.');
            } else {
                showAuthError(`❌ 로그인 오류: ${error.message}`);
            }
        } else if (data.user) {
            showMainApp(data.user);
        }
    } catch (err) {
        showAuthError(`❌ 네트워크 오류: ${err.message}`);
    } finally {
        if (loginBtnText) loginBtnText.textContent = '로그인 →';
    }
});

// 📝 회원가입 폼 제출
registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthMessages();

    const nickname = regNickname ? regNickname.value.trim() : '';
    const email    = regEmail.value.trim();
    const password = regPassword.value;
    const confirm  = regPasswordConfirm.value;

    if (!email || !password || !confirm) {
        showAuthError('이메일과 비밀번호 항목을 입력해주세요.');
        return;
    }
    if (password.length < 6) {
        showAuthError('❌ 비밀번호는 6자 이상이어야 합니다.');
        return;
    }
    if (password !== confirm) {
        showAuthError('❌ 비밀번호가 서로 일치하지 않습니다.');
        return;
    }

    if (registerBtnText) registerBtnText.textContent = '가입 처리 중...';

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { nickname: nickname },
                emailRedirectTo: window.location.href
            }
        });

        if (error) {
            if (error.message.includes('already registered') || error.message.includes('User already registered')) {
                showAuthError('❌ 이미 가입된 이메일입니다. 로그인 탭에서 로그인해주세요.');
            } else {
                showAuthError(`❌ 회원가입 오류: ${error.message}`);
            }
        } else if (data.user) {
            if (nickname) {
                try {
                    await supabaseClient.from('profiles').insert([{
                        id: data.user.id,
                        email: email,
                        nickname: nickname
                    }]);
                } catch (pErr) {
                    console.warn('프로필 저장 중 오류:', pErr);
                }
            }

            if (data.session) {
                await showMainApp(data.user);
            } else {
                showAuthSuccess('✅ 회원가입 완료! 바로 로그인하세요.');
                authTabLogin.click();
                loginEmail.value = email;
            }
        }
    } catch (err) {
        showAuthError(`❌ 네트워크 오류: ${err.message}`);
    } finally {
        if (registerBtnText) registerBtnText.textContent = '회원가입 →';
    }
});

// 🚪 로그아웃 버튼
logoutBtn?.addEventListener('click', async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;

    await supabaseClient.auth.signOut();
    currentUser = null;
    currentNickname = '사용자';
    cabinet = [];
    renderCabinet();

    if (chatHistory) {
        chatHistory.innerHTML = `
            <div class="message-bubble ai-bubble">
                <div class="avatar">✨</div>
                <div class="bubble-content">
                    <h3>안녕하세요! 실제 약 성분 AI 분석 어시스턴트입니다. 💊</h3>
                    <p>타이레놀, 우루사, 게보린, 오메가3 같은 <strong>실제 약/영양제 이름</strong>을 입력하시면 Gemini AI가 진짜 성분, 효능, 상호작용 위험을 실시간으로 분석해 드립니다!</p>
                    <p style="margin-top: 0.4rem; color: #38bdf8;">💡 우측 패널에 <strong>Gemini API 키</strong>를 등록하면 실제 AI가 응답합니다. 분석 후 [보관함에 저장]하면 다음에도 자동 대조 분석이 가능합니다.</p>
                    
                    <div class="sample-chips">
                        <span class="chip-label">💊 실제 약/영양제 이름으로 바로 질문해보기:</span>
                        <button class="chip-btn" data-query="타이레놀 500mg 성분과 복용법을 알려주고, 내 보관함 약물들과 함께 먹어도 되는지 대조 분석해줘">💊 타이레놀</button>
                        <button class="chip-btn" data-query="우루사 성분과 효능을 알려주고 보관함 약들과의 상호작용을 분석해줘">🟡 우루사</button>
                        <button class="chip-btn" data-query="게보린 성분과 주의사항, 보관함 약들과의 중복 위험을 분석해줘">💊 게보린</button>
                        <button class="chip-btn" data-query="임팩타민 성분과 하루 권장 섭취량, 보관함 약물들과의 상호작용 위험을 알려줘">🔶 임팩타민</button>
                        <button class="chip-btn" data-query="오메가3 주요 성분과 효능, 보관함에 있는 약들과 같이 먹어도 되는지 분석해줘">🐟 오메가3</button>
                    </div>
                </div>
            </div>`;
    }

    if (jsonOutput) {
        jsonOutput.textContent = `{\n  "status": "ready",\n  "message": "API 키를 설정하고 약품명을 입력하면 진짜 AI가 분석합니다."\n}`;
    }

    mainApp.classList.add('hidden');
    authScreen.classList.remove('hidden');
    clearAuthMessages();

    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';
    authTabLogin?.click();

    console.log('🚪 로그아웃 완료 및 대화 내역 초기화 완료');
});

// 🔄 앱 시작 시 세션 초기화
async function checkExistingSession() {
    if (!supabaseClient) {
        authScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        return;
    }

    try {
        await supabaseClient.auth.signOut();
    } catch (err) {
        console.warn('초기 세션 리셋:', err.message);
    }
}

checkExistingSession();

// ──────────────────────────────────────────────────────────
//  2. Gemini API 키 상태 관리
// ──────────────────────────────────────────────────────────
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key') || '';

if (GEMINI_API_KEY) {
    updateApiKeyStatus(true);
    apiKeyInput.value = GEMINI_API_KEY;
}

saveApiKeyBtn?.addEventListener('click', () => {
    const key = apiKeyInput ? apiKeyInput.value.trim() : '';
    if (key.length < 6) {
        alert('API 키가 너무 짧습니다. 올바른 Gemini API 키를 입력해주세요.');
        return;
    }
    GEMINI_API_KEY = key;
    localStorage.setItem('gemini_api_key', key);
    updateApiKeyStatus(true);
    alert('✅ API 키가 성공적으로 저장되었습니다! 이제 실제 Gemini AI가 약 성분을 분석해 드립니다.');
});

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
//  3. 내 약물 보관함 (Cabinet)
// ──────────────────────────────────────────────────────────
let cabinet = [];
let selectedImageFile = null;
renderCabinet();

// ──────────────────────────────────────────────────────────
//  4. Gemini AI API 호출 핵심 함수
// ──────────────────────────────────────────────────────────
async function callGeminiAPI(userMessage, cabinetItems, imageBase64 = null) {
    const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

    let MODELS = [];
    try {
        const listRes = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`);
        if (listRes.ok) {
            const listData = await listRes.json();
            MODELS = (listData.models || [])
                .filter(m =>
                    m.supportedGenerationMethods?.includes('generateContent') &&
                    m.name.includes('gemini') &&
                    !m.name.includes('gemini-2.5') &&
                    !m.name.includes('experimental') &&
                    !m.name.includes('preview')
                )
                .map(m => m.name.replace('models/', ''))
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

    if (MODELS.length === 0) {
        MODELS = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-pro'];
    }
    console.log('[사용 가능한 모델]', MODELS);

    const cabinetText = cabinetItems.length > 0
        ? `\n\n[내 약물 보관함 - 현재 복용 중인 약물 목록]:\n${cabinetItems.map((x, i) => `${i + 1}. ${x.name} (${x.type})`).join('\n')}`
        : '\n\n[내 약물 보관함]: 비어 있음';

    const systemPrompt = `당신은 한국의 의약품 및 건강기능식품(영양제) 전문 AI 성분 분석 어시스턴트입니다.
사용자가 약품명, 영양제명, 또는 성분표를 여러 개 언급하거나 질문하면 다음을 수행하세요:

[필수 규칙]:
1. 질문에 언급된 **모든 약물과 영양제 각각에 대해** 절대로 누락하지 말고 개별 분석을 수행하세요. (예: "타이레놀, 우루사, 임팩타민 성분 알려줘" 라면 3가지 모두 각각 분석!)
2. 각 약물/영양제의 **모든 주성분 및 부성분, 함량, 각 성분의 역할/효능**을 빠짐없이 상세히 추출하세요.
3. 언급된 약물들 간의 상호작용 및 [내 약물 보관함] 목록 약들과의 복합 상호작용 위험(성분 중복, 오남용, 간독성, 흡수 방해 등)을 정밀 대조하세요.
4. 위험 수준을 WARNING, CAUTION, SAFE 중 결정하세요.

[제외 요청 처리 - 매우 중요]:
5. 사용자가 특정 약물/성분을 "제외", "빼고", "말고", "제외하고" 등으로 표현하면, 해당 약물의 **성분명, 별칭, 추출물명, 영어명** 모두를 파악하여 동일 계열의 약물을 절대 추천하지 마세요.
   - 예시: "밀크씨슬 제외" → 실리마린(Silymarin), 밀크씨슬 추출물, Milk Thistle Extract 포함 제품 모두 제외
   - 예시: "아세트아미노펜 제외" → 타이레놀, 게보린, 테라플루 등 아세트아미노펜 함유 전 제품 제외
   - 예시: "오메가3 제외" → EPA, DHA, 어유(Fish Oil) 함유 제품 모두 제외
   - 예시: "비타민C 제외" → 아스코르브산(Ascorbic Acid) 함유 제품 모두 제외
   - 예시: "마그네슘 제외" → 산화마그네슘, 구연산마그네슘, 글리신산마그네슘 등 모든 마그네슘 형태 제외
6. 추천 시 제외 요청된 약물/성분과 같은 효능이나 동일 주성분을 가진 대안을 추천할 때는 반드시 user_summary에 "○○(제외된 약물)와 유사하여 제외되었습니다"라고 명시하며 다른 계열의 약물만 추천하세요.

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "products": [
    {
      "product_name": "첫 번째 제품명 (예: 타이레놀 500mg)",
      "type": "의약품 또는 건강기능식품",
      "main_ingredients": [
        {"name": "성분명", "amount": "함량", "role": "성분 역할/효능"}
      ],
      "dosage_guide": {
        "recommended_daily": "권장 복용법",
        "precautions": ["주의사항1", "주의사항2"]
      }
    },
    {
      "product_name": "두 번째 제품명 (예: 우루사 100mg)",
      "type": "의약품 또는 건강기능식품",
      "main_ingredients": [
        {"name": "성분명", "amount": "함량", "role": "성분 역할/효능"}
      ],
      "dosage_guide": {
        "recommended_daily": "권장 복용법",
        "precautions": ["주의사항1", "주의사항2"]
      }
    }
  ],
  "risk_analysis": {
    "has_risk": true 또는 false,
    "risk_level": "WARNING 또는 CAUTION 또는 SAFE",
    "warnings": ["발견된 위험 내용 설명 (중복 성분, 오남용 위험 등)"]
  },
  "user_summary": "질문된 모든 약물들에 대한 종합 3~4줄 한국어 요약"
}`;

    const parts = [];

    if (imageBase64) {
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64
            }
        });
    }

    parts.push({ text: systemPrompt + cabinetText + '\n\n[사용자 질문]: ' + userMessage });

    const requestBody = {
        contents: [{
            parts: parts
        }],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024
        }
    };

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
                    continue;
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
                continue;
            }
            throw err;
        }
    }

    const lastMsg = lastError?.message || '알 수 없는 오류';
    throw new Error(`사용 가능한 Gemini 모델을 찾지 못했습니다.\n\n상세 오류: ${lastMsg.substring(0, 120)}\n\n💡 확인사항:\n1. API 키가 올바른지 다시 확인해주세요.\n2. Google AI Studio(aistudio.google.com)에서 API 키 상태를 확인해주세요.\n3. 잠시 후 다시 시도해주세요.`);
}

// ──────────────────────────────────────────────────────────
//  5. 보관함 UI 렌더링 & Supabase DB 연동 함수
// ──────────────────────────────────────────────────────────

async function fetchMedicinesFromSupabase() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from('medicines')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Supabase 조회 오류:', error.message);
            return;
        }

        if (data && data.length > 0) {
            cabinet = data.map(item => ({
                id: item.id,
                name: item.name,
                type: item.type || '의약품',
                ingredients: item.ingredients || '',
                selected: item.selected !== false
            }));
            renderCabinet();
            renderDbMedicineList(data);
        } else {
            cabinet = [];
            renderCabinet();
            renderDbMedicineList([]);
        }
    } catch (err) {
        console.warn('Supabase 데이터 로드 중 오류:', err.message);
    }
}

async function addMedicineToSupabase(name, type = '의약품', ingredients = '') {
    if (!name.trim()) return;

    const newItem = { id: Date.now(), name, type, ingredients, selected: true };
    cabinet.unshift(newItem);
    renderCabinet();

    if (supabaseClient && currentUser) {
        try {
            const { data, error } = await supabaseClient
                .from('medicines')
                .insert([{ name, type, ingredients, selected: true, user_id: currentUser.id }])
                .select();

            if (error) console.error('Supabase 추가 실패:', error.message);
            else {
                console.log('Supabase 추가 성공:', data);
                fetchMedicinesFromSupabase();
            }
        } catch (e) {
            console.error('Supabase 연동 실패:', e);
        }
    } else if (!currentUser) {
        console.warn('로그인이 필요합니다.');
    }
}

async function deleteMedicineFromSupabase(id) {
    cabinet = cabinet.filter(x => String(x.id) !== String(id));
    renderCabinet();

    if (supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('medicines')
                .delete()
                .eq('id', id);

            if (error) console.error('Supabase 삭제 실패:', error.message);
            else {
                console.log('Supabase 삭제 성공 ID:', id);
                fetchMedicinesFromSupabase();
            }
        } catch (e) {
            console.error('Supabase 삭제 중 예외:', e);
        }
    }
}

function renderCabinet() {
    cabinetCountEl.textContent = cabinet.length;
    localStorage.setItem('my_medicine_cabinet', JSON.stringify(cabinet));

    if (cabinet.length === 0) {
        cabinetListEl.innerHTML = `<div style="text-align:center;font-size:0.78rem;color:#8b949e;padding:1rem;">보관함이 비어 있습니다.<br>AI 분석 후 [보관함에 저장]하거나 상단 [약물 보관함 관리] 탭에서 추가해보세요!</div>`;
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
            <button class="delete-item-btn" data-id="${item.id}" title="대조 대상에서 제외 (DB 삭제 안 됨)">✕</button>
        </div>
    `).join('');

    document.querySelectorAll('.cabinet-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
            const id = e.target.getAttribute('data-id');
            const found = cabinet.find(x => String(x.id) === String(id));
            if (found) { found.selected = e.target.checked; renderCabinet(); }
        });
    });

    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            cabinet = cabinet.filter(x => String(x.id) !== String(id));
            renderCabinet();
        });
    });
}

clearCabinetBtn?.addEventListener('click', () => {
    if (cabinet.length === 0) return;
    if (confirm('현재 대조할 약물 선택을 모두 해제하시겠습니까?\n(💡 Supabase DB의 약물 데이터는 삭제되지 않고 안전하게 보관됩니다.)')) {
        cabinet.forEach(x => x.selected = false);
        renderCabinet();
    }
});

// ──────────────────────────────────────────────────────────
//  5-1. 상단 탭 (챗봇 vs 약물 보관함 관리) 화면 전환 로직
// ──────────────────────────────────────────────────────────
const tabBtnChat    = document.getElementById('tab-btn-chat');
const tabBtnCabinet = document.getElementById('tab-btn-cabinet');

const viewChatbot       = document.getElementById('view-chatbot');
const viewCabinetManage = document.getElementById('view-cabinet-manage');

tabBtnChat?.addEventListener('click', () => {
    tabBtnChat.classList.add('active');
    tabBtnCabinet.classList.remove('active');

    viewChatbot.classList.remove('hidden-view');
    viewChatbot.classList.add('active-view');

    viewCabinetManage.classList.add('hidden-view');
    viewCabinetManage.classList.remove('active-view');
});

tabBtnCabinet?.addEventListener('click', () => {
    tabBtnCabinet.classList.add('active');
    tabBtnChat.classList.remove('active');

    viewCabinetManage.classList.remove('hidden-view');
    viewCabinetManage.classList.add('active-view');

    viewChatbot.classList.add('hidden-view');
    viewChatbot.classList.remove('active-view');

    fetchMedicinesFromSupabase();
});

const newMedNameInput        = document.getElementById('new-med-name');
const newMedTypeSelect       = document.getElementById('new-med-type');
const newMedIngredientsInput = document.getElementById('new-med-ingredients');
const addMedDbBtn            = document.getElementById('add-med-db-btn');

const dbMedListEl  = document.getElementById('db-med-list');
const dbMedCountEl = document.getElementById('db-med-count');
const refreshDbBtn = document.getElementById('refresh-db-btn');

refreshDbBtn?.addEventListener('click', fetchMedicinesFromSupabase);

addMedDbBtn?.addEventListener('click', async () => {
    const name = newMedNameInput.value.trim();
    const type = newMedTypeSelect.value;
    const ingredients = newMedIngredientsInput.value.trim();

    if (!name) {
        alert('약물 또는 영양제 이름을 입력해주세요.');
        return;
    }

    await addMedicineToSupabase(name, type, ingredients);
    newMedNameInput.value = '';
    newMedIngredientsInput.value = '';
    alert(`✅ '${name}' 제품이 Supabase DB 보관함에 추가되었습니다!`);
});

function renderDbMedicineList(items) {
    if (!dbMedListEl) return;
    dbMedCountEl.textContent = items.length;

    if (items.length === 0) {
        dbMedListEl.innerHTML = `<div style="text-align:center;color:#8b949e;padding:1.5rem;font-size:0.85rem;">등록된 약물이 없습니다. 위 폼에서 약물을 추가해보세요!</div>`;
        return;
    }

    dbMedListEl.innerHTML = items.map(item => `
        <div class="db-med-row">
            <div class="db-med-info">
                <span class="db-med-title">💊 ${escapeHtml(item.name)} <span style="font-size:0.75rem;color:#38bdf8;">(${escapeHtml(item.type)})</span></span>
                <span class="db-med-sub">🧪 성분: ${escapeHtml(item.ingredients || '성분 미입력')}</span>
            </div>
            <button class="secondary-btn-danger" onclick="confirmDeleteDbItem('${item.id}', '${escapeHtml(item.name)}')">DB에서 삭제 🗑️</button>
        </div>
    `).join('');
}

window.confirmDeleteDbItem = async function(id, name) {
    if (confirm(`정말로 Supabase DB에서 '${name}' 약물을 영구 삭제하시겠습니까?`)) {
        await deleteMedicineFromSupabase(id);
        alert(`🗑️ '${name}' 약물이 Supabase DB에서 삭제되었습니다.`);
    }
};

fetchMedicinesFromSupabase();

// ──────────────────────────────────────────────────────────
//  6. 사진 첨부 기능
// ──────────────────────────────────────────────────────────
photoUploadBtn?.addEventListener('click', () => imageUploadInput?.click());

imageUploadInput?.addEventListener('change', (e) => {
    if (e.target.files?.[0]) {
        selectedImageFile = e.target.files[0];
        if (previewFilename) previewFilename.textContent = selectedImageFile.name;
        imagePreviewContainer?.classList.remove('hidden');
        if (!chatInput.value.trim()) {
            chatInput.value = `이 약/영양제 사진의 성분과 복용법을 분석하고, 내 보관함 약물들과의 상호작용 위험을 알려줘.`;
        }
    }
});

removeImgBtn?.addEventListener('click', () => {
    selectedImageFile = null;
    if (imageUploadInput) imageUploadInput.value = '';
    imagePreviewContainer?.classList.add('hidden');
});

// ──────────────────────────────────────────────────────────
//  7. 전역 버튼 클릭 이벤트 (비밀번호 토글, 칩 버튼)
// ──────────────────────────────────────────────────────────
document.addEventListener('click', (e) => {
    const pwToggleBtn = e.target.closest('.pw-toggle-btn');
    if (pwToggleBtn) {
        const targetId = pwToggleBtn.getAttribute('data-target');
        const inputEl = document.getElementById(targetId);
        if (inputEl) {
            if (inputEl.type === 'password') {
                inputEl.type = 'text';
                pwToggleBtn.textContent = '🙈';
            } else {
                inputEl.type = 'password';
                pwToggleBtn.textContent = '👁️';
            }
        }
        return;
    }

    const chipBtn = e.target.closest('.chip-btn');
    if (chipBtn) {
        const query = chipBtn.getAttribute('data-query');
        if (query && chatInput) {
            chatInput.value = query;
            handleSendMessage();
        }
        return;
    }
});

// ──────────────────────────────────────────────────────────
//  8. 메시지 전송 핸들러 (AI 분석 실행 핵심)
// ──────────────────────────────────────────────────────────
sendBtn?.addEventListener('click', handleSendMessage);
chatInput?.addEventListener('keydown', (e) => {
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
            analysisResult = localKnowledgeBase(userText, selectedCabinetItems);
            await new Promise(r => setTimeout(r, 600));
        } else {
            let imageBase64 = null;
            if (capturedImageFile) {
                imageBase64 = await fileToBase64(capturedImageFile);
            }
            analysisResult = await callGeminiAPI(userText, selectedCabinetItems, imageBase64);
        }

        chatHistory.removeChild(loadingBubble);
        appendAiResponseMessage(analysisResult);
        jsonOutput.textContent = JSON.stringify(analysisResult, null, 2);

    } catch (err) {
        chatHistory.removeChild(loadingBubble);
        appendErrorMessage(`AI 분석 중 오류가 발생했습니다: ${err.message}`);
    }

    scrollToBottom();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function localKnowledgeBase(userText, cabinetItems) {
    const text = userText.toLowerCase();
    const cabinetNames = cabinetItems.map(x => x.name.toLowerCase()).join(' ');

    const foundProducts = [];

    if (text.includes('타이레놀') || text.includes('아세트아미노펜')) {
        foundProducts.push({
            product_name: '타이레놀 500mg',
            type: '의약품',
            main_ingredients: [{ name: '아세트아미노펜', amount: '500mg', role: '해열진통제 (통증 및 발열 완화)' }],
            dosage_guide: { recommended_daily: '1회 1~2정, 하루 최대 4g(4,000mg) 초과 금지', precautions: ['음주 중 복용 금지 (간 손상 위험)', '다른 아세트아미노펜 제품과 중복 금지'] }
        });
    }

    if (text.includes('우루사')) {
        foundProducts.push({
            product_name: '우루사 100mg',
            type: '의약품',
            main_ingredients: [
                { name: '우르소데옥시콜산(UDCA)', amount: '100mg', role: '담즙 분비 촉진, 간 기능 개선' },
                { name: '비타민B1(티아민)', amount: '10mg', role: '피로 회복 및 에너지 대사' }
            ],
            dosage_guide: { recommended_daily: '1일 3회, 1회 1정 식후 복용', precautions: ['담석증 환자는 전문의 상담 후 복용'] }
        });
    }

    if (text.includes('게보린')) {
        foundProducts.push({
            product_name: '게보린정',
            type: '의약품',
            main_ingredients: [
                { name: '아세트아미노펜', amount: '300mg', role: '해열 진통 효과' },
                { name: '이소프로필안티피린', amount: '150mg', role: '소염 진통 작용' },
                { name: '카페인무수물', amount: '50mg', role: '진통 효과 증대 및 약효 흡수 촉진' }
            ],
            dosage_guide: { recommended_daily: '1회 1정, 1일 3회 이내 복용', precautions: ['카페인 민감자 주의', '타이레놀과 중복 복용 주의'] }
        });
    }

    if (text.includes('임팩타민')) {
        foundProducts.push({
            product_name: '임팩타민 파워',
            type: '건강기능식품',
            main_ingredients: [
                { name: '벤포티아민(비타민B1)', amount: '50mg', role: '육체 피로 및 활력 개선' },
                { name: '비타민B2', amount: '20mg', role: '구포염 예방, 세포 대사' },
                { name: '비타민B6', amount: '30mg', role: '신경 전달 물질 합성' },
                { name: '비타민B12', amount: '250mcg', role: '적혈구 형성 및 신경 건강' }
            ],
            dosage_guide: { recommended_daily: '1일 1회 1정 식후 복용', precautions: ['고용량 비타민B군 복용 시 위장 장애 주의'] }
        });
    }

    if (text.includes('오메가3') || text.includes('오메가-3')) {
        foundProducts.push({
            product_name: '오메가3 EPA/DHA',
            type: '건강기능식품',
            main_ingredients: [
                { name: 'EPA(에이코사펜타엔산)', amount: '180mg', role: '혈중 중성지질 및 혈행 개선' },
                { name: 'DHA(도코사헥사엔산)', amount: '120mg', role: '뇌 세포 및 망막 구성 성분' }
            ],
            dosage_guide: { recommended_daily: '1일 1~3캡슐 식후 복용', precautions: ['항응고제 복용 시 출혈 위험 주의'] }
        });
    }

    if (foundProducts.length > 0) {
        const productNames = foundProducts.map(p => p.product_name).join(', ');
        const hasAspirin = cabinetNames.includes('아스피린') || cabinetNames.includes('와파린');
        const hasAcetaDouble = (text.includes('타이레놀') && text.includes('게보린')) || (cabinetNames.includes('타이레놀') && text.includes('게보린'));

        const warnings = [];
        if (hasAcetaDouble) warnings.push('⚠️ 타이레놀과 게보린 모두 아세트아미노펜을 포함하여 중복 복용 시 간 독성 위험이 발생합니다.');
        if (hasAspirin && (text.includes('오메가3') || text.includes('오메가-3'))) warnings.push('⚠️ 보관함의 아스피린과 오메가3 병용 시 혈액 지혈 지연 가능성이 있습니다.');

        return {
            products: foundProducts,
            risk_analysis: {
                has_risk: warnings.length > 0,
                risk_level: warnings.length > 0 ? 'WARNING' : 'SAFE',
                warnings: warnings
            },
            user_summary: `✅ 질문하신 ${foundProducts.length}가지 제품(${productNames})의 전체 성분 분석을 완료했습니다.`
        };
    }

    return {
        products: [{
            product_name: userText.substring(0, 40),
            type: '분류 불명',
            main_ingredients: [{ name: '성분 확인 불가 (API 키 필요)', amount: '-', role: 'Gemini API 키를 등록하면 정확한 성분이 조회됩니다.' }],
            dosage_guide: { recommended_daily: '제품 포장지 용법 참고', precautions: ['정확한 성분 분석을 위해 Gemini API 키를 설정해주세요.'] }
        }],
        risk_analysis: { has_risk: false, risk_level: 'SAFE', warnings: [] },
        user_summary: `💡 "${userText.substring(0,20)}..."에 대한 정보를 찾을 수 없습니다. Gemini API 키를 설정하시면 어떤 약이든 실제 AI가 정확히 분석해 드립니다!`
    };
}

// ──────────────────────────────────────────────────────────
//  11. 채팅 말풍선 생성 함수들
// ──────────────────────────────────────────────────────────
function scrollToBottom() {
    chatHistory.scrollTo({
        top: chatHistory.scrollHeight,
        behavior: 'smooth'
    });
}

function appendUserMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble user-bubble';
    bubble.innerHTML = `<div class="avatar">👤</div><div class="bubble-content"><p>${escapeHtml(text)}</p></div>`;
    chatHistory.appendChild(bubble);
    scrollToBottom();
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
    scrollToBottom();
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
                <strong style="color:#f87171;">⚠️ 보관함 및 약물 간 상호작용 위험:</strong>
                <ul style="padding-left:1.2rem;font-size:0.88rem;color:#fecdd3;margin-top:0.3rem;">
                    ${res.risk_analysis.warnings.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>`;
    }

    let productList = [];
    if (res.products && Array.isArray(res.products) && res.products.length > 0) {
        productList = res.products;
    } else if (res.identification) {
        productList = [{
            product_name: res.identification.product_name || '분석 제품',
            type: res.identification.type || '',
            main_ingredients: res.identification.main_ingredients || [],
            dosage_guide: res.dosage_guide || {}
        }];
    }

    const productsHtml = productList.map((prod, idx) => {
        const prodName = prod.product_name || `제품 ${idx + 1}`;
        const prodType = prod.type || '분류 미지정';

        const ingredientsHtml = prod.main_ingredients?.map(i => `
            <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(56,189,248,0.25);border-radius:6px;padding:0.4rem 0.6rem;margin-bottom:0.3rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:#38bdf8;font-weight:600;font-size:0.85rem;">🧪 ${escapeHtml(i.name)}</span>
                    <span style="background:rgba(56,189,248,0.15);color:#7dd3fc;border-radius:4px;padding:0.05rem 0.4rem;font-size:0.75rem;font-weight:600;">${escapeHtml(i.amount || '함량 정보 없음')}</span>
                </div>
                ${i.role ? `<div style="font-size:0.78rem;color:#94a3b8;margin-top:0.25rem;">💡 ${escapeHtml(i.role)}</div>` : ''}
            </div>
        `).join('') || '<span style="color:#8b949e;font-size:0.8rem;">성분 정보 없음</span>';

        return `
            <div class="report-card-inline" style="margin-top:0.75rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:0.4rem;">
                    <span style="font-weight:700;font-size:0.95rem;color:#f0f6fc;">📦 ${idx + 1}. ${escapeHtml(prodName)}</span>
                    <span style="color:#8b949e;font-size:0.78rem;background:#1e293b;padding:0.1rem 0.5rem;border-radius:4px;">${escapeHtml(prodType)}</span>
                </div>
                <p style="margin-bottom:0.4rem;"><strong>🧪 전체 성분 상세:</strong></p>
                <div style="margin-bottom:0.6rem;">${ingredientsHtml}</div>
                <p style="margin-bottom:0.3rem;font-size:0.85rem;"><strong>📋 복용 가이드:</strong> ${escapeHtml(prod.dosage_guide?.recommended_daily || '-')}</p>
                ${prod.dosage_guide?.precautions?.length > 0 ? `<ul style="padding-left:1.1rem;font-size:0.8rem;color:#94a3b8;margin-top:0.2rem;">${prod.dosage_guide.precautions.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>` : ''}
                
                <button class="save-cabinet-btn" onclick="saveToCabinet('${escapeHtml(prodName)}', '${escapeHtml(prodType)}')">
                    💾 '${escapeHtml(prodName)}' 내 보관함에 추가하기
                </button>
            </div>
        `;
    }).join('');

    bubble.innerHTML = `
        <div class="avatar">✨</div>
        <div class="bubble-content">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                <strong>🔬 AI 분석 결과 (${productList.length}개 약물 성분 분석)</strong>
                <span class="risk-badge-inline ${badgeClass}">${riskLevel}</span>
            </div>

            <p style="margin-bottom:0.7rem;line-height:1.6;">${res.user_summary || '입력하신 약물들에 대한 분석이 완료되었습니다.'}</p>

            ${warningHtml}

            ${productsHtml}
        </div>`;

    chatHistory.appendChild(bubble);
    scrollToBottom();
}

window.saveToCabinet = async function(name, type) {
    if (cabinet.some(x => x.name === name)) {
        alert('이미 보관함에 저장되어 있는 제품입니다.');
        return;
    }
    await addMedicineToSupabase(name, type, 'AI 분석 추가 성분');
    alert(`✅ '${name}' 제품이 Supabase DB 및 내 약물 보관함에 저장되었습니다!`);
};

copyJsonBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(jsonOutput.textContent).then(() => {
        copyJsonBtn.textContent = '복사 완료! ✅';
        setTimeout(() => { copyJsonBtn.textContent = 'JSON 복사'; }, 2000);
    });
});

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

console.log('✅ 실제 Gemini AI 연동 어시스턴트 및 비밀번호 재설정/변경 준비 완료');
