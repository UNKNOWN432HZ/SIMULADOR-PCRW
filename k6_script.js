// -*- coding: utf-8 -*-
import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de la prueba (SLA y curva de carga)
export const options = {
    stages: [
        { duration: '30s', target: 50 }, // Ramp-up: Subida gradual a 50 usuarios
        { duration: '1m', target: 50 },  // Steady-state: Mantener 50 usuarios
        { duration: '30s', target: 0 },  // Ramp-down: Descenso gradual a 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // El 95% de las peticiones debe ser menor a 500ms
        http_req_failed: ['rate<0.01'],    // Menos del 1% de errores en peticiones
    },
};

// Función principal que simula a cada estudiante
export default function () {
    const baseUrl = 'http://localhost:3000';
    const vuId = __VU; // ID del Usuario Virtual actual
    const iter = __ITER; // Iteración actual
    
    // Paso 1: Login
    const loginPayload = JSON.stringify({
        username: `estudiante_k6_${vuId}_iter_${iter}`,
        password: 'securePassword123'
    });
    
    const params = {
        headers: { 'Content-Type': 'application/json' }
    };
    
    const loginRes = http.post(`${baseUrl}/api/auth/login`, loginPayload, params);
    check(loginRes, {
        'Login exitoso (200)': (r) => r.status === 200,
        'Retorna token de acceso': (r) => r.json().access_token !== undefined
    });
    sleep(1);

    // Paso 2: Consulta de asignaturas
    const coursesRes = http.get(`${baseUrl}/api/matricula/cursos`);
    check(coursesRes, {
        'Carga de cursos exitosa (200)': (r) => r.status === 200,
        'Cursos cargados no nulos': (r) => r.json().length > 0
    });
    sleep(1.5);

    // Paso 3: Guardar Matrícula
    const enrollPayload = JSON.stringify({
        estudiante_id: 2000 + vuId,
        cursos: [101, 102, 105]
    });
    
    const enrollRes = http.post(`${baseUrl}/api/matricula/guardar`, enrollPayload, params);
    check(enrollRes, {
        'Matrícula guardada (201)': (r) => r.status === 201,
        'Retorna código de matrícula': (r) => r.json().codigo_registro !== undefined
    });

    // Simular tiempo de pensamiento del usuario
    sleep(Math.random() * 2 + 1);
}
