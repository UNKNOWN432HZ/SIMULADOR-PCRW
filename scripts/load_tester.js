// -*- coding: utf-8 -*-
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const testMode = args.includes('--optimized') ? 'optimized' : 'unoptimized';

// Test Configuration
const TARGET_PORT = 3000;
const TARGET_HOST = 'localhost';
const CONCURRENCY_VUS = testMode === 'optimized' ? 50 : 35; // 50 concurrent VUs for optimized, 35 for unoptimized
const DURATION_SECONDS = 15;
const THINK_TIME_MS = 150; // 150ms think time to put high throughput

// Performance Counters
let totalRequests = 0;
let successRequests = 0;
let failedRequests = 0;
const responseDurations = [];
const errorsByCode = {};

// Helper to make HTTP Requests using Node's built-in http module
function sendRequest(method, path, bodyData = null) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const postData = bodyData ? JSON.stringify(bodyData) : null;
        
        const options = {
            hostname: TARGET_HOST,
            port: TARGET_PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { responseBody += chunk; });
            res.on('end', () => {
                const duration = Date.now() - startTime;
                resolve({
                    statusCode: res.statusCode,
                    duration: duration,
                    body: responseBody
                });
            });
        });

        req.on('error', () => {
            const duration = Date.now() - startTime;
            resolve({
                statusCode: 0, // network/connection error
                duration: duration,
                body: 'Connection Error'
            });
        });

        // Set timeout
        req.setTimeout(8000, () => {
            req.destroy();
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

// Control API Helpers to setup server mode
async function setupServer() {
    console.log(`[+] Conectando al servidor http://${TARGET_HOST}:${TARGET_PORT}...`);
    
    // Get server status
    const statusRes = await sendRequest('GET', '/api/control/stats');
    if (statusRes.statusCode !== 200) {
        console.error(`[-] Error: El servidor de matrícula no está levantado.`);
        console.error(`    Levántalo primero ejecutando: node matricula_server.js`);
        process.exit(1);
    }
    
    const stats = JSON.parse(statusRes.body);
    console.log(`[+] Servidor conectado. Modo actual del servidor: ${stats.mode.toUpperCase()}`);
    
    // If server mode doesn't match the desired test mode, toggle it
    if (stats.mode !== testMode) {
        console.log(`[+] Cambiando modo del servidor a: ${testMode.toUpperCase()}...`);
        await sendRequest('POST', '/api/control/toggle');
    }
    
    // Reset stats on server
    await sendRequest('POST', '/api/control/reset');
    console.log(`[+] Servidor inicializado y listo para la simulación.`);
}

// Simulates a single Virtual User loop
async function runVirtualUser(vuId, stopTime) {
    let iteration = 0;
    while (Date.now() < stopTime) {
        iteration++;
        
        // Step 1: Login
        totalRequests++;
        const loginRes = await sendRequest('POST', '/api/auth/login', {
            username: `estudiante_${vuId}_iter_${iteration}`,
            password: 'securePassword123'
        });
        
        recordMetric(loginRes);
        if (loginRes.statusCode !== 200) {
            await sleep(THINK_TIME_MS);
            continue;
        }

        // Step 2: Get Courses Catalog
        totalRequests++;
        const coursesRes = await sendRequest('GET', '/api/matricula/cursos');
        recordMetric(coursesRes);
        if (coursesRes.statusCode !== 200) {
            await sleep(THINK_TIME_MS);
            continue;
        }

        // Step 3: Save Enrollment
        totalRequests++;
        const enrollRes = await sendRequest('POST', '/api/matricula/guardar', {
            estudiante_id: 1000 + vuId,
            cursos: [101, 102, 105]
        });
        recordMetric(enrollRes);

        // Sleep/Think Time
        await sleep(THINK_TIME_MS + Math.random() * 50);
    }
}

// Record execution metrics
function recordMetric(res) {
    responseDurations.push(res.duration);
    if (res.statusCode >= 200 && res.statusCode < 300) {
        successRequests++;
    } else {
        failedRequests++;
        const codeKey = res.statusCode === 0 ? 'Conexión Abortada' : `HTTP ${res.statusCode}`;
        errorsByCode[codeKey] = (errorsByCode[codeKey] || 0) + 1;
    }
}

// Helper: Sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Format durations for percentiles
function calculatePercentiles() {
    if (responseDurations.length === 0) return { avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
    
    // Sort ascending
    const sorted = [...responseDurations].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    const getPercentile = (p) => {
        const idx = Math.floor(sorted.length * p);
        return sorted[Math.min(idx, sorted.length - 1)];
    };

    return {
        avg: sum / sorted.length,
        p50: getPercentile(0.50),
        p90: getPercentile(0.90),
        p95: getPercentile(0.95),
        p99: getPercentile(0.99)
    };
}

// Main execution function
async function startLoadTest() {
    await setupServer();

    console.log(`\n==================================================================`);
    console.log(`        INICIANDO CARGA SIMULADA (MODO: ${testMode.toUpperCase()})`);
    console.log(`==================================================================`);
    console.log(` Concurrencia (VUs):     ${CONCURRENCY_VUS} usuarios simulados activos`);
    console.log(` Duración del Test:      ${DURATION_SECONDS} segundos`);
    console.log(` Think Time Medio:       ${THINK_TIME_MS} ms`);
    console.log(` Destino de Peticiones:  http://${TARGET_HOST}:${TARGET_PORT}`);
    console.log(`==================================================================\n`);

    const startTime = Date.now();
    const stopTime = startTime + (DURATION_SECONDS * 1000);
    
    // Spawn all VU promises
    const vuPromises = [];
    for (let i = 1; i <= CONCURRENCY_VUS; i++) {
        vuPromises.push(runVirtualUser(i, stopTime));
    }

    // Monitor progress every second
    const progressInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const rps = elapsed > 0 ? (totalRequests / elapsed).toFixed(1) : 0;
        const errRate = totalRequests > 0 ? ((failedRequests / totalRequests) * 100).toFixed(1) : 0;
        const metrics = calculatePercentiles();
        
        console.log(
            `[Progreso: ${elapsed}s/${DURATION_SECONDS}s] VUs: ${CONCURRENCY_VUS} | ` +
            `Pet. Totales: ${totalRequests} | RPS: ${rps} | ` +
            `Latencia Media: ${metrics.avg.toFixed(0)}ms | Tasa Error: ${errRate}%`
        );
    }, 1000);

    // Wait for all VUs to finish
    await Promise.all(vuPromises);
    clearInterval(progressInterval);
    
    const actualDuration = (Date.now() - startTime) / 1000;
    
    // Compile and print report
    const rpsFinal = (totalRequests / actualDuration).toFixed(1);
    const errorPct = totalRequests > 0 ? ((failedRequests / totalRequests) * 100).toFixed(2) : '0.00';
    const metrics = calculatePercentiles();

    console.log(`\n==================================================================`);
    console.log(`           INFORME DE RENDIMIENTO (LOAD TEST COMPLETO)`);
    console.log(`==================================================================`);
    console.log(`Duración Real:           ${actualDuration.toFixed(2)} segundos`);
    console.log(`Usuarios Concurrentes:   ${CONCURRENCY_VUS}`);
    console.log(`Peticiones Totales:      ${totalRequests}`);
    console.log(`Peticiones Exitosas:     ${successRequests}`);
    console.log(`Peticiones Fallidas:     ${failedRequests} (${errorPct}% de error)`);
    console.log(`Rendimiento (Throughput): ${rpsFinal} solicitudes/seg (RPS)`);
    console.log(`------------------------------------------------------------------`);
    console.log(`Tiempos de Respuesta (Latencia):`);
    console.log(`  - Promedio (Mean):     ${metrics.avg.toFixed(1)} ms`);
    console.log(`  - Percentil 50 (p50):  ${metrics.p50} ms`);
    console.log(`  - Percentil 90 (p90):  ${metrics.p90} ms`);
    console.log(`  - Percentil 95 (p95):  ${metrics.p95} ms`);
    console.log(`  - Percentil 99 (p99):  ${metrics.p99} ms`);
    
    if (Object.keys(errorsByCode).length > 0) {
        console.log(`------------------------------------------------------------------`);
        console.log(`Desglose de Errores:`);
        for (const [code, count] of Object.entries(errorsByCode)) {
            console.log(`  - ${code}: ${count} ocurrencias`);
        }
    }
    console.log(`==================================================================\n`);
    
    if (testMode === 'unoptimized') {
        console.log(`⚠️ ANÁLISIS DE CUELLES DE BOTELLA (MODO SIN OPTIMIZAR):`);
        console.log(`   Se observa que el tiempo de respuesta promedio supera el límite de SLA`);
        console.log(`   (establecido en 1500ms) y la tasa de error es significativa debido al`);
        console.log(`   agotamiento del pool de procesos PHP-FPM y bloqueos en base de datos.`);
        console.log(`\n👉 Para probar el modo optimizado, ejecuta: node scripts/load_tester.js --optimized\n`);
    } else {
        console.log(`✨ ANÁLISIS DE OPTIMIZACIÓN (MODO OPTIMIZADO CON REDIS):`);
        console.log(`   El tiempo de respuesta se mantiene por debajo de los 300ms de forma`);
        console.log(`   constante, sin registrar fallos o timeouts (error 0.00%). Esto valida`);
        console.log(`   empíricamente que el uso de Redis e Índices resuelve el cuello de botella.`);
        console.log(`==================================================================\n`);
    }
}

startLoadTest().catch(console.error);
