
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Configuración de la base de datos
$host = 'localhost';
$username = 'admin';
$password = 'SamuMoraChaves23';
$database = 'preguntados_db';

$pdo = null;

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    // No salir inmediatamente, manejar el error según el endpoint
    error_log('Error de conexión a la base de datos: ' . $e->getMessage());
}

// Obtener el endpoint solicitado
$endpoint = $_GET['endpoint'] ?? '';

switch($endpoint) {
    case 'test':
        testConnection();
        break;
    case 'categorias':
        getCategorias();
        break;
    case 'pregunta':
        getPregunta();
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint no encontrado']);
}

function testConnection() {
    global $pdo;
    
    if ($pdo === null) {
        echo json_encode(['success' => false, 'message' => 'No se pudo conectar a la base de datos']);
        return;
    }
    
    try {
        $stmt = $pdo->query("SELECT 1");
        echo json_encode(['success' => true, 'message' => 'Conexión exitosa']);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error de conexión: ' . $e->getMessage()]);
    }
}

function getCategorias() {
    global $pdo;
    
    if ($pdo === null) {
        // Devolver categorías de ejemplo si no hay conexión
        $categorias_ejemplo = [
            'trivia' => [
                ['id' => 1, 'nombre' => 'Historia', 'color' => '#8B4513', 'icono' => '🏛️'],
                ['id' => 2, 'nombre' => 'Deporte', 'color' => '#FF6B35', 'icono' => '⚽'],
                ['id' => 3, 'nombre' => 'Ciencia', 'color' => '#4ECDC4', 'icono' => '🔬'],
                ['id' => 4, 'nombre' => 'Tecnología', 'color' => '#45B7D1', 'icono' => '💻'],
                ['id' => 5, 'nombre' => 'Geografía', 'color' => '#96CEB4', 'icono' => '🌍'],
                ['id' => 6, 'nombre' => 'Entretenimiento', 'color' => '#FECA57', 'icono' => '🎬']
            ],
            'redes' => [
                ['id' => 7, 'nombre' => 'Programación', 'color' => '#FF6B6B', 'icono' => '💻'],
                ['id' => 8, 'nombre' => 'Ciberseguridad', 'color' => '#4ECDC4', 'icono' => '🔒'],
                ['id' => 9, 'nombre' => 'Cloud Computing', 'color' => '#45B7D1', 'icono' => '☁️'],
                ['id' => 10, 'nombre' => 'Ciencias de la Computación', 'color' => '#96CEB4', 'icono' => '🖥️'],
                ['id' => 11, 'nombre' => 'Bases de Datos', 'color' => '#FECA57', 'icono' => '🗄️'],
                ['id' => 12, 'nombre' => 'Redes', 'color' => '#FF9FF3', 'icono' => '🌐'],
                ['id' => 13, 'nombre' => 'Inteligencia Artificial', 'color' => '#A8E6CF', 'icono' => '🤖']
            ]
        ];
        echo json_encode($categorias_ejemplo);
        return;
    }
    
    try {
        $stmt = $pdo->query("SELECT * FROM categorias ORDER BY nombre");
        $categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Organizar por tipo (trivia, redes, etc.)
        $resultado = [
            'trivia' => [],
            'redes' => []
        ];
        
        foreach($categorias as $categoria) {
            $cat = [
                'id' => (int)$categoria['id'],
                'nombre' => $categoria['nombre'],
                'color' => $categoria['color'],
                'icono' => $categoria['icono']
            ];
            
            // Clasificar categorías por tipo
            $nombreLower = strtolower($categoria['nombre']);
            if (in_array($nombreLower, ['programación', 'ciberseguridad', 'cloud computing', 'ciencias de la computación', 'bases de datos', 'redes', 'inteligencia artificial'])) {
                $resultado['redes'][] = $cat;
            } else {
                $resultado['trivia'][] = $cat;
            }
        }
        
        echo json_encode($resultado);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error obteniendo categorías: ' . $e->getMessage()]);
    }
}

function getPregunta() {
    global $pdo;
    
    $categoria_id = $_GET['categoria_id'] ?? null;
    $preguntas_usadas = $_GET['preguntas_usadas'] ?? '';
    
    if (!$categoria_id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de categoría requerido']);
        return;
    }
    
    if ($pdo === null) {
        // Devolver pregunta de ejemplo si no hay conexión
        $preguntas_ejemplo = [
            [
                'id' => 1,
                'pregunta' => '¿Cuál es la capital de Francia?',
                'opcion_a' => 'Londres',
                'opcion_b' => 'París',
                'opcion_c' => 'Madrid',
                'opcion_d' => 'Roma',
                'respuesta_correcta' => 'París'
            ],
            [
                'id' => 2,
                'pregunta' => '¿Cuál es el lenguaje de programación más usado en 2023?',
                'opcion_a' => 'Python',
                'opcion_b' => 'Java',
                'opcion_c' => 'JavaScript',
                'opcion_d' => 'C++',
                'respuesta_correcta' => 'JavaScript'
            ],
            [
                'id' => 3,
                'pregunta' => '¿Qué significa HTML?',
                'opcion_a' => 'HyperText Markup Language',
                'opcion_b' => 'High Tech Modern Language',
                'opcion_c' => 'Home Tool Markup Language',
                'opcion_d' => 'Hyperlink and Text Markup Language',
                'respuesta_correcta' => 'HyperText Markup Language'
            ]
        ];
        
        // Filtrar preguntas usadas
        $preguntasUsadasArray = array_filter(explode(',', $preguntas_usadas), 'is_numeric');
        $preguntasDisponibles = array_filter($preguntas_ejemplo, function($p) use ($preguntasUsadasArray) {
            return !in_array($p['id'], $preguntasUsadasArray);
        });
        
        if (empty($preguntasDisponibles)) {
            // Si no hay preguntas disponibles, devolver una aleatoria
            $pregunta = $preguntas_ejemplo[array_rand($preguntas_ejemplo)];
        } else {
            $pregunta = $preguntasDisponibles[array_rand($preguntasDisponibles)];
        }
        
        echo json_encode($pregunta);
        return;
    }
    
    try {
        // Construir la consulta con exclusión de preguntas ya usadas
        $sql = "SELECT * FROM preguntas WHERE categoria_id = ?";
        $params = [$categoria_id];

        $ids_usados = [];
        if (!empty($preguntas_usadas)) {
            $ids_usados = array_filter(explode(',', $preguntas_usadas), 'is_numeric');
            if (!empty($ids_usados)) {
                $placeholders = implode(',', array_fill(0, count($ids_usados), '?'));
                $sql .= " AND id NOT IN ($placeholders)";
                $params = array_merge([$categoria_id], $ids_usados);
            }
        }

        $sql .= " ORDER BY RAND() LIMIT 1";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $pregunta = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$pregunta) {
            // Si no hay preguntas disponibles para esta categoría, reiniciar y devolver una aleatoria
            $stmt = $pdo->prepare("SELECT * FROM preguntas WHERE categoria_id = ? ORDER BY RAND() LIMIT 1");
            $stmt->execute([$categoria_id]);
            $pregunta = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$pregunta) {
                http_response_code(404);
                echo json_encode(['error' => 'No hay preguntas disponibles para esta categoría']);
                return;
            }
        }

        // Convertir el ID a entero para consistencia
        $pregunta['id'] = (int)$pregunta['id'];
        $pregunta['categoria_id'] = (int)$pregunta['categoria_id'];

        echo json_encode($pregunta);
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error obteniendo pregunta: ' . $e->getMessage()]);
    }
}


?>
