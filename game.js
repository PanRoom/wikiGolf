// ========== game.js (ゲームページ専用: game.html) ==========

// 0. ゲームの設定と変数
//-----------------------------------
const themes = [
    { start: "ジーンズ", goal: "紙" },
    { start: "ビール", goal: "参勤交代" },
    { start: "チョコレート", goal: "歌舞伎" },
    { start: "江戸時代", goal: "コンクリート" },
    { start: "忍者", goal: "古代ローマ" },
    { start: "寿司", goal: "相対性理論" },
    { start: "蒸気機関", goal: "イヌ" },
    { start: "火薬", goal: "電話" },
    { start: "恐竜", goal: "ジャガイモ" },
    { start: "ピアノ", goal: "アンデス山脈" },
    { start: "パンダ", goal: "不思議の国のアリス" },
    { start: "南極", goal: "モナ・リザ" },
    { start: "映画", goal: "マヤ文明" }
];
let currentStartPage = "";
let currentGoalPage = "";
let clickCount = 0;
let currentPage = "";
let isGameRunning = false;

// DOM要素
const startPageEl = document.getElementById('start-page');
const goalPageEl = document.getElementById('goal-page');
const clickCountEl = document.getElementById('click-count');
const currentPageEl = document.getElementById('current-page');
const wikiContentEl = document.getElementById('wiki-content');
const startButton = document.getElementById('start-button');

// 1. イベントリスナーの設定
//-----------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // このページに必要なDOM要素がなければ処理を中断
    if (!startButton || !wikiContentEl) return;

    // ゲーム開始ボタンにイベントを紐付け
    startButton.addEventListener('click', startGame);
    
    // Wikipediaのコンテンツエリアにクリックイベントを紐付け
    wikiContentEl.addEventListener('click', handleWikiLinkClick);
});

// 2. ゲームロジック
//-----------------------------------
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

    if (isGameRunning && currentPage === currentGoalPage) {
        isGameRunning = false;
        const resultMessage = `<h1>ゴール！</h1><p>${clickCount}クリックで「${currentStartPage}」から「${currentGoalPage}」に到達しました！</p>`;
        wikiContentEl.innerHTML = resultMessage;
        
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
            if(data.parse.title !== currentPage) {
                currentPage = data.parse.title;
                currentPageEl.textContent = currentPage;
                // リダイレクト後にゴール判定を再度行う
                if (isGameRunning && currentPage === currentGoalPage) {
                    loadArticle(currentPage);
                }
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

// 3. スコア保存 (API通信)
//-----------------------------------
async function saveScore(start, goal, clicks) {
    // currentUserはmain.jsで定義されているグローバル変数
    if (!currentUser) return;
    
    try {
        const response = await fetch('api.php?action=save_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start, goal, clicks })
        });
        const result = await response.json();
        if (result.success) {
            console.log('記録を保存しました。');
        }
    } catch (error) {
        console.error('記録の保存に失敗:', error);
    }
}