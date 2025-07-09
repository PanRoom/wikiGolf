<?php
// 【重要】あなたのデータベース接続情報に書き換えてください
define('DB_HOST', 'localhost'); // 例: localhost, mysqlXX.your-server.com など
define('DB_USER', 'tetrocky_gm');      // あなたのDBユーザー名
define('DB_PASS', 'web2025games');      // あなたのDBパスワード
define('DB_NAME', 'tetrocky_golf');          // あなたのDB名

try {
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8', DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
} catch (PDOException $e) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['error' => 'データベース接続エラー。設定を確認してください。']);
    exit();
}