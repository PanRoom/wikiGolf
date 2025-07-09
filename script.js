// 0. グローバル変数とDOM要素
//-----------------------------------
// (ゲームロジックの変数は変更なし)
const themes = [
    { start: "日本", goal: "アメリカ合衆国" }, { start: "ラーメン", goal: "イタリア" },
    { start: "ネコ", goal: "ライオン" }, { start: "コンピュータ", goal: "人工知能" },
    { start: "江戸時代", goal: "スマートフォン" }, { start: "地球", goal: "火星" },
    { start: "哲学", goal: "宇宙" }
];
let currentStartPage = "", currentGoalPage = "";
let clickCount = 0, currentPage = "", isGameRunning = false;

// ユーザー情報の状態管理
let currentUser = null;

// DOM要素
const startPageEl = document.getElementById('start-page');
const goalPageEl = document.getElementById('goal-page');
const clickCountEl = document.getElementById('click-count');
const currentPageEl = document.getElementById('current-page');
const wikiContentEl = document.getElementById('wiki-content');
const startButton = document.getElementById('start-button');
const userInfoEl = document.getElementById('user-info');
const guestAreaEl = document.getElementById('guest-area');
const loginUsernameEl = document.getElementById('login-username');
const logoutButton = document.getElementById('logout-button');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register-form');
const showLoginLink = document.getElementById('show-login-form');
const authErrorEl = document.getElementById('auth-error');
const rankingListEl = document.getElementById('ranking-list');


// 1. イベントリスナーの設定
//-----------------------------------
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus(); // ページ読み込み時にログイン状態を確認
    updateRanking();    // ランキングを初期表示

    startButton.addEventListener('click', startGame);
    wikiContentEl.addEventListener('click', handleWikiLinkClick);

    // 認証関連
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutButton.addEventListener('click', handleLogout);
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(true); });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(false); });
});

// 2. 認証・API通信関連の関数 (★ここを修正)
//-----------------------------------
async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('register-username-input').value;
    const password = document.getElementById('register-password-input').value;
    
    try {
        // ★パスを修正
        const response = await fetch('api.php?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (response.ok && result.success) {
            alert(result.message);
            toggleAuthForms(false); // ログインフォームに切り替え
        } else {
            throw new Error(result.error || '登録に失敗しました。');
        }
    } catch (error) {
        authErrorEl.textContent = error.message;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username-input').value;
    const password = document.getElementById('login-password-input').value;

    try {
        // ★パスを修正
        const response = await fetch('api.php?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (response.ok && result.success) {
            currentUser = result.user;
            updateUI();
        } else {
            throw new Error(result.error || 'ログインに失敗しました。');
        }
    } catch (error) {
        authErrorEl.textContent = error.message;
    }
}

async function handleLogout() {
    // ★パスを修正
    await fetch('api.php?action=logout');
    currentUser = null;
    updateUI();
}

async function checkLoginStatus() {
    // ★パスを修正
    const response = await fetch('api.php?action=check_session');
    const result = await response.json();
    if (result.loggedIn) {
        currentUser = result.user;
    } else {
        currentUser = null;
    }
    updateUI();
}

async function saveScore(start, goal, clicks) {
    if (!currentUser) return;
    
    try {
        // ★パスを修正
        const response = await fetch('api.php?action=save_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start, goal, clicks })
        });
        const result = await response.json();
        if (result.success) {
            console.log('記録を保存しました。');
            updateRanking();
        }
    } catch (error) {
        console.error('記録の保存に失敗:', error);
    }
}

async function updateRanking() {
    rankingListEl.innerHTML = '<li>読み込み中...</li>';
    try {
        // ★パスを修正
        const response = await fetch('api.php?action=get_ranking');
        const rankingData = await response.json();
        rankingListEl.innerHTML = '';
        if (rankingData.length === 0) {
            rankingListEl.innerHTML = '<li>まだ記録がありません。</li>';
            return;
        }
        rankingData.forEach(rank => {
            const li = document.createElement('li');
            li.textContent = `${rank.username}さん: 「${rank.start_page}」→「${rank.goal_page}」 (${rank.click_count}クリック)`;
            rankingListEl.appendChild(li);
        });
    } catch (error) {
        rankingListEl.innerHTML = '<li>ランキングの読み込みに失敗しました。</li>';
    }
}


// 3. UI更新関連の関数
//-----------------------------------
function updateUI() {
    if (currentUser) {
        // ログイン状態
        userInfoEl.style.display = 'block';
        guestAreaEl.style.display = 'none';
        loginUsernameEl.textContent = currentUser.username;
    } else {
        // ゲスト状態
        userInfoEl.style.display = 'none';
        guestAreaEl.style.display = 'block';
    }
    authErrorEl.textContent = ''; // エラーメッセージをクリア
}

function toggleAuthForms(showRegister) {
    if (showRegister) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }
    authErrorEl.textContent = ''; // エラーメッセージをクリア
}

// 4. ゲームロジック (既存のものをベースに)
//-----------------------------------
// (startGame, loadArticle, handleWikiLinkClick関数は前回からほぼ変更なし)
function startGame() {
    const randomIndex = Math.floor(Math.random() * themes.length);
    const selectedTheme = themes[randomIndex];
    currentStartPage = selectedTheme.start;
    currentGoalPage = selectedTheme.goal;
    
    clickCount = 0;
    isGameRunning = true;
    
    startPageEl.textContent = currentStartPage;
    goalPageEl.textContent = currentGoalPage;
    clickCountEl.textContent = clickCount;
    startButton.textContent = "リセット";
    
    loadArticle(currentStartPage);
}

async function loadArticle(pageTitle) {
    currentPage = pageTitle;
    currentPageEl.textContent = currentPage;

    if (currentPage === currentGoalPage) {
        isGameRunning = false;
        const resultMessage = `<h1>ゴール！</h1><p>${clickCount}クリックで「${currentStartPage}」から「${currentGoalPage}」に到達しました！</p>`;
        wikiContentEl.innerHTML = resultMessage;
        
        // ★ログイン中ならスコアを保存
        await saveScore(currentStartPage, currentGoalPage, clickCount);
        return;
    }

    const apiUrl = `https://ja.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&format=json&prop=text&origin=*&redirects=1`;
    wikiContentEl.innerHTML = `<p>読み込み中...</p>`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.parse && data.parse.text) {
            const sanitizedHtml = DOMPurify.sanitize(data.parse.text['*']);
            wikiContentEl.innerHTML = sanitizedHtml;
            // ★リダイレクトされた場合、正式名称に更新する
            if(data.parse.title !== currentPage) {
                currentPage = data.parse.title;
                currentPageEl.textContent = currentPage;
            }
        } else {
            throw new Error(data.error?.info || `記事「${pageTitle}」を読み込めませんでした。`);
        }
    } catch (error) {
        isGameRunning = false;
        wikiContentEl.innerHTML = `<p>エラー: ${error.message}</p>`;
    }
}

function handleWikiLinkClick(event) {
    if (!isGameRunning) return;
    const target = event.target.closest('a');
    if (!target) return;
    const href = target.getAttribute('href');
    if (!href || !href.startsWith('/wiki/') || href.includes(':')) return;

    event.preventDefault();
    clickCount++;
    clickCountEl.textContent = clickCount;
    const nextPageTitle = decodeURIComponent(href.substring(6));
    loadArticle(nextPageTitle);
}