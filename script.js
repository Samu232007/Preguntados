// Configuración del juego
const categorias = {
    trivia: [
        { id: 1, nombre: 'Historia', color: '#F7B32B', icono: '🏛️' },         // dorado suave
        { id: 2, nombre: 'Deporte', color: '#FF6B6B', icono: '⚽' },           // rojo coral
        { id: 3, nombre: 'Ciencia', color: '#43BCCD', icono: '🔬' },           // turquesa
        { id: 4, nombre: 'Tecnología', color: '#4F8EF7', icono: '💻' },        // azul vibrante
        { id: 5, nombre: 'Geografía', color: '#5DD39E', icono: '🌍' },         // verde menta
        { id: 6, nombre: 'Entretenimiento', color: '#db5a90', icono: '🎬' }    // morado vibrante
    ],
    redes: [
        { id: 7, nombre: 'Programación', color: '#7D5FFF', icono: '👨🏻‍💻' },      // violeta
        { id: 8, nombre: 'Ciberseguridad', color: '#00B894', icono: '🔒' },    // verde esmeralda
        { id: 9, nombre: 'Cloud Computing', color: '#00B8D9', icono: '☁️' },  // azul cielo
        { id: 10, nombre: 'Ciencias de la Computación', color: '#6C5CE7', icono: '🖥️' }, // violeta oscuro
        { id: 11, nombre: 'Bases de Datos', color: '#FDCB6E', icono: '🗄️' },  // amarillo pastel
        { id: 12, nombre: 'Redes', color: '#00CEC9', icono: '🌐' },            // verde agua
        { id: 13, nombre: 'Inteligencia Artificial', color: '#FF7675', icono: '🤖' } // rosa coral 
    ]
};



// Estado del juego
let juegoActual = {
    modo: null,
    insignias: {},
    aciertosDesafio: 0,
    preguntaActual: null,
    categoriaActual: null,
    timer: null,
    tiempoRestante: 20,
    racha: 0,
    preguntasUsadas: new Set(),
    categoriasDisponibles: []
};

juegoActual.progresoInsignias = {}; // { [nombreCategoria]: cantidadCorrectas }

// URL base del backend PHP
const API_BASE_URL = 'backend.php';

// Funciones de API
async function testearConexion() {
    try {
        const response = await fetch(`${API_BASE_URL}?endpoint=test`);
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error testeando conexión:', error);
        return false;
    }
}


// Al inicio del archivo, después de las variables globales
let userData = null;

// Función para actualizar la UI según el estado de la sesión
function actualizarUISegunSesion() {
    const userProfile = document.getElementById('userDropdown');
    const loginButton = document.querySelector('.login-btn');
    
    if (userData) {
        document.getElementById('usernameDisplay').textContent = userData.username || '';
        document.getElementById('userFullName').textContent = `${userData.nombre || ''} ${userData.apellidos || ''}`;
        document.getElementById('userEmail').textContent = userData.email || '';
        document.getElementById('userNationality').textContent = userData.nacionalidad || '';
        
        if (loginButton) loginButton.style.display = 'none';
        if (userProfile) userProfile.style.display = 'flex';
    } else {
        if (loginButton) loginButton.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
    }
}

// Toggle del dropdown
document.querySelector('.user-dropdown')?.addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('userMenu').classList.toggle('show-dropdown');
});

// Cerrar dropdown al hacer click fuera
document.addEventListener('click', function(e) {
    document.getElementById('userMenu')?.classList.remove('show-dropdown');
});

// Función para cerrar sesión
async function cerrarSesion() {
    try {
        const res = await fetch('login.php?action=logout', {
            method: 'POST'
        });
        const data = await res.json();
        if (data.success) {
            userData = null;
            actualizarUISegunSesion();
            location.reload();
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Agregar el toggle del dropdown
document.getElementById('userDropdown')?.addEventListener('click', function() {
    document.getElementById('userMenu').classList.toggle('show-dropdown');
});

// Cerrar dropdown al hacer click fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-profile')) {
        document.getElementById('userMenu')?.classList.remove('show-dropdown');
    }
});

// Modificar tu función de login exitoso para guardar los datos del usuario
// Dentro de tu código de login donde manejas la respuesta exitosa:


async function obtenerCategorias() {
    try {
        const response = await fetch(`${API_BASE_URL}?endpoint=categorias`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        // Fallback a categorías locales si falla la API
        return categorias;
    }
}

async function obtenerPregunta(categoriaId, preguntasUsadas = []) {
    try {
        const preguntasUsadasStr = preguntasUsadas.join(',');
        const url = `${API_BASE_URL}?endpoint=pregunta&categoria_id=${categoriaId}&preguntas_usadas=${preguntasUsadasStr}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data;
    } catch (error) {
        console.error('Error obteniendo pregunta:', error);
        throw error;
    }
}

// Funciones principales del juego
function irALogin() {
    cambiarPantalla('pantalla-login');
    mostrarLogin();
}

function mostrarRegistro() {
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.registro-container').style.display = 'block';
    document.getElementById('login-error').textContent = '';
}
function mostrarLogin() {
    document.querySelector('.login-container').style.display = 'block';
    document.querySelector('.registro-container').style.display = 'none';
    document.getElementById('registro-error').textContent = '';
}

// Enviar login por AJAX
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const res = await fetch('login.php?action=login', {
                    method: 'POST',
                    body: new URLSearchParams({email, password})
                });
                const text = await res.text();
                console.log('Respuesta login.php:', text);
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    document.getElementById('login-error').textContent = 'Respuesta inválida del servidor';
                    return;
                }

                if (data.success) {
                    userData = data.userData;
                    localStorage.setItem('userData', JSON.stringify(userData));
                    actualizarUISegunSesion();
                    cambiarPantalla('menu-principal');
                } else {
                    document.getElementById('login-error').textContent = data.error || 'Error al iniciar sesión';
                }
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('login-error').textContent = 'Error al conectar con el servidor';
            }
            const res = await fetch('login.php?action=login', {
                method: 'POST',
                body: new URLSearchParams({email, password})
            });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                document.getElementById('login-error').textContent = 'Respuesta inválida del servidor';
                return;
            }
        };
    }

    const inputPais = document.getElementById('reg-nacionalidad');
    const listaPaises = document.getElementById('paises-lista');
    
    if (inputPais && listaPaises) {
        // Cuando el usuario escribe
        inputPais.addEventListener('input', function() {
            const valor = this.value.toLowerCase();
            listaPaises.innerHTML = '';
            
            if (valor.length === 0) {
                listaPaises.style.display = 'none';
                return;
            }

            // Filtrar países
            const filtrados = paises.filter(pais => 
                pais.nombre.toLowerCase().includes(valor)
            );

            // Mostrar resultados
            if (filtrados.length > 0) {
                filtrados.forEach(pais => {
                    const div = document.createElement('div');
                    div.className = 'pais-opcion';
                    const emoji = codigoPaisAEmoji(pais.codigo);
                    div.innerHTML = `${emoji} ${pais.nombre}`;
                    
                    div.addEventListener('click', () => {
                        inputPais.value = `${emoji} ${pais.nombre}`;
                        listaPaises.style.display = 'none';
                    });
                    
                    listaPaises.appendChild(div);
                });
                listaPaises.style.display = 'block';
            } else {
                listaPaises.style.display = 'none';
            }
        });

        // Cerrar la lista cuando se hace clic fuera
        document.addEventListener('click', function(e) {
            if (!inputPais.contains(e.target) && !listaPaises.contains(e.target)) {
                listaPaises.style.display = 'none';
            }
        });

        // Mostrar la lista cuando se hace foco en el input
        inputPais.addEventListener('focus', function() {
            if (this.value.length > 0) {
                this.dispatchEvent(new Event('input'));
            }
        });
    }

    // Enviar registro por AJAX
    const regForm = document.getElementById('registro-form');
    if (regForm) {
        regForm.onsubmit = async function(e) {
            e.preventDefault();
            const nacionalidadInput = document.getElementById('reg-nacionalidad').value.trim();
            const nacionalidadEmoji = nacionalidadInput.match(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g)?.[0] || nacionalidadInput;

            const datos = {
                username: document.getElementById('reg-username').value,
                nombre: document.getElementById('reg-nombre').value,
                apellidos: document.getElementById('reg-apellidos').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value,
                nacionalidad: nacionalidadEmoji
            };
            const res = await fetch('login.php?action=registro', {
                method: 'POST',
                body: new URLSearchParams(datos)
            });
            const data = await res.json();
            if (data.success) {
                mostrarLogin();
                document.getElementById('login-error').textContent = '¡Cuenta creada! Ahora inicia sesión.';
            } else {
                document.getElementById('registro-error').textContent = data.error || 'Error al crear cuenta';
            }
        };
    }
});

// Lista de países con nombre y código ISO 3166-1 alpha-2
const paises = [
  { nombre: "Afganistán", codigo: "AF" },
  { nombre: "Albania", codigo: "AL" },
  { nombre: "Alemania", codigo: "DE" },
  { nombre: "Andorra", codigo: "AD" },
  { nombre: "Angola", codigo: "AO" },
  { nombre: "Anguila", codigo: "AI" },
  { nombre: "Antigua y Barbuda", codigo: "AG" },
  { nombre: "Antártida", codigo: "AQ" },
  { nombre: "Arabia Saudí", codigo: "SA" },
  { nombre: "Argelia", codigo: "DZ" },
  { nombre: "Argentina", codigo: "AR" },
  { nombre: "Armenia", codigo: "AM" },
  { nombre: "Aruba", codigo: "AW" },
  { nombre: "Australia", codigo: "AU" },
  { nombre: "Austria", codigo: "AT" },
  { nombre: "Azerbaiyán", codigo: "AZ" },
  { nombre: "Bahamas", codigo: "BS" },
  { nombre: "Baréin", codigo: "BH" },
  { nombre: "Bangladés", codigo: "BD" },
  { nombre: "Barbados", codigo: "BB" },
  { nombre: "Bélgica", codigo: "BE" },
  { nombre: "Belice", codigo: "BZ" },
  { nombre: "Benín", codigo: "BJ" },
  { nombre: "Bermudas", codigo: "BM" },
  { nombre: "Bhután", codigo: "BT" },
  { nombre: "Bolivia", codigo: "BO" },
  { nombre: "Bosnia y Herzegovina", codigo: "BA" },
  { nombre: "Botsuana", codigo: "BW" },
  { nombre: "Brasil", codigo: "BR" },
  { nombre: "Brunéi", codigo: "BN" },
  { nombre: "Bulgaria", codigo: "BG" },
  { nombre: "Burkina Faso", codigo: "BF" },
  { nombre: "Burundi", codigo: "BI" },
  { nombre: "Cabo Verde", codigo: "CV" },
  { nombre: "Camboya", codigo: "KH" },
  { nombre: "Camerún", codigo: "CM" },
  { nombre: "Canadá", codigo: "CA" },
  { nombre: "Catar", codigo: "QA" },
  { nombre: "Chad", codigo: "TD" },
  { nombre: "Chile", codigo: "CL" },
  { nombre: "China", codigo: "CN" },
  { nombre: "Chipre", codigo: "CY" },
  { nombre: "Ciudad del Vaticano", codigo: "VA" },
  { nombre: "Colombia", codigo: "CO" },
  { nombre: "Comoras", codigo: "KM" },
  { nombre: "Congo", codigo: "CG" },
  { nombre: "Corea del Norte", codigo: "KP" },
  { nombre: "Corea del Sur", codigo: "KR" },
  { nombre: "Costa de Marfil", codigo: "CI" },
  { nombre: "Costa Rica", codigo: "CR" },
  { nombre: "Croacia", codigo: "HR" },
  { nombre: "Cuba", codigo: "CU" },
  { nombre: "Dinamarca", codigo: "DK" },
  { nombre: "Dominica", codigo: "DM" },
  { nombre: "Ecuador", codigo: "EC" },
  { nombre: "Egipto", codigo: "EG" },
  { nombre: "El Salvador", codigo: "SV" },
  { nombre: "Emiratos Árabes Unidos", codigo: "AE" },
  { nombre: "Eritrea", codigo: "ER" },
  { nombre: "Eslovaquia", codigo: "SK" },
  { nombre: "Eslovenia", codigo: "SI" },
  { nombre: "España", codigo: "ES" },
  { nombre: "Estados Unidos", codigo: "US" },
  { nombre: "Estonia", codigo: "EE" },
  { nombre: "Esuatini", codigo: "SZ" },
  { nombre: "Etiopía", codigo: "ET" },
  { nombre: "Filipinas", codigo: "PH" },
  { nombre: "Finlandia", codigo: "FI" },
  { nombre: "Fiyi", codigo: "FJ" },
  { nombre: "Francia", codigo: "FR" },
  { nombre: "Gabón", codigo: "GA" },
  { nombre: "Gambia", codigo: "GM" },
  { nombre: "Georgia", codigo: "GE" },
  { nombre: "Ghana", codigo: "GH" },
  { nombre: "Gibraltar", codigo: "GI" },
  { nombre: "Granada", codigo: "GD" },
  { nombre: "Grecia", codigo: "GR" },
  { nombre: "Groenlandia", codigo: "GL" },
  { nombre: "Guadalupe", codigo: "GP" },
  { nombre: "Guam", codigo: "GU" },
  { nombre: "Guatemala", codigo: "GT" },
  { nombre: "Guayana", codigo: "GY" },
  { nombre: "Guinea", codigo: "GN" },
  { nombre: "Guinea Ecuatorial", codigo: "GQ" },
  { nombre: "Guinea-Bisáu", codigo: "GW" },
  { nombre: "Guyana Francesa", codigo: "GF" },
  { nombre: "Haití", codigo: "HT" },
  { nombre: "Honduras", codigo: "HN" },
  { nombre: "Hong Kong", codigo: "HK" },
  { nombre: "Hungría", codigo: "HU" },
  { nombre: "India", codigo: "IN" },
  { nombre: "Indonesia", codigo: "ID" },
  { nombre: "Irak", codigo: "IQ" },
  { nombre: "Irán", codigo: "IR" },
  { nombre: "Irlanda", codigo: "IE" },
  { nombre: "Islandia", codigo: "IS" },
  { nombre: "Islas Caimán", codigo: "KY" },
  { nombre: "Islas Cook", codigo: "CK" },
  { nombre: "Islas Faroe", codigo: "FO" },
  { nombre: "Islas Malvinas", codigo: "FK" },
  { nombre: "Islas Salomón", codigo: "SB" },
  { nombre: "Islas Vírgenes Británicas", codigo: "VG" },
  { nombre: "Islas Vírgenes de EE. UU.", codigo: "VI" },
  { nombre: "Israel", codigo: "IL" },
  { nombre: "Italia", codigo: "IT" },
  { nombre: "Jamaica", codigo: "JM" },
  { nombre: "Japón", codigo: "JP" },
  { nombre: "Jordania", codigo: "JO" },
  { nombre: "Kazajistán", codigo: "KZ" },
  { nombre: "Kenia", codigo: "KE" },
  { nombre: "Kirguistán", codigo: "KG" },
  { nombre: "Kiribati", codigo: "KI" },
  { nombre: "Kuwait", codigo: "KW" },
  { nombre: "Laos", codigo: "LA" },
  { nombre: "Lesoto", codigo: "LS" },
  { nombre: "Letonia", codigo: "LV" },
  { nombre: "Líbano", codigo: "LB" },
  { nombre: "Liberia", codigo: "LR" },
  { nombre: "Libia", codigo: "LY" },
  { nombre: "Liechtenstein", codigo: "LI" },
  { nombre: "Lituania", codigo: "LT" },
  { nombre: "Luxemburgo", codigo: "LU" },
  { nombre: "Macau", codigo: "MO" },
  { nombre: "Macedonia del Norte", codigo: "MK" },
  { nombre: "Madagascar", codigo: "MG" },
  { nombre: "Malasia", codigo: "MY" },
  { nombre: "Malaui", codigo: "MW" },
  { nombre: "Maldivas", codigo: "MV" },
  { nombre: "Malí", codigo: "ML" },
  { nombre: "Malta", codigo: "MT" },
  { nombre: "Marruecos", codigo: "MA" },
  { nombre: "Martinica", codigo: "MQ" },
  { nombre: "Mauricio", codigo: "MU" },
  { nombre: "Mauritania", codigo: "MR" },
  { nombre: "Mayotte", codigo: "YT" },
  { nombre: "México", codigo: "MX" },
  { nombre: "Micronesia", codigo: "FM" },
  { nombre: "Moldavia", codigo: "MD" },
  { nombre: "Mónaco", codigo: "MC" },
  { nombre: "Mongolia", codigo: "MN" },
  { nombre: "Montserrat", codigo: "MS" },
  { nombre: "Mozambique", codigo: "MZ" },
  { nombre: "Myanmar", codigo: "MM" },
  { nombre: "Namibia", codigo: "NA" },
  { nombre: "Nauru", codigo: "NR" },
  { nombre: "Nepal", codigo: "NP" },
  { nombre: "Nicaragua", codigo: "NI" },
  { nombre: "Níger", codigo: "NE" },
  { nombre: "Nigeria", codigo: "NG" },
  { nombre: "Noruega", codigo: "NO" },
  { nombre: "Nueva Caledonia", codigo: "NC" },
  { nombre: "Nueva Zelanda", codigo: "NZ" },
  { nombre: "Omán", codigo: "OM" },
  { nombre: "Países Bajos", codigo: "NL" },
  { nombre: "Pakistán", codigo: "PK" },
  { nombre: "Palaos", codigo: "PW" },
  { nombre: "Panamá", codigo: "PA" },
  { nombre: "Papúa Nueva Guinea", codigo: "PG" },
  { nombre: "Paraguay", codigo: "PY" },
  { nombre: "Perú", codigo: "PE" },
  { nombre: "Polonia", codigo: "PL" },
  { nombre: "Portugal", codigo: "PT" },
  { nombre: "Puerto Rico", codigo: "PR" },
  { nombre: "Reino Unido", codigo: "GB" },
  { nombre: "República Centroafricana", codigo: "CF" },
  { nombre: "República Checa", codigo: "CZ" },
  { nombre: "República del Congo", codigo: "CG" },
  { nombre: "República Democrática del Congo", codigo: "CD" },
  { nombre: "República Dominicana", codigo: "DO" },
  { nombre: "Reunión", codigo: "RE" },
  { nombre: "Ruanda", codigo: "RW" },
  { nombre: "Rumania", codigo: "RO" },
  { nombre: "Rusia", codigo: "RU" },
  { nombre: "Samoa", codigo: "WS" },
  { nombre: "San Bartolomé", codigo: "BL" },
  { nombre: "San Cristóbal y Nieves", codigo: "KN" },
  { nombre: "San Marino", codigo: "SM" },
  { nombre: "San Martín", codigo: "MF" },
  { nombre: "San Pedro y Miquelón", codigo: "PM" },
  { nombre: "Santa Lucía", codigo: "LC" },
  { nombre: "Santa Sede", codigo: "VA" },
  { nombre: "San Vicente y las Granadinas", codigo: "VC" },
  { nombre: "Santo Tomé y Príncipe", codigo: "ST" },
  { nombre: "Senegal", codigo: "SN" },
  { nombre: "Serbia", codigo: "RS" },
  { nombre: "Seychelles", codigo: "SC" },
  { nombre: "Sierra Leona", codigo: "SL" },
  { nombre: "Singapur", codigo: "SG" },
  { nombre: "Sint Maarten", codigo: "SX" },
  { nombre: "Siria", codigo: "SY" },
  { nombre: "Somalia", codigo: "SO" },
  { nombre: "Sri Lanka", codigo: "LK" },
  { nombre: "Suazilandia", codigo: "SZ" },
  { nombre: "Sudáfrica", codigo: "ZA" },
  { nombre: "Sudán", codigo: "SD" },
  { nombre: "Sudán del Sur", codigo: "SS" },
  { nombre: "Suecia", codigo: "SE" },
  { nombre: "Suiza", codigo: "CH" },
  { nombre: "Surinam", codigo: "SR" },
  { nombre: "Tailandia", codigo: "TH" },
  { nombre: "Taiwán", codigo: "TW" },
  { nombre: "Tanzania", codigo: "TZ" },
  { nombre: "Tayikistán", codigo: "TJ" },
  { nombre: "Territorios Británicos del Océano Índico", codigo: "IO" },
  { nombre: "Territorios Franceses del Sur", codigo: "TF" },
  { nombre: "Timor Oriental", codigo: "TL" },
  { nombre: "Togo", codigo: "TG" },
  { nombre: "Tonga", codigo: "TO" },
  { nombre: "Trinidad y Tobago", codigo: "TT" },
  { nombre: "Tristán de Acuña", codigo: "TA" },
  { nombre: "Túnez", codigo: "TN" },
  { nombre: "Turkmenistán", codigo: "TM" },
  { nombre: "Turquía", codigo: "TR" },
  { nombre: "Tuvalu", codigo: "TV" },
  { nombre: "Ucrania", codigo: "UA" },
  { nombre: "Uganda", codigo: "UG" },
  { nombre: "Uruguay", codigo: "UY" },
  { nombre: "Uzbekistán", codigo: "UZ" },
  { nombre: "Vanuatu", codigo: "VU" },
  { nombre: "Venezuela", codigo: "VE" },
  { nombre: "Vietnam", codigo: "VN" },
  { nombre: "Wallis y Futuna", codigo: "WF" },
  { nombre: "Yemen", codigo: "YE" },
  { nombre: "Yibuti", codigo: "DJ" },
  { nombre: "Zambia", codigo: "ZM" },
  { nombre: "Zimbabue", codigo: "ZW" },
];


// Convierte código de país a emoji de bandera
function codigoPaisAEmoji(codigo) {
    const OFFSET = 127397; // Diferencia entre códigos ASCII y Regional Indicators
    return String.fromCodePoint(...[...codigo].map(c => c.charCodeAt(0) + OFFSET));
}




async function iniciarJuego(modo) {
    try {
        juegoActual.modo = modo;
        juegoActual.insignias = {};
        juegoActual.racha = 0;
        juegoActual.preguntasUsadas = new Set();
        
        // Probar conexión con la base de datos
        const conectado = await testearConexion();
        if (!conectado) {
            mostrarError('Error conectando a la base de datos. Usando datos de prueba.');
            // Continuar con datos locales
        }
        
        if (modo === 'desafio') {
            hacerPreguntaDesafio();
            
        } if (modo === 'trivia') {
            await generarRuleta(modo);
            cambiarPantalla('pantalla-ruleta');
            
        }if (modo === 'redes') {
            await generarRuleta(modo);
            cambiarPantalla('pantalla-ruleta');
        }
    } catch (error) {
        console.error('Error iniciando juego:', error);
        mostrarError('Error al iniciar el juego. Intenta de nuevo.');
    }
}

async function generarRuleta(modo) {
    try {
        const todas = categorias[modo] || [];
        const disponibles = todas.filter(cat => !juegoActual.insignias[cat.nombre]);
        juegoActual.categoriasDisponibles = disponibles;

        if (disponibles.length === 0) {
            mostrarModalResultado('¡Felicidades! Has conseguido todas las insignias.', () => cambiarPantalla('menu-principal'));
            return;
        }

        const ruleta = document.getElementById('ruleta');
        ruleta.innerHTML = '';

        // Gradiente y labels para TODAS las categorías
        const anguloPorSector = 360 / todas.length;
        let gradient = '';
        todas.forEach((cat, i) => {
            const start = i * anguloPorSector;
            const end = (i + 1) * anguloPorSector;
            gradient += `${cat.color} ${start}deg ${end}deg${i < todas.length - 1 ? ', ' : ''}`;
        });
        ruleta.style.background = `conic-gradient(${gradient})`;

        // Labels para todas las categorías
        todas.forEach((cat, i) => {
            const label = document.createElement('div');
            label.className = 'ruleta-label';

            const ruletaSize = ruleta.offsetWidth || 300;
            
            const angle = (i + 0.50) * anguloPorSector;
            
            let radius;
            if (window.innerWidth <= 600) {
                radius = ruletaSize * 0.29;
            } else {
                radius = ruletaSize * 0.45;
            }

            let center;
            if (window.innerWidth <= 600) {
                center = ruletaSize / 2.3;
            } else {
                center = ruletaSize / 1.5;
            }
            const rad = (angle - 90) * Math.PI / 180;
            const x = center + radius * Math.cos(rad);
            const y = center + radius * Math.sin(rad);
            label.style.left = `${x}px`;
            label.style.top = `${y}px`;

            // Color más oscuro para el icono
            function darken(hex, amt) {
                let col = hex.replace('#','');
                if (col.length === 3) col = col.split('').map(x=>x+x).join('');
                let num = parseInt(col,16);
                let r = Math.max(0, (num >> 16) - amt);
                let g = Math.max(0, ((num >> 8) & 0x00FF) - amt);
                let b = Math.max(0, (num & 0x0000FF) - amt);
                return `rgb(${r},${g},${b})`;
            }
            const iconColor = darken(cat.color, 20);

            label.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
            label.innerHTML = `<span class="ruleta-emoji" style="
                color:${iconColor};
                opacity:0.85;
                filter: drop-shadow(0 2px 2px rgba(0,0,0,0.10));
                display: block;
            ">${cat.icono}</span>`;

            // Si ya tiene insignia, desactivar visualmente
            if (juegoActual.insignias[cat.nombre]) {
                label.classList.add('ruleta-label-disabled');
            }

            ruleta.appendChild(label);
        });

        // ¡OJO! NO cambies juegoActual.categoriasDisponibles aquí, déjalo solo con las disponibles
        actualizarInsignias();
    } catch (error) {
        console.error('Error generando ruleta:', error);
        mostrarError('Error al cargar las categorías.');
    }
}

function girarRuleta() {
    const btnGirar = document.getElementById('girar-btn');
    const ruleta = document.getElementById('ruleta');
    if (btnGirar.disabled) return;

    btnGirar.disabled = true;
    btnGirar.textContent = 'GIRANDO...';

    const todas = categorias[juegoActual.modo] || [];
    const disponibles = todas.filter(cat => !juegoActual.insignias[cat.nombre]);
    const anguloPorSector = 360 / todas.length;

    // Inicializa la rotación acumulada si no existe
    if (typeof juegoActual.rotacionRuleta !== 'number') {
        juegoActual.rotacionRuleta = 0;
    }

    // Elegir aleatoriamente una categoría disponible
    const categoriaGanadora = disponibles[Math.floor(Math.random() * disponibles.length)];
    // Buscar el índice de esa categoría en el arreglo de TODAS
    const indiceGanador = todas.findIndex(cat => cat.nombre === categoriaGanadora.nombre);

    // Calcula el ángulo para que el indicador apunte a cualquier parte del sector seleccionado
    const anguloSector = (indiceGanador + Math.round((Math.random() * 0.8 + 0.1) * 10) / 10) * anguloPorSector;

    // Calcula la rotación final: varias vueltas + caer en el sector ganador
    const vueltas = 5 + Math.floor(Math.random() * 2); // 5 o 6 vueltas
    const posicionActual = juegoActual.rotacionRuleta % 360;
    const anguloObjetivo = 360 - anguloSector;
    let rotacionNecesaria = anguloObjetivo - posicionActual;
    if (rotacionNecesaria <= 0) rotacionNecesaria += 360;
    const rotacionFinal = juegoActual.rotacionRuleta + (vueltas * 360) + rotacionNecesaria;

    // La rotación debe ser absoluta, no acumulativa, para que el giro sea siempre suave
    
    ruleta.style.transform = `rotate(${rotacionFinal}deg)`;

    // Guarda la rotación para el siguiente giro (acumulativo visual)
    juegoActual.rotacionRuleta = rotacionFinal;

    setTimeout(() => {
        juegoActual.categoriaActual = categoriaGanadora;
        mostrarCategoriaSeleccionada(categoriaGanadora);

        btnGirar.disabled = false;
        btnGirar.textContent = 'GIRAR';
    }, 2500);
}



function mostrarCategoriaSeleccionada(categoria) {
    document.getElementById('categoria-icon-selected').textContent = categoria.icono;
    document.getElementById('categoria-nombre-selected').textContent = categoria.nombre;
    setTimeout(() => {
        cambiarPantalla('pantalla-categoria');
    }, 1000);
}

async function empezarPreguntas() {
    try {
        await hacerPregunta();
    } catch (error) {
        console.error('Error empezando preguntas:', error);
        mostrarError('Error al cargar las preguntas.');
    }
}

async function hacerPregunta() {
    try {
        cambiarPantalla('pantalla-pregunta');
        
        // Mostrar loading
        document.getElementById('loading-pregunta').style.display = 'block';
        document.getElementById('pregunta-texto').textContent = '';

        // Ocultar opciones
        const opciones = ['a', 'b', 'c', 'd'];
        opciones.forEach(opcion => {
            const btn = document.getElementById(`opcion-${opcion}`);
            btn.style.display = 'none';
            btn.disabled = false;
            btn.className = 'opcion-btn';
        });

        // Mostrar categoría actual
        document.getElementById('categoria-actual').textContent = 
            `${juegoActual.categoriaActual.icono} ${juegoActual.categoriaActual.nombre}`;

        // Obtener pregunta de la base de datos usando el ID de la categoría
        const preguntasUsadas = Array.from(juegoActual.preguntasUsadas);
        const categoriaId = juegoActual.categoriaActual.id || 1; // Fallback si no hay ID
        
        const pregunta = await obtenerPregunta(categoriaId, preguntasUsadas);

        juegoActual.preguntaActual = pregunta;
        juegoActual.preguntasUsadas.add(pregunta.id);

        // Ocultar loading y mostrar pregunta SOLO DESPUÉS de obtenerla
        document.getElementById('loading-pregunta').style.display = 'none';
        document.getElementById('pregunta-texto').textContent = pregunta.pregunta;

        // Mezclar opciones antes de mostrarlas
        const opcionesOriginales = [
            { letra: 'a', texto: pregunta.opcion_a },
            { letra: 'b', texto: pregunta.opcion_b },
            { letra: 'c', texto: pregunta.opcion_c },
            { letra: 'd', texto: pregunta.opcion_d }
        ];

        // Algoritmo Fisher-Yates para mezclar
        for (let i = opcionesOriginales.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [opcionesOriginales[i], opcionesOriginales[j]] = [opcionesOriginales[j], opcionesOriginales[i]];
        }

        // Mostrar opciones mezcladas
        opcionesOriginales.forEach((op, idx) => {
            const letra = ['a', 'b', 'c', 'd'][idx];
            const btn = document.getElementById(`opcion-${letra}`);
            btn.textContent = op.texto;
            btn.dataset.respuestaOriginal = op.letra; // Guarda la letra original para validar
            btn.style.display = 'flex';
        });

        // Iniciar timer
        iniciarTimer();

        } catch (error) {
                console.error('Error cargando pregunta:', error);
                mostrarError('Error al cargar la pregunta.');
                // Solo vuelve a la ruleta si NO es desafío
                if (juegoActual.modo !== 'desafio') {
                    setTimeout(() => cambiarPantalla('pantalla-ruleta'), 2000);
                } else {
                    setTimeout(() => cambiarPantalla('menu-principal'), 2000);
                }
        }
}

function iniciarTimer() {
    juegoActual.tiempoRestante = 20;
    actualizarTimer();
    
    juegoActual.timer = setInterval(() => {
        juegoActual.tiempoRestante--;
        actualizarTimer();
        
        if (juegoActual.tiempoRestante <= 0) {
            clearInterval(juegoActual.timer);
            responder(null); // Tiempo agotado
        }
    }, 1000);
}

function actualizarTimer() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = juegoActual.tiempoRestante;
    
    if (juegoActual.tiempoRestante <= 5) {
        timerElement.style.background = '#FF4444';
        timerElement.style.animation = 'pulse 0.5s infinite';
    } else {
        timerElement.style.background = '#4CAF50';
        timerElement.style.animation = 'none';
    }
}

function responder(opcionSeleccionada) {
    if (juegoActual.timer) clearInterval(juegoActual.timer);

    const opciones = ['a', 'b', 'c', 'd'];
    opciones.forEach(opcion => {
        document.getElementById(`opcion-${opcion}`).disabled = true;
    });

    const pregunta = juegoActual.preguntaActual;
    const respuestaCorrecta = obtenerLetraRespuestaCorrecta(pregunta);

    // Buscar cuál botón tiene la respuesta correcta
    let botonCorrecto = null;
    let botonSeleccionado = null;
    opciones.forEach(opcion => {
        const btn = document.getElementById(`opcion-${opcion}`);
        if (btn.dataset.respuestaOriginal === respuestaCorrecta) {
            botonCorrecto = btn;
        }
        if (opcion === opcionSeleccionada) {
            botonSeleccionado = btn;
        }
    });

    // Verifica si la opción seleccionada es la correcta usando el atributo data
    const esCorrecta = botonSeleccionado && botonSeleccionado.dataset.respuestaOriginal === respuestaCorrecta;
    const catNombre = juegoActual.categoriaActual.nombre;

    // Mostrar respuesta correcta e incorrecta
    if (botonCorrecto) {
        botonCorrecto.classList.add('correcta');
    }
    if (botonSeleccionado && !esCorrecta) {
        botonSeleccionado.classList.add('incorrecta');
    }

    // Inicializa progreso si no existe
    if (!juegoActual.progresoInsignias) juegoActual.progresoInsignias = {};
    if (!juegoActual.progresoInsignias[catNombre]) juegoActual.progresoInsignias[catNombre] = 0;

    if (esCorrecta) {
        juegoActual.racha++;
        if (juegoActual.progresoInsignias[catNombre] < 3) {
            juegoActual.progresoInsignias[catNombre]++;
        }
        let acabaDeGanarInsignia = false;
        if (juegoActual.progresoInsignias[catNombre] === 3 && !juegoActual.insignias[catNombre]) {
            juegoActual.insignias[catNombre] = true;
            acabaDeGanarInsignia = true;
        }
        actualizarInsignias();

        // ¿Ya tiene todas las insignias?
        const categoriasDelModo = categorias[juegoActual.modo] || [];
        const todasObtenidas = categoriasDelModo.every(cat => juegoActual.insignias[cat.nombre]);

        setTimeout(() => {
            if (todasObtenidas) {
                if (acabaDeGanarInsignia) {
                    // Muestra primero el modal de insignia, luego la pantalla de victoria
                    mostrarModalResultado(
                        `¡Correcto! Has conseguido la insignia de ${catNombre} 🏅`,
                        () => mostrarMensajeVictoria()
                    );
                } else {
                    // Si ya las tenía todas, muestra solo la pantalla de victoria
                    mostrarMensajeVictoria();
                }
            } else {
                // No tiene todas, flujo normal
                mostrarModalResultado(
                    juegoActual.insignias[catNombre]
                        ? `¡Correcto! Has conseguido la insignia de ${catNombre} 🏅`
                        : `¡Correcto! Progreso en ${catNombre}: ${juegoActual.progresoInsignias[catNombre]}/3`,
                    async () => {
                        generarRuleta(juegoActual.modo);
                        cambiarPantalla('pantalla-ruleta');
                    }
                );
            }
        }, 1000);

    } else {
        juegoActual.racha = 0;
        setTimeout(() => {
            mostrarModalResultado(
                opcionSeleccionada === null
                    ? '¡Tiempo agotado! ¡Inténtalo de nuevo con otra categoría!'
                    : 'Respuesta incorrecta. ¡Inténtalo de nuevo con otra categoría!',
                () => cambiarPantalla('pantalla-ruleta')
            );
        }, 1000);
    }
}

function obtenerLetraRespuestaCorrecta(pregunta) {
    if (pregunta.respuesta_correcta === pregunta.opcion_a) return 'a';
    if (pregunta.respuesta_correcta === pregunta.opcion_b) return 'b';
    if (pregunta.respuesta_correcta === pregunta.opcion_c) return 'c';
    if (pregunta.respuesta_correcta === pregunta.opcion_d) return 'd';
    return null;
}

function actualizarInsignias() {
    const insigniasContainer = document.getElementById('insignias');
    insigniasContainer.innerHTML = '';

    // Mostrar todas las categorías del modo actual
    const categoriasDelModo = categorias[juegoActual.modo] || [];
    categoriasDelModo.forEach(categoria => {
        const nombre = categoria.nombre;
        const progreso = (juegoActual.progresoInsignias && juegoActual.progresoInsignias[nombre]) || 0;
        const tieneInsignia = juegoActual.insignias[nombre];

        let extra = '';
        if (tieneInsignia) {
            extra = ' ✓';
        } else if (progreso > 0) {
            extra = ` (${progreso}/3)`;
        }

        const insigniaElement = document.createElement('div');
        insigniaElement.style.cssText = `
            padding: 10px 15px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 5px;
            font-weight: bold;
            background: ${tieneInsignia ? categoria.color : 'rgba(255,255,255,0.3)'};
            color: white;
            opacity: ${progreso > 0 || tieneInsignia ? 1 : 0.7};
        `;
        insigniaElement.innerHTML = `
            ${categoria.icono} ${nombre}${extra}
        `;
        insigniasContainer.appendChild(insigniaElement);
    });
}

function mostrarMensajeVictoria() {
    document.getElementById('pantalla-pregunta').style.display = 'none';
    document.getElementById('mensaje-victoria').style.display = 'flex';
}

function ocultarMensajeVictoria() {
    document.getElementById('mensaje-victoria').style.display = 'none';
}

function mostrarModalResultado(mensaje, onClose) {
    // Si ya existe, elimínalo primero
    let modal = document.getElementById('modal-resultado');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'modal-resultado';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;
    modal.innerHTML = `
        <div style="
            background: #fff;
            border-radius: 24px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18);
            padding: 38px 36px 28px 36px;
            min-width: 320px;
            max-width: 90vw;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        ">
            <div style="font-size: 1.25rem; font-weight: bold; margin-bottom: 18px;">${mensaje}</div>
            <button id="btn-modal-continuar" style="
                margin-top: 10px;
                padding: 10px 28px;
                background: #43b04a;
                color: #fff;
                font-weight: bold;
                border: none;
                border-radius: 22px;
                font-size: 1.1rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.10);
                cursor: pointer;
                transition: background 0.2s;
            ">Continuar</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-modal-continuar').onclick = () => {
        modal.remove();
        if (typeof onClose === 'function') onClose();
    };
}

async function hacerPreguntaDesafio() {
    try {
        cambiarPantalla('pantalla-pregunta-desafío');

        // Inicializa aciertos si es la primera pregunta
        if (typeof juegoActual.aciertosDesafio !== 'number') juegoActual.aciertosDesafio = 0;

        // Todas las categorías posibles
        const todasLasCategorias = [
            ...categorias.trivia,
            ...categorias.trivia,
            ...categorias.redes
        ];
        actualizarRachaDesafio();

        // Obtener preguntas usadas solo para desafío
        if (!juegoActual.preguntasUsadas) juegoActual.preguntasUsadas = new Set();
        const preguntasUsadas = Array.from(juegoActual.preguntasUsadas);

        // Elegir una categoría aleatoria
        const categoriaAleatoria = todasLasCategorias[Math.floor(Math.random() * todasLasCategorias.length)];
        juegoActual.categoriaActual = categoriaAleatoria;

        // Mostrar icono y nombre arriba
         // Mostrar categoría actual
        document.getElementById('categoria-actual-desafio').textContent = 
            `${juegoActual.categoriaActual.icono} ${juegoActual.categoriaActual.nombre}`;


        // Cargar pregunta de la categoría aleatoria
        const pregunta = await obtenerPregunta(categoriaAleatoria.id, preguntasUsadas);

        juegoActual.preguntaActual = pregunta;
        juegoActual.preguntasUsadas.add(pregunta.id);

        // Mostrar loading y pregunta
        document.getElementById('loading-pregunta-desafio').style.display = 'none';
        document.getElementById('pregunta-texto-desafio').textContent = pregunta.pregunta;      
        
        // Mezclar y mostrar opciones
        const opcionesOriginales = [
            { letra: 'a', texto: pregunta.opcion_a },
            { letra: 'b', texto: pregunta.opcion_b },
            { letra: 'c', texto: pregunta.opcion_c },
            { letra: 'd', texto: pregunta.opcion_d }
        ];
        for (let i = opcionesOriginales.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [opcionesOriginales[i], opcionesOriginales[j]] = [opcionesOriginales[j], opcionesOriginales[i]];
        }
        opcionesOriginales.forEach((op, idx) => {
            const letra = ['a', 'b', 'c', 'd'][idx];
            const btn = document.getElementById(`opcion-${letra}-desafio`);
            btn.textContent = op.texto;
            btn.dataset.respuestaOriginal = op.letra;
            btn.style.display = 'flex';
            btn.disabled = false;
            btn.className = 'opcion-btn';
            btn.onclick = () => responderDesafio(letra);
        });

        // Iniciar timer
        iniciarTimerDesafio();

    } catch (error) {
        console.error('Error en modo desafío:', error);
        mostrarError('Error en el modo desafío. Volviendo al menú principal.');
        setTimeout(() => cambiarPantalla('menu-principal'), 2000);
    }
}

function actualizarRachaDesafio() {
    const racha = juegoActual.aciertosDesafio || 0;
    const rachaDiv = document.getElementById('racha-desafio');
    const numDiv = document.getElementById('racha-numero-desafio');
    if (!rachaDiv || !numDiv) return;
    numDiv.textContent = racha;

    // Quita clases previas
    rachaDiv.classList.remove('racha-fuego-baja', 'racha-fuego-media', 'racha-fuego-alta');

    // Cambia intensidad según la racha
    if (racha >= 50) {
        rachaDiv.classList.add('racha-fuego-supremo');
    } else if (racha >= 45) {
        rachaDiv.classList.add('racha-fuego-dios');
    } else if (racha >= 40) {
        rachaDiv.classList.add('racha-fuego-big');
    } else if (racha >= 35) {
        rachaDiv.classList.add('racha-fuego-extensa');
    } else if (racha >= 30) {
        rachaDiv.classList.add('racha-fuego-prolongada');
    } else if (racha >= 20) {
        rachaDiv.classList.add('racha-fuego-alargada');
    } else if (racha >= 12) {
        rachaDiv.classList.add('racha-fuego-alta');
    } else if (racha >= 5) {
        rachaDiv.classList.add('racha-fuego-media');
    } else if (racha >= 0) {
        rachaDiv.classList.add('racha-fuego-baja');
    }
    
}

function iniciarTimerDesafio() {
    juegoActual.tiempoRestante = 30;
    actualizarTimerDesafio();

    if (juegoActual.timer) clearInterval(juegoActual.timer);
    juegoActual.timer = setInterval(() => {
        juegoActual.tiempoRestante--;
        actualizarTimerDesafio();

        if (juegoActual.tiempoRestante <= 0) {
            clearInterval(juegoActual.timer);
            perderDesafio('¡Tiempo agotado!');
        }
    }, 1000);
}

function actualizarTimerDesafio() {
    const timerElement = document.getElementById('timer-desafio');
    timerElement.textContent = juegoActual.tiempoRestante;
    if (juegoActual.tiempoRestante <= 5) {
        timerElement.style.background = '#FF4444';
        timerElement.style.animation = 'pulse 0.5s infinite';
    } else {
        timerElement.style.background = '#4CAF50';
        timerElement.style.animation = 'none';
    }
}

function responderDesafio(opcionSeleccionada) {
    if (juegoActual.timer) clearInterval(juegoActual.timer);

    const opciones = ['a', 'b', 'c', 'd'];
    opciones.forEach(opcion => {
        document.getElementById(`opcion-${opcion}-desafio`).disabled = true;
    });

    const pregunta = juegoActual.preguntaActual;
    const respuestaCorrecta = obtenerLetraRespuestaCorrecta(pregunta);

    let botonCorrecto = null;
    let botonSeleccionado = null;
    opciones.forEach(opcion => {
        const btn = document.getElementById(`opcion-${opcion}-desafio`);
        if (btn.dataset.respuestaOriginal === respuestaCorrecta) {
            botonCorrecto = btn;
        }
        if (opcion === opcionSeleccionada) {
            botonSeleccionado = btn;
        }
    });

    const esCorrecta = botonSeleccionado && botonSeleccionado.dataset.respuestaOriginal === respuestaCorrecta;

    if (botonCorrecto) botonCorrecto.classList.add('correcta');
    if (botonSeleccionado && !esCorrecta) botonSeleccionado.classList.add('incorrecta');
    

    setTimeout(() => {
        opciones.forEach(opcion => {
            const btn = document.getElementById(`opcion-${opcion}-desafio`);
            btn.classList.remove('correcta', 'incorrecta');
            btn.onclick = null;
        });

        if (esCorrecta) {
            juegoActual.aciertosDesafio++;
            hacerPreguntaDesafio(); // Siguiente pregunta
        } else {
            perderDesafio('Respuesta incorrecta.');
            // Guardar la racha si el usuario está logueado
        }
    }, 1000);
}

function perderDesafio(motivo) {
    cambiarPantalla('pantalla-estadisticas-desafio');
    console.log('userData:', userData, 'racha:', juegoActual.aciertosDesafio);
        // Solo guardar si el usuario está logueado y hay racha
    if (userData && userData.id && juegoActual.aciertosDesafio > 0) {
        fetch('backend.php?endpoint=guardar-racha', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                usuario_id: userData.id,
                racha: juegoActual.aciertosDesafio
            })
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                console.error('Error guardando racha:', data);
                mostrarError('No se pudo guardar la racha');
            }
            mostrarTopRachas();
        })
        .catch(err => {
            console.error('Error en fetch guardar-racha:', err);
            mostrarError('No se pudo guardar la racha');
        });
    } else {
        console.log('no funciona el if');
    }
 
    // Actualiza los datos en la pantalla de estadísticas
    document.getElementById('motivo-fin-desafio').textContent = motivo;
    document.getElementById('aciertos-desafio').textContent = juegoActual.aciertosDesafio || 0;
   
    
}

function cambiarPantalla(nuevaPantalla) {
    // Ocultar todas las pantallas
    const pantallas = document.querySelectorAll('.screen');
    pantallas.forEach(pantalla => {
        pantalla.classList.remove('active');
    });
    
    // Mostrar la pantalla solicitada
    document.getElementById(nuevaPantalla).classList.add('active');
}

function volverMenu() {
    if (juegoActual.timer) {
        clearInterval(juegoActual.timer);
    }

    mostrarModalConfirmacion(
        `<div style="font-size:1.1rem; margin-bottom:10px;">¿Seguro que quieres salir al menú principal?<br><b>¡Perderás el progreso de la partida actual!</b></div>`,
        () => {
            // Borrar progreso y salir
            juegoActual.insignias = {};
            juegoActual.racha = 0;
            juegoActual.preguntasUsadas = new Set();
            juegoActual.categoriasDisponibles = [];
            juegoActual.progresoInsignias = {};
            cambiarPantalla('menu-principal');
        },
        () => {
            // Cancelar: no hacer nada
        }
    );
}

function volverMenuD() {
    juegoActual.aciertosDesafio = 0;
    if (juegoActual.timer) {
        clearInterval(juegoActual.timer);
    }
 cambiarPantalla('menu-principal');
}

function volverMenuW() {
    ocultarMensajeVictoria()
    // Borrar progreso y salir
    juegoActual.insignias = {};
    juegoActual.racha = 0;
    juegoActual.preguntasUsadas = new Set();
    juegoActual.categoriasDisponibles = [];
    juegoActual.progresoInsignias = {};
    cambiarPantalla('menu-principal');
}

function mostrarModalConfirmacion(mensaje, onContinue, onCancel) {
    let modal = document.getElementById('modal-resultado');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'modal-resultado';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;
    modal.innerHTML = `
        <div style="
            background: #fff;
            border-radius: 24px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18);
            padding: 38px 36px 28px 36px;
            min-width: 320px;
            max-width: 90vw;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        ">
            <div style="font-size: 1.25rem; font-weight: bold; margin-bottom: 18px;">${mensaje}</div>
            <div style="display: flex; gap: 16px; justify-content: center;">
                <button id="btn-modal-continuar" style="
                    margin-top: 10px;
                    padding: 10px 28px;
                    background:rgb(197, 38, 38);
                    color: #fff;
                    font-weight: bold;
                    border: none;
                    border-radius: 22px;
                    font-size: 1.1rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.10);
                    cursor: pointer;
                    transition: background 0.2s;
                ">Salir</button>
                <button id="btn-modal-cancelar" style="
                    margin-top: 10px;
                    padding: 10px 28px;
                    background: #43b04a;
                    color: #fff;
                    font-weight: bold;
                    border: none;
                    border-radius: 22px;
                    font-size: 1.1rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.10);
                    cursor: pointer;
                    transition: background 0.2s;
                ">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-modal-continuar').onclick = () => {
        modal.remove();
        if (typeof onContinue === 'function') onContinue();
    };
    document.getElementById('btn-modal-cancelar').onclick = () => {
        modal.remove();
        if (typeof onCancel === 'function') onCancel();
    };
}

function volverRuleta() {
    if (juegoActual.timer) {
        clearInterval(juegoActual.timer);
    }
    cambiarPantalla('pantalla-ruleta');
}

function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #ff4444;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    errorDiv.textContent = mensaje;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (document.body.contains(errorDiv)) {
            document.body.removeChild(errorDiv);
        }
    }, 4000);
}

// CSS adicional para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    .ruleta-label-disabled {
        opacity: 0.3 !important;
        filter: grayscale(0.7);
        pointer-events: none;
    }
    
    .opcion-btn.correcta {
        background: #4CAF50 !important;
        color: white !important;
    }
    
    .opcion-btn.incorrecta {
        background: #f44336 !important;
        color: white !important;
    }
    
    .loading {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

async function mostrarTopRachas() {
    try {
        const res = await fetch('backend.php?endpoint=top-rachas');
        const top = await res.json();
        const cont = document.getElementById('top-rachas');
        if (!cont) return;
        cont.innerHTML = '<h4>🏆 Mejores Rachas</h4>' +
            top.map(r => `
                <div class="top-rachas-item">
                    <span class="top-flag">${r.nacionalidad}</span>
                    <span class="top-user">${r.username}</span>
                    <span class="top-score">${r.racha}</span>
                </div>
            `).join('');
    } catch (e) {
        // Si hay error, no mostrar nada
    }
}
document.addEventListener('DOMContentLoaded', mostrarTopRachas);


// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Preguntados Game iniciado');
    
    // Verificar conexión a la base de datos al cargar
    try {
        const conectado = await testearConexion();
        if (conectado) {
            console.log('✅ Conexión a la base de datos exitosa');
        } else {
            console.log('❌ No se pudo conectar a la base de datos. Usando datos locales.');
            mostrarError('Usando modo offline. Algunas funciones pueden estar limitadas.');
        }
    } catch (error) {
        console.error('Error verificando conexión:', error);
        mostrarError('Error de conexión. Usando modo offline.');
    }
});