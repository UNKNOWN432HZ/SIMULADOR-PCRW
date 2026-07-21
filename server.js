// -*- coding: utf-8 -*-
const http = require('http');
const url = require('url');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Global server state and stats
let globalMode = 'unoptimized'; // 'unoptimized' or 'optimized'
let simulatedVUs = 0;
let eventLog = [];



// Map to track active real users (validated by student ID)
const activeRealUsers = new Map();

let stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    activeRequests: 0,
    totalLatency: 0,
    latencySamples: [],
    errorsByCode: {}
};

// Reset stats
function resetStats() {
    stats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        activeRequests: 0,
        totalLatency: 0,
        latencySamples: [],
        errorsByCode: {}
    };
    eventLog = [];
    activeRealUsers.clear();
    logEvent('system', 'Estadísticas reiniciadas por el administrador.');
}

// Log event helper
function logEvent(type, message) {
    eventLog.unshift({
        time: new Date().toLocaleTimeString(),
        type: type,
        message: message
    });
    if (eventLog.length > 30) {
        eventLog.pop();
    }
}

// Record real user activity based on Student ID
function recordRealUserActivity(studentId, studentName) {
    if (!studentId) return;
    activeRealUsers.set(String(studentId), {
        name: studentName || 'Estudiante Real',
        lastActiveTime: Date.now()
    });
}

// Get the count of validated active real users in the last 10 seconds
function getActiveRealUsersCount() {
    const now = Date.now();
    for (const [id, user] of activeRealUsers.entries()) {
        if (now - user.lastActiveTime > 10000) { // 10 seconds timeout
            activeRealUsers.delete(id);
        }
    }
    return activeRealUsers.size;
}

// Helper to get Local LAN IP
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    let backupIp = null;
    
    const sortedInterfaceNames = Object.keys(interfaces).sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        
        const isWiFiA = aLower.includes('wi-fi') || aLower.includes('wifi') || aLower.includes('wireless') || aLower.includes('inalámbrica');
        const isWiFiB = bLower.includes('wi-fi') || bLower.includes('wifi') || bLower.includes('wireless') || bLower.includes('inalámbrica');
        const isEthA = aLower.includes('ethernet') || aLower.includes('lan') || aLower.includes('conexión de área local');
        const isEthB = bLower.includes('ethernet') || bLower.includes('lan') || bLower.includes('conexión de área local');
        
        if (isWiFiA && !isWiFiB) return -1;
        if (!isWiFiA && isWiFiB) return 1;
        if (isEthA && !isEthB) return -1;
        if (!isEthA && isEthB) return 1;
        
        return 0;
    });

    for (const name of sortedInterfaceNames) {
        const nameLower = name.toLowerCase();
        
        if (nameLower.includes('virtualbox') || 
            nameLower.includes('vmware') || 
            nameLower.includes('vbox') || 
            nameLower.includes('host-only') || 
            nameLower.includes('virtual') || 
            nameLower.includes('wsl') || 
            nameLower.includes('pseudo') ||
            nameLower.includes('loopback') ||
            nameLower.includes('hyper-v') ||
            nameLower.includes('vethernet')) {
            continue;
        }

        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                const ip = iface.address;
                if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
                    if (ip.startsWith('192.168.56.')) {
                        backupIp = ip;
                        continue;
                    }
                    return ip;
                }
                backupIp = ip;
            }
        }
    }
    return backupIp || '127.0.0.1';
}

const LAN_IP = getLocalIp();
const PORT = 3000;
const LAN_ROOT_URL = `http://${LAN_IP}:${PORT}`;
const LAN_MATRICULA_URL = `http://${LAN_IP}:${PORT}/matricula`;
const QR_API_URL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(LAN_ROOT_URL)}`;

// Single Active Admin Session Lock
let activeAdminSession = {
    token: null,
    ip: null,
    lastHeartbeat: 0
};

function checkAdminSessionActive() {
    if (!activeAdminSession.token) return false;
    if (Date.now() - activeAdminSession.lastHeartbeat > 10000) {
        activeAdminSession.token = null;
        return false;
    }
    return true;
}

// Helper to read and render HTML templates dynamically
function getHtmlView(fileName) {
    try {
        const filePath = fileName === 'index.html'
            ? path.join(__dirname, fileName)
            : path.join(__dirname, 'views', fileName);
        let html = fs.readFileSync(filePath, 'utf8');
        
        // Interpolate server-side dynamic properties
        html = html.replace(/\${QR_API_URL}/g, QR_API_URL);
        html = html.replace(/\${LAN_ROOT_URL}/g, LAN_ROOT_URL);
        html = html.replace(/\${LAN_MATRICULA_URL}/g, LAN_ROOT_URL);
        return html;
    } catch (err) {
        return `
            <!DOCTYPE html>
            <html>
            <head><title>Error de Servidor</title><script src="https://cdn.tailwindcss.com"></script></head>
            <body class="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen">
                <div class="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center">
                    <h1 class="text-xl font-bold text-rose-500 mb-2">Error de Vista: ${fileName}</h1>
                    <p class="text-xs text-slate-400 font-mono">${err.message}</p>
                </div>
            </body>
            </html>
        `;
    }
}

// Internal Background Load Generator
setInterval(() => {
    if (simulatedVUs === 0) return;
    
    const activeSampleCount = Math.floor(simulatedVUs * (0.6 + Math.random() * 0.4) * 0.4);
    
    for (let i = 0; i < activeSampleCount; i++) {
        const rand = Math.random();
        let path = '/api/matricula/cursos';
        let method = 'GET';
        if (rand < 0.2) {
            path = '/api/auth/login';
            method = 'POST';
        } else if (rand < 0.3) {
            path = '/api/matricula/guardar';
            method = 'POST';
        }
        
        simulateInternalRequest(method, path);
    }
}, 400);

function simulateInternalRequest(method, path) {
    stats.totalRequests++;
    stats.activeRequests++;
    const startTime = Date.now();
    
    let delay = 10;
    let isError = false;
    let statusCode = 200;
    
    const currentVUs = stats.activeRequests;
    
    if (path === '/api/matricula/cursos') {
        if (globalMode === 'unoptimized') {
            if (currentVUs > 45) {
                delay = Math.round(Math.min(10000, 2200 + Math.pow(currentVUs, 1.25) * 6 + Math.random() * 500));
                isError = true;
                statusCode = 504;
            } else {
                delay = 1200 + Math.pow(currentVUs, 1.8) * 15 + Math.random() * 200;
            }
        } else {
            delay = 5 + Math.random() * 15;
        }
    } else if (path === '/api/matricula/guardar') {
        if (globalMode === 'unoptimized') {
            if (currentVUs > 45) {
                delay = Math.round(Math.min(12000, 2800 + currentVUs * 10 + Math.random() * 500));
                isError = true;
                statusCode = 500;
            } else {
                delay = 800 + currentVUs * 35 + Math.random() * 150;
            }
        } else {
            delay = 20 + Math.random() * 10;
        }
    } else {
        delay = globalMode === 'unoptimized' ? 200 : 15;
    }
    
    setTimeout(() => {
        stats.activeRequests = Math.max(0, stats.activeRequests - 1);
        const duration = Date.now() - startTime;
        stats.totalLatency += duration;
        stats.latencySamples.push(duration);
        if (stats.latencySamples.length > 200) stats.latencySamples.shift();
        
        if (isError) {
            stats.failedRequests++;
            stats.errorsByCode[statusCode] = (stats.errorsByCode[statusCode] || 0) + 1;
            if (Math.random() < 0.05) {
                logEvent('sim_error', `Simulado #${Math.floor(Math.random() * 9000) + 1000} falló en ${path} (${statusCode})`);
            }
        } else {
            stats.successfulRequests++;
            if (Math.random() < 0.02) {
                logEvent('sim_success', `Simulado #${Math.floor(Math.random() * 9000) + 1000} completó ${path}`);
            }
        }
    }, delay);
}

// HTTP Server Definition
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    
    const studentId = req.headers['x-student-id'] || parsedUrl.query.studentId;
    const studentName = decodeURIComponent(req.headers['x-student-name'] || parsedUrl.query.studentName || '');
    const isReal = studentId !== undefined;
    
    if (isReal) {
        recordRealUserActivity(studentId, studentName);
    }
    
    // --- NON-BUSINESS SYSTEM & MONITORING ROUTES (DO NOT COUNT IN APM LOAD METRICS) ---
    if (path === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(getHtmlView('index.html'));
    } 
    
    if (path === '/matricula' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(getHtmlView('matricula.html'));
    }

    if (path === '/dashboard' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(getHtmlView('dashboard.html'));
    }

    if (path === '/admin' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(getHtmlView('admin.html'));
    }

    if (path === '/favicon.ico') {
        res.writeHead(204);
        return res.end();
    }

    if (path === '/api/admin/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        return req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const pin = String(data.pin || '').trim();
                
                if (pin !== '2030') {
                    return sendJson(res, 401, { success: false, message: 'PIN de acceso incorrecto.' });
                }

                const now = Date.now();
                const isSessionBusy = activeAdminSession.token && (now - activeAdminSession.lastHeartbeat < 10000);
                const reqToken = req.headers['x-admin-token'] || data.token;

                if (isSessionBusy && activeAdminSession.token !== reqToken) {
                    return sendJson(res, 403, { 
                        success: false, 
                        message: 'Ya existe una sesión de Administrador activa en otro dispositivo. Solo se permite 1 Administrador simultáneo.' 
                    });
                }

                const newToken = 'admin_sess_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
                activeAdminSession = {
                    token: newToken,
                    ip: req.socket.remoteAddress,
                    lastHeartbeat: now
                };
                logEvent('system', 'Administrador inició sesión de control exclusiva.');
                return sendJson(res, 200, { success: true, token: newToken });
            } catch (e) {
                return sendJson(res, 400, { success: false, message: 'Petición inválida.' });
            }
        });
    }

    if (path === '/api/admin/heartbeat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        return req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const token = data.token || req.headers['x-admin-token'];
                if (activeAdminSession.token && activeAdminSession.token === token) {
                    activeAdminSession.lastHeartbeat = Date.now();
                    return sendJson(res, 200, { success: true });
                }
                return sendJson(res, 401, { success: false, message: 'Sesión inactiva o expirada.' });
            } catch (e) {
                return sendJson(res, 400, { success: false });
            }
        });
    }

    if (path === '/api/admin/logout' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        return req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const token = data.token || req.headers['x-admin-token'];
                if (activeAdminSession.token === token) {
                    activeAdminSession = { token: null, ip: null, lastHeartbeat: 0 };
                    logEvent('system', 'Administrador cerró la sesión de control.');
                }
                return sendJson(res, 200, { success: true });
            } catch (e) {
                return sendJson(res, 200, { success: true });
            }
        });
    }

    if (path === '/api/control/stats' && req.method === 'GET') {
        const realCount = getActiveRealUsersCount();
        const avg = stats.latencySamples.length > 0 
            ? stats.latencySamples.reduce((a, b) => a + b, 0) / stats.latencySamples.length 
            : 0;
        const errRate = stats.totalRequests > 0 ? stats.failedRequests / stats.totalRequests : 0;
        
        return sendJson(res, 200, {
            mode: globalMode,
            totalRequests: stats.totalRequests,
            successfulRequests: stats.successfulRequests,
            failedRequests: stats.failedRequests,
            activeRequests: stats.activeRequests,
            avgLatency: avg,
            errorRate: errRate,
            simulatedVUs: simulatedVUs,
            realUsersCount: realCount,
            totalConcurrency: realCount + simulatedVUs,
            hasActiveAdmin: checkAdminSessionActive(),
            eventLog: eventLog,
            lanRootUrl: LAN_ROOT_URL,
            lanMatriculaUrl: LAN_ROOT_URL,
            qrApiUrl: QR_API_URL
        });
    } 
    
    if (path === '/api/control/toggle' && req.method === 'POST') {
        globalMode = globalMode === 'unoptimized' ? 'optimized' : 'unoptimized';
        logEvent('system', `Modo del servidor cambiado a: ${globalMode.toUpperCase()}`);
        return sendJson(res, 200, { mode: globalMode });
    } 
    
    if (path === '/api/control/set-vus' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        return req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const parsed = parseInt(data.vus);
                simulatedVUs = isNaN(parsed) ? 0 : Math.min(1000, Math.max(0, parsed));
                logEvent('system', `Background simulated VUs ajustados a: ${simulatedVUs}`);
                return sendJson(res, 200, { simulatedVUs: simulatedVUs });
            } catch(e) {
                return sendJson(res, 400, { error: 'Invalid JSON' });
            }
        });
    }

    if (path === '/api/control/reset' && req.method === 'POST') {
        resetStats();
        logEvent('system', 'Métricas APM del servidor reiniciadas.');
        return sendJson(res, 200, { reset: true });
    }
    
    // --- BUSINESS MATRICULA API ENDPOINTS (TRACKED IN APM METRICS) ---
    stats.totalRequests++;
    stats.activeRequests++;

    const startTime = Date.now();

    function finalizeRequest(status, statusCode) {
        const duration = Date.now() - startTime;
        stats.activeRequests = Math.max(0, stats.activeRequests - 1);
        stats.totalLatency += duration;
        stats.latencySamples.push(duration);
        
        if (stats.latencySamples.length > 200) {
            stats.latencySamples.shift();
        }

        if (status === 'success') {
            stats.successfulRequests++;
            if (isReal) {
                logEvent('real_success', `Estudiante Real '${studentName}' (ID: ${studentId}) se matriculó con éxito en ${duration}ms!`);
            }
        } else {
            stats.failedRequests++;
            stats.errorsByCode[statusCode] = (stats.errorsByCode[statusCode] || 0) + 1;
            if (isReal) {
                logEvent('real_error', `Estudiante Real '${studentName}' (ID: ${studentId}) FALLÓ con HTTP ${statusCode} en ${duration}ms!`);
            }
        }
    }
    
    // --- TARGET PORTAL ENDPOINTS ---
    if (path === '/api/auth/login' && req.method === 'POST') {
        const delay = globalMode === 'unoptimized' ? 200 : 15;
        setTimeout(() => {
            finalizeRequest('success', 200);
            sendJson(res, 200, {
                access_token: "jwt_token_ieshv4nta_simulated_qa_123",
                token_type: "Bearer",
                expires_in: 3600
            });
        }, delay);
    } 
    
    else if (path === '/api/matricula/cursos' && req.method === 'GET') {
        if (globalMode === 'unoptimized') {
            const currentVUs = stats.activeRequests;
            if (currentVUs > 45) {
                const timeoutDelay = Math.round(Math.min(10000, 2200 + Math.pow(currentVUs, 1.25) * 6 + Math.random() * 500));
                setTimeout(() => {
                    finalizeRequest('error', 504);
                    res.writeHead(504, { 'Content-Type': 'text/plain' });
                    res.end("504 Gateway Timeout: PHP-FPM pool queue exhausted.");
                }, timeoutDelay);
            } else {
                const baseDelay = 1500;
                const congestionDelay = Math.pow(currentVUs, 1.8) * 15; 
                const totalDelay = baseDelay + congestionDelay;
                setTimeout(() => {
                    finalizeRequest('success', 200);
                    sendJson(res, 200, [
                        { id: 101, nombre: "Diseño Web Avanzado", carrera: "Diseño y Programación Web", vacantes: 30, semestre: "2026-I" },
                        { id: 102, nombre: "Pruebas de Software Automatizadas", carrera: "Pruebas de Software", vacantes: 25, semestre: "2026-I" },
                        { id: 103, nombre: "Bases de Datos Relacionales", carrera: "Diseño y Programación Web", vacantes: 4, semestre: "2026-I" },
                        { id: 104, nombre: "Gestión de Configuración y CI/CD", carrera: "Pruebas de Software", vacantes: 18, semestre: "2026-I" },
                        { id: 105, nombre: "Programación Backend en Node.js", carrera: "Diseño y Programación Web", vacantes: 15, semestre: "2026-I" }
                    ]);
                }, totalDelay);
            }
        } else {
            const cacheDelay = 5 + Math.random() * 10;
            setTimeout(() => {
                finalizeRequest('success', 200);
                sendJson(res, 200, [
                    { id: 101, nombre: "Diseño Web Avanzado", carrera: "Diseño y Programación Web", vacantes: 30, semestre: "2026-I" },
                    { id: 102, nombre: "Pruebas de Software Automatizadas", carrera: "Pruebas de Software", vacantes: 25, semestre: "2026-I" },
                    { id: 103, nombre: "Bases de Datos Relacionales", carrera: "Diseño y Programación Web", vacantes: 4, semestre: "2026-I" },
                    { id: 104, nombre: "Gestión de Configuración y CI/CD", carrera: "Pruebas de Software", vacantes: 18, semestre: "2026-I" },
                    { id: 105, nombre: "Programación Backend en Node.js", carrera: "Diseño y Programación Web", vacantes: 15, semestre: "2026-I" }
                ]);
            }, cacheDelay);
        }
    } 
    
    else if (path === '/api/matricula/guardar' && req.method === 'POST') {
        if (globalMode === 'unoptimized') {
            const currentVUs = stats.activeRequests;
            if (currentVUs > 45) {
                const lockTimeoutDelay = Math.round(Math.min(12000, 2800 + currentVUs * 10 + Math.random() * 500));
                setTimeout(() => {
                    finalizeRequest('error', 500);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end("500 Internal Server Error: Connection abort by MySQL Lock Timeout.");
                }, lockTimeoutDelay);
            } else {
                const baseDelay = 1000;
                const lockContention = currentVUs * 35;
                const totalDelay = baseDelay + lockContention;
                setTimeout(() => {
                    finalizeRequest('success', 201);
                    sendJson(res, 201, {
                        status: "Matricula guardada exitosamente",
                        codigo_registro: "MAT-2026-" + Math.floor(100000 + Math.random() * 900000),
                        estudiante_id: 1024
                    });
                }, totalDelay);
            }
        } else {
            const dbDelay = 20 + Math.random() * 10;
            setTimeout(() => {
                finalizeRequest('success', 201);
                sendJson(res, 201, {
                    status: "Matricula guardada exitosamente",
                    codigo_registro: "MAT-2026-" + Math.floor(100000 + Math.random() * 900000),
                    estudiante_id: 1024
                });
            }, dbDelay);
        }
    } 
    
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end("API Endpoint Not Found");
        finalizeRequest('error', 404);
    }
});

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// Start Server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`==================================================================`);
    console.log(`       SIMULADOR REAL DE MATRÍCULA INTERACTIVA: SIMULADOR PCRW`);
    console.log(`==================================================================`);
    console.log(` Servidor levantado en RED LOCAL:    http://${LAN_IP}:${PORT}`);
    console.log(`\n Pantallas de Presentación en Vivo:`);
    console.log(`   👉 Página de Inicio (Landing):     http://localhost:${PORT}/`);
    console.log(`   👉 Monitor APM Proyector (Admin): http://localhost:${PORT}/admin`);
    console.log(`   👉 Monitor APM Público (Alumnos): http://localhost:${PORT}/dashboard`);
    console.log(`   👉 Portal de Matrícula Alumnos:  ${LAN_MATRICULA_URL}`);
    console.log(`==================================================================`);
});
