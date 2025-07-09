// ========== ranking.js (ランキングページ専用: ranking.html) ==========

document.addEventListener('DOMContentLoaded', () => {
    const rankingListEl = document.getElementById('ranking-list');
    
    // ランキングリストが存在するページでのみ実行
    if (rankingListEl) {
        updateRanking(rankingListEl);
    }
});

async function updateRanking(rankingListEl) {
    rankingListEl.innerHTML = '<li>読み込み中...</li>';
    try {
        const response = await fetch('api.php?action=get_ranking');

        // HTTPステータスが200番台でない場合はエラーとして扱う
        if (!response.ok) {
            throw new Error(`サーバーエラーが発生しました。 Status: ${response.status}`);
        }

        const rankingData = await response.json();

        rankingListEl.innerHTML = ''; // 一旦空にする
        
        // 返ってきたデータが配列でない場合もエラー
        if (!Array.isArray(rankingData)) {
            throw new Error('ランキングデータの形式が正しくありません。');
        }
        
        if (rankingData.length === 0) {
            rankingListEl.innerHTML = '<li>まだランキングに載る記録がありません。</li>';
            return;
        }

        rankingData.forEach(rank => {
            const li = document.createElement('li');
            // データが存在するか念のためチェック
            const username = rank.username || '不明なユーザー';
            const start = rank.start_page || '不明';
            const goal = rank.goal_page || '不明';
            const clicks = rank.click_count || '不明';
            
            li.textContent = `${username} さん: 「${start}」→「${goal}」 (${clicks}クリック)`;
            rankingListEl.appendChild(li);
        });

    } catch (error) {
        // ★コンソールに詳細なエラー内容を表示する
        console.error('ランキングの読み込みに失敗しました:', error);
        rankingListEl.innerHTML = '<li>ランキングの読み込みに失敗しました。管理者にお問い合わせください。</li>';
    }
}