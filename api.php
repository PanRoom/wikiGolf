<?php
// api.php

// エラーレポートの設定（本番環境では0にすることを推奨）
ini_set('display_errors', 0);
error_reporting(E_ALL);

// セッションを開始し、ヘッダーをJSONに設定
session_start();
header('Content-Type: application/json; charset=utf-8');

// 保護されたディレクトリからデータベース接続ファイルを読み込む
require_once 'includes/db_connect.php';

// URLのactionパラメータで処理を決定
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'register':
            handle_register($pdo);
            break;
        case 'login':
            handle_login($pdo);
            break;
        case 'logout':
            handle_logout();
            break;
        case 'check_session':
            handle_check_session();
            break;
        case 'save_score':
            handle_save_score($pdo);
            break;
        case 'get_ranking':
            handle_get_ranking($pdo);
            break;
        case 'get_my_scores':
            handle_get_my_scores($pdo);
            break;
        case 'get_theme_ranking':
            handle_get_theme_ranking($pdo);
            break;
        default:
            throw new Exception('無効なアクションです。');
    }
} catch (Exception $e) {
    // エラーが発生した場合は400エラーとエラーメッセージを返す
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

/** ユーザー登録処理 */
function handle_register($pdo) {
    $data = json_decode(file_get_contents('php://input'));
    if (!$data || !isset($data->username) || !isset($data->password)) {
        throw new Exception('入力情報が不十分です。');
    }
    $hashed_password = password_hash($data->password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$data->username]);
    if ($stmt->fetch()) {
        throw new Exception('そのユーザー名は既に使用されています。');
    }
    $stmt = $pdo->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    $stmt->execute([$data->username, $hashed_password]);
    echo json_encode(['success' => true, 'message' => 'ユーザー登録が完了しました。']);
}

/** ログイン処理 */
function handle_login($pdo) {
    $data = json_decode(file_get_contents('php://input'));
    if (!$data || !isset($data->username) || !isset($data->password)) {
        throw new Exception('入力情報が不十分です。');
    }
    $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE username = ?");
    $stmt->execute([$data->username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user && password_verify($data->password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        echo json_encode(['success' => true, 'user' => ['id' => $user['id'], 'username' => $user['username']]]);
    } else {
        throw new Exception('ユーザー名またはパスワードが正しくありません。');
    }
}

/** ログアウト処理 */
function handle_logout() {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
    }
    session_destroy();
    echo json_encode(['success' => true]);
}

/** ログイン状態確認 */
function handle_check_session() {
    if (isset($_SESSION['user_id']) && isset($_SESSION['username'])) {
        echo json_encode(['loggedIn' => true, 'user' => ['id' => $_SESSION['user_id'], 'username' => $_SESSION['username']]]);
    } else {
        echo json_encode(['loggedIn' => false]);
    }
}

/** スコア保存処理（タイム記録対応版） */
function handle_save_score($pdo) {
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('ログインしていません。');
    }
    $data = json_decode(file_get_contents('php://input'));
    if (!$data || !isset($data->start) || !isset($data->goal) || !isset($data->clicks) || !isset($data->time)) {
        throw new Exception('スコア情報が不十分です。');
    }

    $sql = "INSERT INTO scores (user_id, start_page, goal_page, click_count, time_seconds) VALUES (?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $_SESSION['user_id'], 
        $data->start, 
        $data->goal, 
        $data->clicks,
        $data->time
    ]);

    echo json_encode(['success' => true]);
}

/** 全体ランキング取得処理 */
function handle_get_ranking($pdo) {
    // タイムもランキングの基準に含める
    $stmt = $pdo->query("SELECT u.username, s.start_page, s.goal_page, s.click_count, s.time_seconds FROM scores s JOIN users u ON s.user_id = u.id ORDER BY s.click_count ASC, s.time_seconds ASC, s.play_date ASC LIMIT 10");
    $ranking = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($ranking);
}

/** 自分のスコア取得処理 */
function handle_get_my_scores($pdo) {
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('ログインしていません。');
    }
    $stmt = $pdo->prepare("SELECT start_page, goal_page, click_count, time_seconds, play_date FROM scores WHERE user_id = ? ORDER BY play_date DESC");
    $stmt->execute([$_SESSION['user_id']]);
    $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($scores);
}

/** 特定テーマのランキングを取得する処理 */
function handle_get_theme_ranking($pdo) {
    $start_page = $_GET['start'] ?? '';
    $goal_page = $_GET['goal'] ?? '';

    if (empty($start_page) || empty($goal_page)) {
        throw new Exception('スタートまたはゴールの指定がありません。');
    }

    $sql = "
        SELECT u.username, s.click_count, s.time_seconds 
        FROM scores s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.start_page = ? AND s.goal_page = ? 
        ORDER BY s.click_count ASC, s.time_seconds ASC, s.play_date ASC 
        LIMIT 5
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$start_page, $goal_page]);
    $ranking = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($ranking);
}