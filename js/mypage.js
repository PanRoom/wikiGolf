// ========== mypage.js (ユーザー情報ページ専用: mypage.html) ==========

document.addEventListener('DOMContentLoaded', async () => {
    const myScoresTable = document.getElementById('my-scores-table');
    
    // マイページのテーブルが存在するページでのみ実行
    if (myScoresTable) {
        // main.jsによるログインチェックが完了するのを少し待つ
        await sleep(100); 

        // ログインしていない場合はトップページにリダイレクト
        if (!currentUser) {
            alert('このページを表示するにはログインが必要です。');
            window.location.href = 'index.html';
            return;
        }
        
        // ユーザー名を表示
        const usernameEl = document.getElementById('mypage-username');
        if (usernameEl) {
            usernameEl.textContent = currentUser.username;
        }

        // 自分のスコアを取得して表示
        fetchMyScores(myScoresTable);
    }
});

async function fetchMyScores(myScoresTable) {
    const tableBody = myScoresTable.querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="4">記録を読み込んでいます...</td></tr>';

    try {
        const response = await fetch('api.php?action=get_my_scores');
        const scores = await response.json();
        
        tableBody.innerHTML = ''; // 一旦空にする
        if (!response.ok || !Array.isArray(scores)) {
            throw new Error('スコアデータの形式が正しくありません。');
        }

        if (scores.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">まだプレイ記録がありません。</td></tr>';
            return;
        }

        scores.forEach(score => {
            const row = tableBody.insertRow();
            const date = new Date(score.play_date).toLocaleString('ja-JP');
            row.innerHTML = `
                <td>${date}</td>
                <td>${escapeHTML(score.start_page)}</td>
                <td>${escapeHTML(score.goal_page)}</td>
                <td>${escapeHTML(score.click_count)}</td>
            `;
        });
    } catch (error) {
        console.error('記録の取得に失敗:', error);
        tableBody.innerHTML = '<tr><td colspan="4">記録の取得に失敗しました。</td></tr>';
    }
}

// HTMLエスケープ用の補助関数
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 処理を少し待つための補助関数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}