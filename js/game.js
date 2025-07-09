// ========== game.js (お題選択・1クリック判定付きバージョン) ==========

// 0. ゲームの設定と変数
const articlePool = [
    "日本", "アメリカ合衆国", "中華人民共和国", "イギリス", "フランス", "イタリア", "エジプト", "ブラジル", "オーストラリア", "東京都", "京都府", "北海道", "沖縄県", "パリ", "ロンドン", "ニューヨーク",
    "江戸時代", "戦国時代", "古代ローマ", "第二次世界大戦", "織田信長", "徳川家康", "ジャンヌ・ダルク", "クレオパトラ7世", "参勤交代", "忍者", "紙", "ビール", "チョコレート", "コンクリート",
    "相対性理論", "量子力学", "DNA", "人工知能", "プログラミング言語", "インターネット", "スマートフォン", "蒸気機関", "火薬", "電話", "アルキメデス", "アイザック・ニュートン", "アルベルト・アインシュタイン", "マリー・キュリー",
    "恐竜", "マンモス", "ライオン", "パンダ", "クジラ", "サメ", "イヌ", "ジャガイモ", "富士山", "エベレスト", "サハラ砂漠", "アマゾン川", "熱帯雨林", "サンゴ礁",
    "寿司", "ラーメン", "コーヒー", "ワイン", "歌舞伎", "浮世絵", "モナ・リザ", "ピアノ", "交響曲", "ウィリアム・シェイクスピア", "レオナルド・ダ・ヴィンチ", "葛飾北斎",
    "野球", "サッカー", "大相撲", "オリンピック", "映画", "テレビゲーム", "PlayStation", "スーパーマリオブラザーズ", "スタジオジブリ", "不思議の国のアリス"
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
const startSelect = document.getElementById('start-select');
const goalSelect = document.getElementById('goal-select');
const randomButton = document.getElementById('random-button');

// 1. 初期化処理とイベントリスナー
document.addEventListener('DOMContentLoaded', () => {
    if (!startButton) return;
    populateSelectors();
    startButton.addEventListener('click', startGame);
    randomButton.addEventListener('click', setRandomTheme);
    wikiContentEl.addEventListener('click', handleWikiLinkClick);
});

function populateSelectors() {
    const sortedArticles = [...articlePool].sort((a, b) => a.localeCompare(b, 'ja'));
    sortedArticles.forEach(article => {
        startSelect.add(new Option(article, article));
        goalSelect.add(new Option(article, article));
    });
    setRandomTheme();
}

function setRandomTheme() {
    let randStartIndex, randGoalIndex;
    do {
        randStartIndex = Math.floor(Math.random() * articlePool.length);
        randGoalIndex = Math.floor(Math.random() * articlePool.length);
    } while (randStartIndex === randGoalIndex);
    startSelect.value = articlePool[randStartIndex];
    goalSelect.value = articlePool[randGoalIndex];
}

// 2. ゲームロジック
async function startGame() {
    const selectedStart = startSelect.value;
    const selectedGoal = goalSelect.value;

    if (selectedStart === selectedGoal) {
        alert("スタートとゴールには異なるページを選んでください。");
        return;
    }

    // --- ★★★ 1クリック判定処理 ★★★ ---
    startButton.disabled = true;
    startButton.textContent = "お題をチェック中...";
    
    const isInvalid = await isOneClickAway(selectedStart, selectedGoal);

    startButton.disabled = false;
    startButton.textContent = "このお題でゲーム開始";

    if (isInvalid) {
        alert("その組み合わせは1クリックで到達できてしまうため、別のお題を選んでください。");
        return;
    }
    // --- ★★★ 1クリック判定ここまで ★★★ ---

    currentStartPage = selectedStart;
    currentGoalPage = selectedGoal;
    clickCount = 0;
    isGameRunning = true;
    startPageEl.textContent = currentStartPage;
    goalPageEl.textContent = currentGoalPage;
    clickCountEl.textContent = clickCount;
    startButton.textContent = "このお題でリセット";
    loadArticle(currentStartPage);
}

// ★★★ 1クリックで行けるかチェックする新機能 ★★★
async function isOneClickAway(startPage, goalPage) {
    // Wikipedia APIで、スタートページに含まれるリンク一覧を取得する
    // `pllimit=max`で最大500件のリンクを取得
    const apiUrl = `https://ja.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(startPage)}&prop=links&pllimit=max&format=json&origin=*`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];

        // ページにリンク情報がない場合はチェックをスキップ
        if (!pages[pageId].links) {
            return false;
        }

        const links = pages[pageId].links;
        // リンクの配列の中に、ゴールページのタイトルと一致するものがあるか探す
        return links.some(link => link.title === goalPage);

    } catch (error) {
        console.error("1クリック判定APIの呼び出しに失敗しました:", error);
        // エラー時は安全のため、ゲームを開始できるようにfalseを返す
        return false;
    }
}


// (loadArticle, handleWikiLinkClick, saveScore 関数は変更ありません)
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
    
    const isMobile = window.innerWidth <= 768;
    let htmlContent = '';
    
    wikiContentEl.innerHTML = `<p>読み込み中...</p>`;

    try {
        if (isMobile) {
            const mobileApiUrl = `https://ja.wikipedia.org/api/rest_v1/page/mobile-html/${encodeURIComponent(pageTitle)}`;
            const response = await fetch(mobileApiUrl, { headers: { 'Accept': 'text/html' } });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.title || `記事の読み込みに失敗`);
            }
            htmlContent = await response.text();
        } else {
            const desktopApiUrl = `https://ja.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&format=json&prop=text&origin=*&redirects=1`;
            const response = await fetch(desktopApiUrl);
            const data = await response.json();
            if (data.parse && data.parse.text) {
                htmlContent = data.parse.text['*'];
                if (data.parse.title !== currentPage) {
                    currentPage = data.parse.title;
                    currentPageEl.textContent = currentPage;
                }
            } else {
                throw new Error(data.error?.info || `記事の読み込みに失敗`);
            }
        }
        
        const sanitizedHtml = DOMPurify.sanitize(htmlContent);
        wikiContentEl.innerHTML = sanitizedHtml;

        if (isGameRunning && currentPage === currentGoalPage) {
            isGameRunning = false;
            const resultMessage = `<h1>ゴール！</h1><p>${clickCount}クリックで「${currentStartPage}」から「${currentGoalPage}」に到達しました！</p>`;
            wikiContentEl.innerHTML = resultMessage;
            await saveScore(currentStartPage, currentGoalPage, clickCount);
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
    loadArticle(decodeURIComponent(href.substring(6)));
}

async function saveScore(start, goal, clicks) {
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