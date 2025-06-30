<?php
require 'conexion.php';
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $stmt = $pdo->prepare("SELECT id, password_hash, username, nombre, apellidos, email, nacionalidad FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user && password_verify($password, $user['password_hash'])) {
        session_start();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        echo json_encode([
            'success' => true,
            'userData' => [
                'username' => $user['username'],
                'nombre' => $user['nombre'],
                'apellidos' => $user['apellidos'],
                'email' => $user['email'],
                'nacionalidad' => $user['nacionalidad']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Correo o contraseña incorrectos']);
    }
    exit;
}

if ($action === 'registro') {
    $username = $_POST['username'] ?? '';
    $nombre = $_POST['nombre'] ?? '';
    $apellidos = $_POST['apellidos'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $nacionalidad = $_POST['nacionalidad'] ?? '';
    if (!$username || !$nombre || !$apellidos || !$email || !$password) {
        echo json_encode(['success' => false, 'error' => 'Todos los campos son obligatorios']);
        exit;
    }
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'El correo ya está registrado']);
        exit;
    }
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO usuarios (username, nombre, apellidos, email, password_hash, nacionalidad, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $ok = $stmt->execute([$username, $nombre, $apellidos, $email, $password_hash, $nacionalidad]);
    echo json_encode(['success' => $ok]);
    exit;
}

// Agregar endpoint para logout
if ($action === 'logout') {
    session_start();
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Acción no válida']);
?>