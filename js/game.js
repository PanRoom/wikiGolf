// ========== game.js (安全なDOM操作版) ==========

// グローバル変数
const articlePool = [
    "日本", "アメリカ合衆国", "中華人民共和国", "イギリス", "フランス", "イタリア", "エジプト", "ブラジル", "オーストラリア", "東京都", "京都府", "北海道", "沖縄県", "パリ", "ロンドン", "ニューヨーク", "江戸時代", "戦国時代", "古代ローマ", "第二次世界大戦", "織田信長", "徳川家康", "ジャンヌ・ダルク", "クレオパトラ7世", "参勤交代", "忍者", "紙", "ビール", "チョコレート", "コンクリート", "相対性理論", "量子力学", "DNA", "人工知能", "プログラミング言語", "インターネット", "スマートフォン", "蒸気機関", "火薬", "電話", "アルキメデス", "アイザック・ニュートン", "アルベルト・アインシュタイン", "マリー・キュリー", "恐竜", "マンモス", "ライオン", "パンダ", "クジラ", "サメ", "イヌ", "ジャガイモ", "富士山", "エベレスト", "サハラ砂漠", "アマゾン川", "熱帯雨林", "サンゴ礁", "寿司", "ラーメン", "コーヒー", "ワイン", "歌舞伎", "浮世絵", "モナ・リザ", "ピアノ", "交響曲", "ウィリアム・シェイクスピア", "レオナルド・ダ・ヴィンチ", "葛飾北斎", "野球", "サッカー", "大相撲", "オリンピック", "映画", "テレビゲーム", "PlayStation", "スーパーマリオブラザーズ", "スタジオジブリ", "不思議の国のアリス"
];
let currentStartPage = "", currentGoalPage = "";
let clickCount = 0, currentPage = "", isGameRunning = false;
let timerInterval = null, elapsedTime = 0, timerStartTime = 0;

// 初期化処理：HTMLの読み込み完了後にすべてを開始
document.addEventListener('DOMContentLoaded', () => {
    // --- ここで初めてDOM要素を取得します ---
    const startPageEl = document.getElementById('start-page');
    const goalPageEl = document.getElementById('goal-page');
    const clickCountEl = document.getElementById('click-count');
    const currentPageEl = document.getElementById('current-page');
    const wikiContentEl = document.getElementById('wiki-content');
    const startButton = document.getElementById('start-button');
    const startSelect = document.getElementById('start-select');
    const goalSelect = document.getElementById('goal-select');
    const randomButton = document.getElementById('random-button');
    const timerEl = document.getElementById('timer');
    const loadingOverlay = document.getElementById('loading-overlay');
    const rankingContainer = document.getElementById('theme-ranking-container');
    const rankingListEl = document.getElementById('theme-ranking-list');

    // このページに必要なDOM要素がなければ処理を中断
    if (!startButton || !wikiContentEl || !startSelect || !currentPageEl) return;

    // --- ここから先の処理はすべて、要素が確実に存在することを保証された状態で行われます ---

    // タイマー制御関数
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerStartTime = Date.now();
        timerInterval = setInterval(() => {
            const currentTotalTime = elapsedTime + (Date.now() - timerStartTime);
            timerEl.textContent = Math.floor(currentTotalTime / 1000);
        }, 1000);
    }
    function pauseTimer() {
        if (timerStartTime > 0) {
            elapsedTime += Date.now() - timerStartTime;
            timerStartTime = 0;
        }
        clearInterval(timerInterval);
        timerInterval = null;
    }
    function resetTimer() {
        pauseTimer();
        elapsedTime = 0;
        timerEl.textContent = '0';
    }

    // ゲームロジック関数
    async function startGame() {
        if(rankingContainer) rankingContainer.style.display = 'none';

        const selectedStart = startSelect.value;
        const selectedGoal = goalSelect.value;
        if (selectedStart === selectedGoal) {
            alert("スタートとゴールには異なるページを選んでください。");
            return;
        }
        startButton.disabled = true;
        startButton.textContent = "お題をチェック中...";
        const isInvalid = await isOneClickAway(selectedStart, selectedGoal);
        startButton.disabled = false;
        startButton.textContent = "このお題でゲーム開始";
        if (isInvalid) {
            alert("その組み合わせは1クリックで到達できてしまうため、別のお題を選んでください。");
            return;
        }
        currentStartPage = selectedStart;
        currentGoalPage = selectedGoal;
        clickCount = 0;
        isGameRunning = true;
        startPageEl.textContent = currentStartPage;
        goalPageEl.textContent = currentGoalPage;
        clickCountEl.textContent = clickCount;
        startButton.textContent = "このお題でリセット";
        resetTimer();
        loadArticle(currentStartPage);
    }

    async function isOneClickAway(startPage, goalPage) {
        const apiUrl = `https://ja.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(startPage)}&prop=links&pllimit=max&format=json&origin=*`;
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (!pages[pageId].links) return false;
            return pages[pageId].links.some(link => link.title === goalPage);
        } catch (error) {
            console.error("1クリック判定APIの呼び出しに失敗しました:", error);
            return false;
        }
    }

    async function loadArticle(pageTitle) {
        currentPage = pageTitle;
        currentPageEl.textContent = currentPage;

        if (isGameRunning && currentPage === currentGoalPage) {
            pauseTimer();
            isGameRunning = false;
            const finalTime = Math.round(elapsedTime / 1000);
            const resultMessage = `<h1>ゴール！</h1><p>${clickCount}クリック、${finalTime}秒で「${currentStartPage}」から「${currentGoalPage}」に到達しました！</p>`;
            wikiContentEl.innerHTML = resultMessage;
            await saveScore(currentStartPage, currentGoalPage, clickCount, finalTime);
            await displayThemeRanking(currentStartPage, currentGoalPage);
            return;
        }

        pauseTimer();
        loadingOverlay.style.display = 'flex';
        const isMobile = window.innerWidth <= 768;
        let htmlContent = '';
        try {
            if (isMobile) {
                const mobileApiUrl = `https://ja.wikipedia.org/api/rest_v1/page/mobile-html/${encodeURIComponent(pageTitle)}`;
                const response = await fetch(mobileApiUrl, { headers: { 'Accept': 'text/html' } });
                if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.title || `記事の読み込みに失敗`); }
                htmlContent = await response.text();
            } else {
                const desktopApiUrl = `https://ja.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&format=json&prop=text&origin=*&redirects=1`;
                const response = await fetch(desktopApiUrl);
                const data = await response.json();
                if (data.parse && data.parse.text) {
                    htmlContent = data.parse.text['*'];
                    if (data.parse.title !== currentPage) { currentPage = data.parse.title; currentPageEl.textContent = currentPage; }
                } else { throw new Error(data.error?.info || `記事の読み込みに失敗`); }
            }
            
            wikiContentEl.innerHTML = DOMPurify.sanitize(htmlContent);
            if (isGameRunning && currentPage === currentGoalPage) { loadArticle(currentPage); }
        } catch (error) {
            isGameRunning = false;
            wikiContentEl.innerHTML = `<p>エラー: ${error.message}</p>`;
        } finally {
            loadingOverlay.style.display = 'none';
            if (isGameRunning) { startTimer(); }
        }
    }

    async function displayThemeRanking(start, goal) {
        if (!rankingContainer || !rankingListEl) return;
        rankingListEl.innerHTML = '<li>ランキングを読み込み中...</li>';
        rankingContainer.style.display = 'block';
        try {
            const apiUrl = `api.php?action=get_theme_ranking&start=${encodeURIComponent(start)}&goal=${encodeURIComponent(goal)}`;
            const response = await fetch(apiUrl);
            const rankingData = await response.json();
            rankingListEl.innerHTML = '';
            if (rankingData.length === 0) {
                rankingListEl.innerHTML = '<li>まだ誰もこのお題をクリアしていません。一番乗りを目指そう！</li>';
                return;
            }
            rankingData.forEach((rank, index) => {
                const li = document.createElement('li');
                const timeText = rank.time_seconds !== null ? `${rank.time_seconds}秒` : '記録なし';
                li.innerHTML = `<strong>${index + 1}位:</strong> ${rank.username}さん (${rank.click_count}クリック, ${timeText})`;
                rankingListEl.appendChild(li);
            });
        } catch (error) {
            console.error("テーマ別ランキングの取得に失敗:", error);
            rankingListEl.innerHTML = '<li>ランキングの読み込みに失敗しました。</li>';
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

    async function saveScore(start, goal, clicks, time) {
        if (!currentUser) return;
        try {
            const response = await fetch('api.php?action=save_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start, goal, clicks, time })
            });
            const result = await response.json();
            if (result.success) { console.log('記録を保存しました。'); }
        } catch (error) {
            console.error('記録の保存に失敗:', error);
        }
    }

    // 初期化関数
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
    
    // イベントリスナーを設定
    populateSelectors();
    startButton.addEventListener('click', startGame);
    randomButton.addEventListener('click', setRandomTheme);
    wikiContentEl.addEventListener('click', handleWikiLinkClick);
});