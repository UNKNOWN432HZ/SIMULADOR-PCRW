// -*- coding: utf-8 -*-
const http = require('http');
const url = require('url');
const os = require('os');

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
    
    // Sort interfaces to prioritize active Wi-Fi and physical Ethernet network cards
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
        
        // Skip virtual network interfaces commonly created by VMs/Containers
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
            // Find active non-internal IPv4 address
            if (iface.family === 'IPv4' && !iface.internal) {
                const ip = iface.address;
                // Check if it belongs to standard LAN subnets
                if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
                    // Avoid VirtualBox default Host-Only adapter range if possible
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
const LAN_MATRICULA_URL = `http://${LAN_IP}:${PORT}/matricula`;
const QR_API_URL = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(LAN_MATRICULA_URL)}`;

// Internal Background Load Generator
setInterval(() => {
    if (simulatedVUs === 0) return;
    
    // Scale batch count based on simulatedVUs (supports up to 1000)
    // Batch cycle runs every 400ms
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
                delay = 300; // Throw error quickly to keep event loop responsive
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
                delay = 300;
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

// -----------------------------------------------------------------
// HTML Pages Strings
// -----------------------------------------------------------------

// 1. Landing Page (Root `/`)
const landingPageHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Intranet Académica - IES HV4NTA</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        body { font-family: 'Outfit', sans-serif; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between">
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

    <!-- Header Navigation -->
    <header class="border-b border-slate-900 bg-slate-950/60 backdrop-blur py-4 px-6 sticky top-0 z-50">
        <div class="container mx-auto flex justify-between items-center">
            <span class="text-lg font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">IES HV4NTA</span>
            <nav class="flex space-x-6 text-sm">
                <a href="/matricula" class="hover:text-blue-400 font-semibold transition">Portal Matrícula</a>
                <a href="/dashboard" class="hover:text-blue-400 font-semibold transition">APM Público</a>
                <a href="/admin" class="text-rose-400/80 hover:text-rose-400 font-semibold transition">Consola Admin</a>
            </nav>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center text-center relative z-10">
        <span class="bg-blue-500/10 text-blue-400 text-xs px-3.5 py-1 rounded-full font-bold uppercase tracking-wider border border-blue-500/20 mb-4 inline-block">Plataforma de Simulación Educativa</span>
        <h1 class="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight max-w-3xl">
            Simulador de Pruebas de Carga y <span class="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">Rendimiento Web</span>
        </h1>
        <p class="text-slate-400 md:text-lg mb-12 max-w-2xl leading-relaxed">
            Plataforma interactiva del curso <span class="text-slate-200 font-semibold">Pruebas de Software</span>. Experimenta en vivo el comportamiento de un servidor web Laravel/Nginx bajo el colapso de consultas secuenciales y la optimización con Redis.
        </p>

        <!-- Big Buttons Grid (Symmetrical 3-column layout) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-4xl">
            <!-- Matricula portal -->
            <a href="/matricula" class="group bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 p-6 rounded-3xl text-left transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between">
                <div>
                    <div class="flex items-center space-x-3.5 mb-4">
                        <div class="w-11 h-11 bg-blue-500/10 border border-blue-500/25 rounded-2xl flex items-center justify-center text-blue-400 font-bold group-hover:bg-blue-500/20 transition shrink-0">📝</div>
                        <h3 class="text-lg font-bold text-white group-hover:text-blue-400 transition">Portal del Alumno</h3>
                    </div>
                    <p class="text-xs text-slate-400 leading-relaxed">Ficha de matrícula interactiva para alumnos de la clase. Ingresa y simula el envío de tu expediente de forma concurrente.</p>
                </div>
                <span class="text-blue-400 text-xs font-bold mt-6 inline-flex items-center group-hover:translate-x-1 transition-transform">Acceder al portal &rarr;</span>
            </a>

            <!-- APM Viewer -->
            <a href="/dashboard" class="group bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 p-6 rounded-3xl text-left transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between">
                <div>
                    <div class="flex items-center space-x-3.5 mb-4">
                        <div class="w-11 h-11 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl flex items-center justify-center text-indigo-400 font-bold group-hover:bg-indigo-500/20 transition shrink-0">📊</div>
                        <h3 class="text-lg font-bold text-white group-hover:text-indigo-400 transition">Dashboard Público (APM)</h3>
                    </div>
                    <p class="text-xs text-slate-400 leading-relaxed">Pantalla de solo lectura para los estudiantes. Observa los gráficos de latencia global y la concurrencia en tiempo real.</p>
                </div>
                <span class="text-indigo-400 text-xs font-bold mt-6 inline-flex items-center group-hover:translate-x-1 transition-transform">Ver métricas en vivo &rarr;</span>
            </a>

            <!-- QR Code Card (Clickable to expand - Symmetrical layout) -->
            <div onclick="openQrModal()" class="group bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 p-6 rounded-3xl text-left transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between cursor-pointer">
                <div>
                    <div class="flex items-center space-x-3.5 mb-4">
                        <div class="w-11 h-11 bg-purple-500/10 border border-purple-500/25 rounded-2xl flex items-center justify-center text-purple-400 font-bold group-hover:bg-purple-500/20 transition shrink-0">📱</div>
                        <h3 class="text-lg font-bold text-white group-hover:text-purple-400 transition">Escanea para Entrar</h3>
                    </div>
                    <p class="text-xs text-slate-400 leading-normal mb-4">
                        Conéctate a la red LAN por cable o Wi-Fi y escanea este código para simular tu matrícula en tiempo real:
                    </p>
                    <div class="flex justify-center my-3">
                        <div class="bg-white p-2 rounded-xl inline-block shadow-lg shadow-indigo-500/5">
                            <img src="${QR_API_URL}" alt="QR LAN Access" class="w-28 h-28">
                        </div>
                    </div>
                </div>
                <span class="text-indigo-400 font-bold block mt-4 font-mono text-[10px] group-hover:underline text-center w-full">${LAN_MATRICULA_URL}</span>
            </div>
        </div>
    </main>

    <!-- Modal for Large QR -->
    <div id="qrModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md hidden flex items-center justify-center z-50 p-4" onclick="closeQrModal(event)">
        <div class="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center relative shadow-2xl" onclick="event.stopPropagation()">
            <!-- Close Button -->
            <button onclick="document.getElementById('qrModal').classList.add('hidden')" class="absolute top-4 right-4 text-slate-400 hover:text-white transition font-bold text-xl">&times;</button>
            
            <span class="bg-purple-500/10 text-purple-400 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-purple-500/20 inline-block mb-3">Escaneo de Larga Distancia</span>
            <h3 class="text-xl font-black text-white mb-1">Código QR Gigante</h3>
            <p class="text-xs text-slate-400 mb-5">Perfecto para escanear desde los asientos traseros del aula</p>
            
            <!-- Giant QR Code -->
            <div class="bg-white p-3 rounded-2xl inline-block shadow-xl mb-5">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(LAN_MATRICULA_URL)}" alt="QR LAN Access Large" class="w-72 h-72">
            </div>
            
            <!-- Large URL details -->
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-850">
                <span class="text-[9px] uppercase font-bold text-slate-500 block tracking-wider mb-1">Enlace del Portal de Matrícula</span>
                <a href="${LAN_MATRICULA_URL}" target="_blank" class="text-base font-mono font-bold text-indigo-400 hover:underline block break-all">${LAN_MATRICULA_URL}</a>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Ámbito: Pruebas de Software | Docente: ING. ALEGRIA CORE, CRISTHIAN | IES HV4NTA - 2026</p>
    </footer>

    <script>
        function openQrModal() {
            document.getElementById('qrModal').classList.remove('hidden');
        }
        function closeQrModal(event) {
            document.getElementById('qrModal').classList.add('hidden');
        }
    </script>
</body>
</html>
`;

// 2. Admin APM Dashboard (with full controls, sliders up to 1000)
const adminDashboardHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>APM Admin Panel - IES HV4NTA</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        body { font-family: 'Outfit', sans-serif; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
    <div class="container mx-auto px-4 py-5">
        <!-- Top Header -->
        <header class="flex flex-col lg:flex-row justify-between items-center border-b border-slate-800 pb-4 mb-6">
            <div>
                <span class="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full font-bold uppercase border border-rose-500/20 inline-block mb-1">Panel de Control Docente</span>
                <h1 class="text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                    APM Admin Control Panel
                </h1>
                <p class="text-slate-400 text-xs mt-0.5">Acceso exclusivo para el administrador. Controla el estrés e inyecta carga en vivo.</p>
            </div>
            
            <div class="mt-4 lg:mt-0 flex gap-3">
                <a href="/dashboard" class="bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center">
                    Vista Pública (Dashboard)
                </a>
                <a href="/matricula" class="bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center">
                    Matrícula LAN
                </a>
            </div>
        </header>

        <!-- Main Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Left Side: APM Monitor Metrics -->
            <div class="lg:col-span-3 space-y-6">
                <!-- Stats Widgets -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <!-- Concurrencia -->
                    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Concurrencia Total</p>
                        <p id="activeReqVal" class="text-3xl font-black text-blue-400 mt-2">0</p>
                        <p class="text-[9px] text-slate-400 mt-2">
                            <span id="realVUsVal" class="text-yellow-400 font-bold">0</span> reales / 
                            <span id="simVUsVal" class="text-sky-400 font-bold">0</span> simulados
                        </p>
                    </div>

                    <!-- Latencia Media -->
                    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Latencia Media</p>
                        <p id="avgLatencyVal" class="text-3xl font-black text-indigo-400 mt-2">0 ms</p>
                        <span id="avgLatencySub" class="text-[9px] block mt-2 font-semibold">Cargando...</span>
                    </div>

                    <!-- Throughput -->
                    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Rendimiento (RPS)</p>
                        <p id="rpsVal" class="text-3xl font-black text-emerald-400 mt-2">0.0</p>
                        <p id="totalReqVal" class="text-[9px] text-slate-400 mt-2">Total: 0</p>
                    </div>

                    <!-- Tasa de Error -->
                    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Tasa de Error</p>
                        <p id="errorRateVal" class="text-3xl font-black text-rose-500 mt-2">0.0 %</p>
                        <p id="statusRate" class="text-[9px] text-rose-400 mt-2">Errores: 0</p>
                    </div>
                </div>

                <!-- Live Chart -->
                <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <h3 class="text-xs font-bold text-slate-200 mb-3 uppercase tracking-wider">Historial Latencia vs Concurrencia</h3>
                    <div class="h-80">
                        <canvas id="liveChart"></canvas>
                    </div>
                </div>

                <!-- Event Log -->
                <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <h3 class="text-xs font-bold text-slate-200 mb-3 uppercase tracking-wider">Consola de Eventos del Servidor</h3>
                    <div id="eventLogContainer" class="h-44 overflow-y-auto space-y-1.5 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
                    </div>
                </div>
            </div>

            <!-- Right Side: Administration Controls -->
            <div class="space-y-6">
                <!-- Server Mode Control -->
                <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">Estado Arquitectura</h3>
                    
                    <div class="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-850">
                        <span class="text-xs font-semibold text-slate-400">OPTIMIZACIÓN:</span>
                        <button id="toggleBtn" onclick="toggleMode()" class="px-4 py-1.5 rounded-lg font-bold text-xs uppercase transition-all duration-300">
                            Cargando...
                        </button>
                    </div>
                </div>

                <!-- Live Load Generator (0 to 1000) -->
                <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2 font-semibold">Generador de Estrés</h3>
                    
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="text-slate-400">VUs de Fondo:</span>
                            <span id="sliderVal" class="text-sky-400 font-bold">0 VUs</span>
                        </div>
                        <input id="vuSlider" type="range" min="0" max="1000" step="10" value="0" oninput="setSliderVUs(this.value)" class="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500">
                        <div class="flex justify-between text-[9px] text-slate-500 mt-1">
                            <span>0</span>
                            <span>250</span>
                            <span>500</span>
                            <span>750</span>
                            <span>1000 VUs</span>
                        </div>
                    </div>

                    <!-- Presets -->
                    <div class="space-y-2 pt-2">
                        <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Presets de Presentación:</span>
                        
                        <button onclick="applyPreset('tránsito_bajo')" class="w-full text-left bg-slate-800 hover:bg-slate-700/80 text-xs px-3 py-2 rounded-lg font-semibold flex justify-between items-center transition border border-slate-700/40">
                            <span>🟢 Tránsito Bajo</span>
                            <span class="text-[9px] text-emerald-400 font-bold">Optimizado + 10 VUs</span>
                        </button>
                        
                        <button onclick="applyPreset('pico_lento')" class="w-full text-left bg-slate-800 hover:bg-slate-700/80 text-xs px-3 py-2 rounded-lg font-semibold flex justify-between items-center transition border border-slate-700/40">
                            <span>🔴 Pico Lento (Colapso)</span>
                            <span class="text-[9px] text-rose-400 font-bold">Sin Opt. + 150 VUs</span>
                        </button>

                        <button onclick="applyPreset('pico_optimizado')" class="w-full text-left bg-slate-800 hover:bg-slate-700/80 text-xs px-3 py-2 rounded-lg font-semibold flex justify-between items-center transition border border-slate-700/40">
                            <span>⚡ Pico Optimizado</span>
                            <span class="text-[9px] text-indigo-400 font-bold">Optimizado + 500 VUs</span>
                        </button>

                        <button onclick="applyPreset('estrés_extremo')" class="w-full text-left bg-slate-850 hover:bg-slate-800 text-xs px-3 py-2 rounded-lg font-semibold flex justify-between items-center transition border border-slate-700/60">
                            <span>🔥 Estrés Extremo</span>
                            <span class="text-[9px] text-purple-400 font-bold">Optimizado + 1000 VUs</span>
                        </button>
                    </div>

                    <!-- Reset Stats -->
                    <div class="pt-2">
                        <button onclick="resetStatsServer()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold py-2.5 rounded-xl text-xs transition border border-slate-700">
                            Reiniciar Métricas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Init chart
        const ctx = document.getElementById('liveChart').getContext('2d');
        const liveChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Latencia (ms)',
                        data: [],
                        borderColor: '#818cf8',
                        backgroundColor: 'rgba(129, 140, 248, 0.03)',
                        borderWidth: 2,
                        tension: 0.25,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Usuarios Concurrencia (VUs)',
                        data: [],
                        borderColor: '#38bdf8',
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        tension: 0.1,
                        yAxisID: 'y2'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 9 } }
                    },
                    y1: {
                        position: 'left',
                        grid: { color: 'rgba(71, 85, 105, 0.15)' },
                        ticks: { color: '#818cf8', font: { size: 9 } },
                        title: { display: true, text: 'Latencia (ms)', color: '#818cf8', font: { size: 9 } }
                    },
                    y2: {
                        position: 'right',
                        grid: { display: false },
                        ticks: { color: '#38bdf8', font: { size: 9 } },
                        title: { display: true, text: 'Usuarios Activos', color: '#38bdf8', font: { size: 9 } }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#cbd5e1', font: { size: 10 } } }
                }
            }
        });

        let lastReqCount = 0;
        let lastTime = Date.now();

        async function fetchStats() {
            try {
                const res = await fetch('/api/control/stats');
                const data = await res.json();
                
                const now = Date.now();
                const deltaReq = data.totalRequests - lastReqCount;
                const deltaTimeSec = (now - lastTime) / 1000;
                let currentRps = deltaReq / deltaTimeSec;
                if (currentRps < 0) currentRps = 0;
                
                lastReqCount = data.totalRequests;
                lastTime = now;

                document.getElementById('activeReqVal').innerText = data.activeRequests;
                document.getElementById('avgLatencyVal').innerText = data.avgLatency.toFixed(0) + ' ms';
                document.getElementById('totalReqVal').innerText = 'Total: ' + data.totalRequests;
                document.getElementById('errorRateVal').innerText = (data.errorRate * 100).toFixed(1) + ' %';
                document.getElementById('statusRate').innerText = 'Errores: ' + data.failedRequests;
                document.getElementById('rpsVal').innerText = currentRps.toFixed(1);
                
                // Concurrency breakdown
                document.getElementById('simVUsVal').innerText = data.simulatedVUs;
                document.getElementById('realVUsVal').innerText = data.realUsersCount;
                
                // Update Slider value text if not matching
                if (document.getElementById('vuSlider').value != data.simulatedVUs) {
                    document.getElementById('vuSlider').value = data.simulatedVUs;
                }
                document.getElementById('sliderVal').innerText = data.simulatedVUs + ' VUs';

                // Toggle active mode button state
                const toggleBtn = document.getElementById('toggleBtn');
                if (data.mode === 'optimized') {
                    toggleBtn.innerText = 'OPTIMIZADO';
                    toggleBtn.className = 'px-4 py-1.5 rounded-lg font-bold text-xs uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                } else {
                    toggleBtn.innerText = 'SIN OPTIMIZAR';
                    toggleBtn.className = 'px-4 py-1.5 rounded-lg font-bold text-xs uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse';
                }
                
                if (data.mode === 'optimized') {
                    document.getElementById('avgLatencySub').innerText = 'Redis Cache HIT';
                    document.getElementById('avgLatencySub').className = 'text-[9px] text-emerald-400 mt-2 font-semibold';
                } else {
                    document.getElementById('avgLatencySub').innerText = 'Table Scan en MySQL';
                    document.getElementById('avgLatencySub').className = 'text-[9px] text-rose-400 mt-2 font-semibold animate-pulse';
                }

                // Update charts
                const timeLabel = new Date().toLocaleTimeString().substring(3, 8);
                liveChart.data.labels.push(timeLabel);
                liveChart.data.datasets[0].data.push(data.avgLatency);
                liveChart.data.datasets[1].data.push(data.activeRequests);
                
                if (liveChart.data.labels.length > 30) {
                    liveChart.data.labels.shift();
                    liveChart.data.datasets[0].data.shift();
                    liveChart.data.datasets[1].data.shift();
                }
                liveChart.update('none');

                // Update event log
                const logContainer = document.getElementById('eventLogContainer');
                logContainer.innerHTML = '';
                data.eventLog.forEach(log => {
                    let colorClass = 'text-slate-400';
                    let prefix = '[Sim]';
                    if (log.type === 'real_success') {
                        colorClass = 'text-yellow-300 font-bold bg-yellow-900/10 py-0.5 px-1 rounded border border-yellow-900/20';
                        prefix = '[REAL]';
                    } else if (log.type === 'real_error') {
                        colorClass = 'text-rose-400 font-extrabold bg-rose-950/20 py-0.5 px-1 rounded border border-rose-900/30';
                        prefix = '[REAL ER]';
                    } else if (log.type === 'sim_error') {
                        colorClass = 'text-rose-500/60';
                        prefix = '[Sim ER]';
                    } else if (log.type === 'system') {
                        colorClass = 'text-sky-400 font-bold';
                        prefix = '[SYS]';
                    }
                    
                    const div = document.createElement('div');
                    div.className = colorClass;
                    div.innerText = log.time + ' ' + prefix + ' ' + log.message;
                    logContainer.appendChild(div);
                });
                
            } catch (err) {
                console.error("Error fetching stats:", err);
            }
        }

        async function toggleMode() {
            await fetch('/api/control/toggle', { method: 'POST' });
            fetchStats();
        }

        async function setSliderVUs(val) {
            document.getElementById('sliderVal').innerText = val + ' VUs';
            await fetch('/api/control/set-vus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vus: parseInt(val) })
            });
        }

        async function applyPreset(presetName) {
            let mode = 'optimized';
            let vus = 0;
            if (presetName === 'tránsito_bajo') {
                mode = 'optimized';
                vus = 10;
            } else if (presetName === 'pico_lento') {
                mode = 'unoptimized';
                vus = 150;
            } else if (presetName === 'pico_optimizado') {
                mode = 'optimized';
                vus = 500;
            } else if (presetName === 'estrés_extremo') {
                mode = 'optimized';
                vus = 1000;
            }

            await fetch('/api/control/set-vus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vus: vus })
            });
            
            const res = await fetch('/api/control/stats');
            const data = await res.json();
            if (data.mode !== mode) {
                await fetch('/api/control/toggle', { method: 'POST' });
            }

            fetchStats();
        }

        async function resetStatsServer() {
            await fetch('/api/control/reset', { method: 'POST' });
            liveChart.data.labels = [];
            liveChart.data.datasets[0].data = [];
            liveChart.data.datasets[1].data = [];
            liveChart.update();
            fetchStats();
        }

        setInterval(fetchStats, 1000);
        fetchStats();
    </script>
</body>
</html>
`;

// 3. Public APM Dashboard (Read-Only Viewer, no controls, with LAN QR)
const publicDashboardHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitor de Rendimiento en Vivo - IES HV4NTA</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        body { font-family: 'Outfit', sans-serif; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
    <div class="container mx-auto px-4 py-5">
        <!-- Header -->
        <header class="flex flex-col lg:flex-row justify-between items-center border-b border-slate-800 pb-4 mb-6">
            <div>
                <span class="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-indigo-500/20 inline-block mb-1">Métricas en Vivo (Público)</span>
                <h1 class="text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                    APM Public Performance Monitor
                </h1>
                <p class="text-slate-400 text-xs mt-0.5">Observa cómo fluctúan las métricas a medida que tú y tus compañeros envían matrículas.</p>
            </div>
            
            <div class="mt-4 lg:mt-0 flex gap-3">
                <a href="/matricula" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center shadow-lg shadow-blue-500/10">
                    Ir al Portal de Matrícula
                </a>
                <a href="/" class="bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center">
                    Inicio
                </a>
            </div>
        </header>

        <!-- Grid Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Left Side: APM Metrics (3 Columns) -->
            <div class="lg:col-span-3 space-y-6">
                <!-- Widgets -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <!-- Concurrencia -->
                    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Concurrencia Total</p>
                        <p id="activeReqVal" class="text-3xl font-black text-blue-400 mt-2">0</p>
                        <p class="text-[9px] text-slate-400 mt-2">
                            <span id="realVUsVal" class="text-yellow-400 font-bold">0</span> reales / 
                            <span id="simVUsVal" class="text-sky-400 font-bold">0</span> simulados
                        </p>
                    </div>

                    <!-- Latencia Media -->
                    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Latencia Media</p>
                        <p id="avgLatencyVal" class="text-3xl font-black text-indigo-400 mt-2">0 ms</p>
                        <span id="avgLatencySub" class="text-[9px] block mt-2 font-semibold">Cargando...</span>
                    </div>

                    <!-- Throughput -->
                    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Rendimiento (RPS)</p>
                        <p id="rpsVal" class="text-3xl font-black text-emerald-400 mt-2">0.0</p>
                        <p id="totalReqVal" class="text-[9px] text-slate-400 mt-2">Total: 0</p>
                    </div>

                    <!-- Tasa de Error -->
                    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Tasa de Error</p>
                        <p id="errorRateVal" class="text-3xl font-black text-rose-500 mt-2">0.0 %</p>
                        <p id="statusRate" class="text-[9px] text-rose-400 mt-2">Errores: 0</p>
                    </div>
                </div>

                <!-- Live Chart -->
                <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <h3 class="text-xs font-bold text-slate-200 mb-3 uppercase tracking-wider">Historial Latencia vs Concurrencia</h3>
                    <div class="h-80">
                        <canvas id="liveChart"></canvas>
                    </div>
                </div>

                <!-- Event Log -->
                <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <h3 class="text-xs font-bold text-slate-200 mb-3 uppercase tracking-wider">Eventos de Servidor Recientes</h3>
                    <div id="eventLogContainer" class="h-36 overflow-y-auto space-y-1.5 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
                    </div>
                </div>
            </div>

            <!-- Right Side: Explanation -->
            <div class="space-y-6">

                <!-- Server Architecture info -->
                <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 text-xs leading-relaxed">
                    <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">Estado del Servidor</h3>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400 font-semibold">Caché Redis:</span>
                        <span id="optCacheStatus" class="font-bold text-slate-500">Cargando...</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400 font-semibold">Índices MySQL:</span>
                        <span id="optDbStatus" class="font-bold text-slate-500">Cargando...</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400 font-semibold">Límite PHP-FPM:</span>
                        <span id="optFpmStatus" class="font-bold text-slate-500">Cargando...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Init chart
        const ctx = document.getElementById('liveChart').getContext('2d');
        const liveChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Latencia (ms)',
                        data: [],
                        borderColor: '#818cf8',
                        backgroundColor: 'rgba(129, 140, 248, 0.03)',
                        borderWidth: 2,
                        tension: 0.25,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Usuarios Concurrencia (VUs)',
                        data: [],
                        borderColor: '#38bdf8',
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        tension: 0.1,
                        yAxisID: 'y2'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 9 } }
                    },
                    y1: {
                        position: 'left',
                        grid: { color: 'rgba(71, 85, 105, 0.15)' },
                        ticks: { color: '#818cf8', font: { size: 9 } },
                        title: { display: true, text: 'Latencia (ms)', color: '#818cf8', font: { size: 9 } }
                    },
                    y2: {
                        position: 'right',
                        grid: { display: false },
                        ticks: { color: '#38bdf8', font: { size: 9 } },
                        title: { display: true, text: 'Usuarios Activos', color: '#38bdf8', font: { size: 9 } }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#cbd5e1', font: { size: 10 } } }
                }
            }
        });

        let lastReqCount = 0;
        let lastTime = Date.now();

        async function fetchStats() {
            try {
                const res = await fetch('/api/control/stats');
                const data = await res.json();
                
                const now = Date.now();
                const deltaReq = data.totalRequests - lastReqCount;
                const deltaTimeSec = (now - lastTime) / 1000;
                let currentRps = deltaReq / deltaTimeSec;
                if (currentRps < 0) currentRps = 0;
                
                lastReqCount = data.totalRequests;
                lastTime = now;

                document.getElementById('activeReqVal').innerText = data.activeRequests;
                document.getElementById('avgLatencyVal').innerText = data.avgLatency.toFixed(0) + ' ms';
                document.getElementById('totalReqVal').innerText = 'Total: ' + data.totalRequests;
                document.getElementById('errorRateVal').innerText = (data.errorRate * 100).toFixed(1) + ' %';
                document.getElementById('statusRate').innerText = 'Errores: ' + data.failedRequests;
                document.getElementById('rpsVal').innerText = currentRps.toFixed(1);
                
                document.getElementById('simVUsVal').innerText = data.simulatedVUs;
                document.getElementById('realVUsVal').innerText = data.realUsersCount;

                if (data.mode === 'optimized') {
                    document.getElementById('avgLatencySub').innerText = 'Redis Cache HIT';
                    document.getElementById('avgLatencySub').className = 'text-[9px] text-emerald-400 mt-2 font-semibold';
                    
                    document.getElementById('optCacheStatus').innerText = 'ACTIVO (Redis)';
                    document.getElementById('optCacheStatus').className = 'font-bold text-emerald-400';
                    document.getElementById('optDbStatus').innerText = 'INDEXADA';
                    document.getElementById('optDbStatus').className = 'font-bold text-emerald-400';
                    document.getElementById('optFpmStatus').innerText = 'pm.max_children = 60';
                    document.getElementById('optFpmStatus').className = 'font-bold text-emerald-400';
                } else {
                    document.getElementById('avgLatencySub').innerText = 'Table Scan en MySQL';
                    document.getElementById('avgLatencySub').className = 'text-[9px] text-rose-400 mt-2 font-semibold animate-pulse';
                    
                    document.getElementById('optCacheStatus').innerText = 'INACTIVO (Cache Miss)';
                    document.getElementById('optCacheStatus').className = 'font-bold text-rose-500';
                    document.getElementById('optDbStatus').innerText = 'SIN ÍNDICES (Slow)';
                    document.getElementById('optDbStatus').className = 'font-bold text-rose-500';
                    document.getElementById('optFpmStatus').innerText = 'pm.max_children = 20';
                    document.getElementById('optFpmStatus').className = 'font-bold text-rose-500';
                }

                // Update charts
                const timeLabel = new Date().toLocaleTimeString().substring(3, 8);
                liveChart.data.labels.push(timeLabel);
                liveChart.data.datasets[0].data.push(data.avgLatency);
                liveChart.data.datasets[1].data.push(data.activeRequests);
                
                if (liveChart.data.labels.length > 30) {
                    liveChart.data.labels.shift();
                    liveChart.data.datasets[0].data.shift();
                    liveChart.data.datasets[1].data.shift();
                }
                liveChart.update('none');

                // Update event log
                const logContainer = document.getElementById('eventLogContainer');
                logContainer.innerHTML = '';
                data.eventLog.forEach(log => {
                    let colorClass = 'text-slate-400';
                    let prefix = '[Sim]';
                    if (log.type === 'real_success') {
                        colorClass = 'text-yellow-300 font-bold bg-yellow-900/10 py-0.5 px-1 rounded border border-yellow-900/20';
                        prefix = '[REAL]';
                    } else if (log.type === 'real_error') {
                        colorClass = 'text-rose-400 font-extrabold bg-rose-950/20 py-0.5 px-1 rounded border border-rose-900/30';
                        prefix = '[REAL ER]';
                    } else if (log.type === 'sim_error') {
                        colorClass = 'text-rose-500/60';
                        prefix = '[Sim ER]';
                    } else if (log.type === 'system') {
                        colorClass = 'text-sky-400 font-bold';
                        prefix = '[SYS]';
                    }
                    
                    const div = document.createElement('div');
                    div.className = colorClass;
                    div.innerText = log.time + ' ' + prefix + ' ' + log.message;
                    logContainer.appendChild(div);
                });
                
            } catch (err) {
                console.error("Error fetching stats:", err);
            }
        }

        setInterval(fetchStats, 1000);
        fetchStats();
    </script>
</body>
</html>
`;

// 4. Student Enrollment Portal (`/matricula` - updated with direct retry, header links)
const studentPortalHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal de Matrícula Académica - IES HV4NTA</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
        body { font-family: 'Outfit', sans-serif; }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col justify-between p-4">
    <!-- Navbar -->
    <header class="w-full max-w-md mx-auto mb-4 flex justify-between items-center bg-slate-800/40 border border-slate-700/30 py-3 px-4 rounded-2xl">
        <a href="/" class="text-sm font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">IES HV4NTA</a>
        <a href="/dashboard" class="text-xs bg-slate-900 hover:bg-slate-950 text-indigo-400 font-semibold px-3 py-1.5 rounded-lg border border-slate-700/40 transition">
            Ver APM en Vivo
        </a>
    </header>

    <div class="w-full max-w-md mx-auto bg-slate-800 border border-slate-700/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-center">
        <!-- Background glows -->
        <div class="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

        <!-- Form State Card -->
        <div id="formState" class="relative z-10 w-full">
            <div class="text-center mb-5">
                <span class="bg-indigo-500/10 text-indigo-400 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-indigo-500/20 inline-block mb-2">Proceso de Admisión 2026-I</span>
                <h2 class="text-2xl font-black text-white">Ficha de Matrícula</h2>
                <p class="text-slate-400 text-xs mt-1 font-medium">Completa tus datos para separar vacantes de asignaturas</p>
            </div>

            <!-- Visor de Métricas del Servidor (Sincronizado) -->
            <div class="bg-slate-900/60 border border-slate-700/50 p-4 rounded-2xl mb-5 space-y-2.5">
                <div class="flex justify-between items-center">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado del Servidor (APM):</span>
                    <span id="srvModeBadge" class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-800 text-slate-400 transition-all duration-300">
                        Conectando...
                    </span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/30">
                        <span class="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">Concurrencia</span>
                        <span id="srvConcurrency" class="font-extrabold text-blue-400">0 VUs</span>
                    </div>
                    <div class="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/30">
                        <span class="text-slate-500 block text-[9px] uppercase tracking-wider font-semibold">Latencia Media</span>
                        <span id="srvLatency" class="font-extrabold text-indigo-400">0 ms</span>
                    </div>
                </div>
                <div class="border-t border-slate-700/30 pt-2 text-[9px] text-slate-500 space-y-1 font-mono">
                    <div class="flex justify-between">
                        <span>Base de Datos:</span>
                        <span id="srvDbState" class="text-slate-400 font-semibold">Cargando...</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Caché Redis:</span>
                        <span id="srvCacheState" class="text-slate-400 font-semibold">Cargando...</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Cola PHP-FPM:</span>
                        <span id="srvFpmState" class="text-slate-400 font-semibold">Cargando...</span>
                    </div>
                </div>
            </div>

            <form onsubmit="submitForm(event)" class="space-y-4">
                <!-- Name input -->
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nombre Completo:</label>
                    <input id="stuName" type="text" required placeholder="Ej. Juan Pérez" class="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-xl py-2.5 px-4 text-sm text-slate-200 placeholder:text-slate-600 transition">
                </div>

                <!-- Student ID input -->
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">DNI o Código de Estudiante:</label>
                    <input id="stuId" type="text" required maxLength="8" placeholder="Ej. 73491823" class="w-full bg-slate-900/60 border border-slate-700 focus:border-indigo-500 focus:outline-none rounded-xl py-2.5 px-4 text-sm text-slate-200 placeholder:text-slate-600 font-mono transition">
                </div>

                <!-- Courses Checkboxes -->
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Selecciona Cursos a Matricular:</label>
                    <div class="space-y-2">
                        <label class="flex items-center space-x-3 bg-slate-900/30 hover:bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 cursor-pointer transition">
                            <input type="checkbox" name="courses" value="101" checked class="w-4 h-4 text-indigo-500 rounded bg-slate-900 border-slate-700 focus:ring-indigo-500">
                            <div class="text-xs">
                                <span class="font-bold block text-slate-200">Diseño Web Avanzado</span>
                                <span class="text-[10px] text-slate-500">Programa: Diseño Web | Vacantes: 30</span>
                            </div>
                        </label>
                        <label class="flex items-center space-x-3 bg-slate-900/30 hover:bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 cursor-pointer transition">
                            <input type="checkbox" name="courses" value="102" checked class="w-4 h-4 text-indigo-500 rounded bg-slate-900 border-slate-700 focus:ring-indigo-500">
                            <div class="text-xs">
                                <span class="font-bold block text-slate-200">Pruebas de Software Automatizadas</span>
                                <span class="text-[10px] text-slate-500">Programa: Pruebas de Software | Vacantes: 25</span>
                            </div>
                        </label>
                        <label class="flex items-center space-x-3 bg-slate-900/30 hover:bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 cursor-pointer transition">
                            <input type="checkbox" name="courses" value="105" checked class="w-4 h-4 text-indigo-500 rounded bg-slate-900 border-slate-700 focus:ring-indigo-500">
                            <div class="text-xs">
                                <span class="font-bold block text-slate-200">Programación Backend en Node.js</span>
                                <span class="text-[10px] text-slate-500">Programa: Diseño Web | Vacantes: 15</span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Submit Button -->
                <button type="submit" class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/10 mt-2">
                    Enviar Ficha de Matrícula
                </button>
            </form>
        </div>

        <!-- Loading State Card -->
        <div id="loadingState" class="hidden text-center py-10 relative z-10 flex flex-col items-center w-full">
            <!-- Spinner -->
            <div class="relative w-20 h-20 mb-6">
                <div class="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                <div class="absolute inset-0 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
            </div>
            
            <h3 class="text-xl font-bold text-white mb-2">Procesando Matrícula...</h3>
            <p id="statusMsg" class="text-xs text-slate-400 font-medium">Conectando al servidor...</p>
            
            <!-- Real-time stopwatch -->
            <div class="bg-slate-900/60 px-4 py-2 rounded-xl mt-6 border border-slate-800">
                <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Tiempo Transcurrido</span>
                <span id="elapsedTime" class="text-2xl font-black text-indigo-400 font-mono">0.00s</span>
            </div>
        </div>

        <!-- Success Result Card -->
        <div id="successState" class="hidden text-center py-6 relative z-10 w-full">
            <!-- Icon -->
            <div class="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
            </div>
            
            <h3 class="text-2xl font-extrabold text-emerald-400 mb-1">¡Matrícula Exitosa!</h3>
            <p class="text-xs text-slate-400 mb-6">El sistema registró tu ficha sin inconvenientes.</p>
            
            <!-- Details -->
            <div class="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/40 text-left text-xs space-y-2.5 mb-6 font-mono">
                <div><span class="text-slate-500">Estudiante:</span> <span id="resStuName" class="text-slate-200 font-semibold"></span></div>
                <div><span class="text-slate-500">Código/DNI:</span> <span id="resStuId" class="text-slate-200"></span></div>
                <div><span class="text-slate-500">ID Registro:</span> <span id="resCode" class="text-indigo-400 font-bold"></span></div>
                <div><span class="text-slate-500">Tiempo Servidor:</span> <span id="resTime" class="text-emerald-400 font-bold"></span></div>
            </div>

            <button onclick="backToForm()" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl text-xs transition">
                Enviar Otra Ficha
            </button>
        </div>

        <!-- Error Result Card -->
        <div id="errorState" class="hidden text-center py-6 relative z-10 w-full">
            <!-- Icon -->
            <div class="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
            
            <h3 id="errTitle" class="text-2xl font-extrabold text-rose-500 mb-1">Error de Conexión</h3>
            <p id="errDesc" class="text-xs text-slate-400 px-4 mb-6 leading-relaxed">
                El servidor no respondió a tiempo debido a la alta demanda.
            </p>
            
            <!-- Diagnostic -->
            <div class="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/40 text-left text-xs space-y-2 mb-6 font-mono">
                <div class="text-slate-500 block uppercase font-bold text-[9px] mb-1">Detalle del Cuello de Botella:</div>
                <p id="errDiagnostic" class="text-rose-400 font-semibold leading-relaxed font-semibold">
                    Las conexiones entrantes al servidor superaron el límite de pm.max_children = 20. El servidor web Nginx retornó Gateway Timeout.
                </p>
                <div><span class="text-slate-500">Tiempo transcurrido:</span> <span id="errTime" class="text-rose-400 font-bold"></span></div>
            </div>

            <!-- Direct Retry Button -->
            <button onclick="retryEnrollment()" class="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-rose-500/15">
                Reintentar Matrícula Directamente
            </button>
            <button onclick="backToForm()" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 rounded-xl text-xs transition mt-2.5">
                Modificar Datos / Volver
            </button>
        </div>
    </div>

    <!-- Small Footer -->
    <footer class="text-center text-[10px] text-slate-600 mt-4">
        IES HV4NTA - Pruebas de Software - 2026
    </footer>

    <script>
        let startTime = 0;
        let timerInterval = null;
        let cachedEnrollmentData = null; // Store data for direct retries

        function submitForm(event) {
            event.preventDefault();
            
            const stuName = document.getElementById('stuName').value;
            const stuId = document.getElementById('stuId').value;
            const checkedCourses = Array.from(document.querySelectorAll('input[name="courses"]:checked')).map(el => parseInt(el.value));
            
            // Cache data in case of retries
            cachedEnrollmentData = {
                name: stuName,
                id: stuId,
                courses: checkedCourses
            };
            
            executeEnrollment(stuName, stuId, checkedCourses);
        }

        function retryEnrollment() {
            // Hide error card, show loading card directly
            document.getElementById('errorState').classList.add('hidden');
            document.getElementById('loadingState').classList.remove('hidden');
            
            if (cachedEnrollmentData) {
                executeEnrollment(cachedEnrollmentData.name, cachedEnrollmentData.id, cachedEnrollmentData.courses);
            } else {
                backToForm();
            }
        }

        function executeEnrollment(stuName, stuId, courses) {
            // Switch UI state to loading (if coming from form)
            document.getElementById('formState').classList.add('hidden');
            document.getElementById('loadingState').classList.remove('hidden');
            
            startTime = Date.now();
            document.getElementById('elapsedTime').innerText = "0.00s";
            
            // Start stopwatch and infrastructure messages
            timerInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                document.getElementById('elapsedTime').innerText = (elapsed / 1000).toFixed(2) + 's';
                
                let msg = "Enviando solicitud...";
                if (elapsed > 300) msg = "En cola en el servidor web (PHP-FPM)...";
                if (elapsed > 1500) msg = "Ejecutando consulta SQL en MySQL (Table Scan)...";
                if (elapsed > 3500) msg = "Base de datos bloqueada. Esperando liberación de conexiones...";
                if (elapsed > 6000) msg = "Espera prolongada. Límite de Gateway Timeout acercándose...";
                document.getElementById('statusMsg').innerText = msg;
            }, 40);

            // Execute POST Request
            fetch('/api/matricula/guardar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Student-Id': stuId,
                    'X-Student-Name': encodeURIComponent(stuName)
                },
                body: JSON.stringify({
                    estudiante_id: parseInt(stuId) || 1234,
                    cursos: courses
                })
            })
            .then(async res => {
                clearInterval(timerInterval);
                const durationMs = Date.now() - startTime;
                const elapsedSec = (durationMs / 1000).toFixed(2) + 's';

                if (res.status === 201) {
                    const data = await res.json();
                    // Success View
                    document.getElementById('resStuName').innerText = stuName;
                    document.getElementById('resStuId').innerText = stuId;
                    document.getElementById('resCode').innerText = data.codigo_registro;
                    document.getElementById('resTime').innerText = durationMs + ' ms';
                    
                    document.getElementById('loadingState').classList.add('hidden');
                    document.getElementById('successState').classList.remove('hidden');
                } else {
                    // Error View
                    document.getElementById('errTitle').innerText = 'Error HTTP ' + res.status;
                    document.getElementById('errTime').innerText = elapsedSec;
                    
                    if (res.status === 504) {
                        document.getElementById('errDesc').innerText = 'El servidor web Nginx agotó el tiempo de espera al comunicarse con PHP-FPM.';
                        document.getElementById('errDiagnostic').innerText = 'Los hilos de PHP-FPM (pm.max_children = 20) se colmaron por completo debido a consultas MySQL lentas bloqueantes. La petición fue descartada.';
                    } else if (res.status === 500) {
                        document.getElementById('errDesc').innerText = 'Fallo crítico del servidor de base de datos MySQL.';
                        document.getElementById('errDiagnostic').innerText = 'MySQL excedió el tiempo máximo de espera para la reserva de bloqueo de registros (Lock Wait Timeout Exceeded) por concurrencia masiva.';
                    } else {
                        document.getElementById('errDesc').innerText = 'Error inesperado del servidor de matrícula.';
                        document.getElementById('errDiagnostic').innerText = 'Error interno en la capa de procesamiento Laravel.';
                    }

                    document.getElementById('loadingState').classList.add('hidden');
                    document.getElementById('errorState').classList.remove('hidden');
                }
            })
            .catch(err => {
                clearInterval(timerInterval);
                const durationMs = Date.now() - startTime;
                const elapsedSec = (durationMs / 1000).toFixed(2) + 's';

                document.getElementById('errTitle').innerText = 'Error de Red';
                document.getElementById('errTime').innerText = elapsedSec;
                document.getElementById('errDesc').innerText = 'La petición de matrícula no pudo ser completada por desconexión del servidor.';
                document.getElementById('errDiagnostic').innerText = 'La conexión TCP se canceló de forma abrupta por desbordamiento del buffer del puerto (Socket Connection Refused).';

                document.getElementById('loadingState').classList.add('hidden');
                document.getElementById('errorState').classList.remove('hidden');
            });
        }

        function backToForm() {
            document.getElementById('successState').classList.add('hidden');
            document.getElementById('errorState').classList.add('hidden');
            document.getElementById('formState').classList.remove('hidden');
        }

        // Poll server metrics in real-time
        async function fetchServerStats() {
            try {
                // Pass current student credentials in headers if they have typed them,
                // so the server knows this specific student is active!
                const headers = { 'Content-Type': 'application/json' };
                const stuIdInput = document.getElementById('stuId').value;
                const stuNameInput = document.getElementById('stuName').value;
                if (stuIdInput) {
                    headers['X-Student-Id'] = stuIdInput;
                    headers['X-Student-Name'] = encodeURIComponent(stuNameInput || 'Real');
                }

                const res = await fetch('/api/control/stats', { headers });
                const data = await res.json();
                
                document.getElementById('srvConcurrency').innerText = data.activeRequests + ' VUs';
                document.getElementById('srvLatency').innerText = Math.round(data.avgLatency) + ' ms';
                
                const badge = document.getElementById('srvModeBadge');
                if (data.mode === 'optimized') {
                    badge.innerText = 'OPTIMIZADO';
                    badge.className = 'px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/25';
                    
                    document.getElementById('srvDbState').innerHTML = '<span class="text-emerald-400 font-semibold">Indexada (B-Tree Search)</span>';
                    document.getElementById('srvCacheState').innerHTML = '<span class="text-emerald-400 font-semibold">Habilitada (Redis HIT 100%)</span>';
                    document.getElementById('srvFpmState').innerHTML = '<span class="text-emerald-400 font-semibold">Liberada (0% cola)</span>';
                } else {
                    badge.innerText = 'SIN OPTIMIZAR';
                    badge.className = 'px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/25 animate-pulse';
                    
                    if (data.activeRequests > 40) {
                        document.getElementById('srvDbState').innerHTML = '<span class="text-rose-500 font-bold animate-pulse">COLAPSO (Table Lock)</span>';
                        document.getElementById('srvCacheState').innerHTML = '<span class="text-rose-500">Apagada (Cache MISS)</span>';
                        document.getElementById('srvFpmState').innerHTML = '<span class="text-rose-500 font-bold animate-pulse">Pool Agotado (100% cola)</span>';
                    } else if (data.activeRequests > 15) {
                        document.getElementById('srvDbState').innerHTML = '<span class="text-yellow-400">Saturada (Full Table Scan)</span>';
                        document.getElementById('srvCacheState').innerHTML = '<span class="text-rose-500">Apagada (Cache MISS)</span>';
                        document.getElementById('srvFpmState').innerHTML = '<span class="text-yellow-400">Congestión (80% cola)</span>';
                    } else {
                        document.getElementById('srvDbState').innerHTML = '<span class="text-yellow-500">Lenta (Full Table Scan)</span>';
                        document.getElementById('srvCacheState').innerHTML = '<span class="text-rose-500">Apagada (Cache MISS)</span>';
                        document.getElementById('srvFpmState').innerHTML = '<span class="text-slate-400">Normal (0% cola)</span>';
                    }
                }
            } catch (err) {
                console.error("Error fetching srv stats:", err);
            }
        }
        
        setInterval(fetchServerStats, 1500);
        fetchServerStats();
    </script>
</body>
</html>
`;

// HTTP Server Definition
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    
    // Check if the request is from a real user by reading student ID headers
    const studentId = req.headers['x-student-id'] || parsedUrl.query.studentId;
    const studentName = decodeURIComponent(req.headers['x-student-name'] || parsedUrl.query.studentName || '');
    const isReal = studentId !== undefined;
    
    if (isReal) {
        recordRealUserActivity(studentId, studentName);
    }
    
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

    // Router
    if (path === '/' && req.method === 'GET') {
        // Welcome Landing Page
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(landingPageHtml);
        stats.totalRequests = Math.max(0, stats.totalRequests - 1);
        stats.activeRequests = Math.max(0, stats.activeRequests - 1);
    } 
    
    else if (path === '/matricula' && req.method === 'GET') {
        // Student LAN Client UI
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(studentPortalHtml);
        stats.totalRequests = Math.max(0, stats.totalRequests - 1);
        stats.activeRequests = Math.max(0, stats.activeRequests - 1);
    }

    else if (path === '/dashboard' && req.method === 'GET') {
        // Read-only Public View for Students
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(publicDashboardHtml);
        stats.totalRequests = Math.max(0, stats.totalRequests - 1);
        stats.activeRequests = Math.max(0, stats.activeRequests - 1);
    }

    else if (path === '/admin' && req.method === 'GET') {
        // Protected Admin View for Teacher/Projector
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(adminDashboardHtml);
        stats.totalRequests = Math.max(0, stats.totalRequests - 1);
        stats.activeRequests = Math.max(0, stats.activeRequests - 1);
    }

    else if (path === '/api/control/stats' && req.method === 'GET') {
        // Fetch active real users count dynamically
        const realCount = getActiveRealUsersCount();
        
        const avg = stats.latencySamples.length > 0 
            ? stats.latencySamples.reduce((a, b) => a + b, 0) / stats.latencySamples.length 
            : 0;
        const errRate = stats.totalRequests > 0 ? stats.failedRequests / stats.totalRequests : 0;
        
        sendJson(res, 200, {
            mode: globalMode,
            totalRequests: stats.totalRequests - 1,
            successfulRequests: stats.successfulRequests,
            failedRequests: stats.failedRequests,
            activeRequests: stats.activeRequests - 1,
            avgLatency: avg,
            errorRate: errRate,
            simulatedVUs: simulatedVUs,
            realUsersCount: realCount,
            eventLog: eventLog
        });
        
        stats.totalRequests = Math.max(0, stats.totalRequests - 2);
        stats.activeRequests = Math.max(0, stats.activeRequests - 1);
    } 
    
    else if (path === '/api/control/toggle' && req.method === 'POST') {
        globalMode = globalMode === 'unoptimized' ? 'optimized' : 'unoptimized';
        logEvent('system', `Modo del servidor cambiado a: ${globalMode.toUpperCase()}`);
        sendJson(res, 200, { mode: globalMode });
        
        stats.totalRequests = Math.max(0, stats.totalRequests - 1);
        stats.activeRequests = Math.max(0, stats.activeRequests - 1);
    } 
    
    else if (path === '/api/control/set-vus' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                simulatedVUs = Math.min(1000, Math.max(0, parseInt(data.vus) || 0)); // Cap at 1000 simulated VUs
                logEvent('system', `Background simulated VUs ajustados a: ${simulatedVUs}`);
                sendJson(res, 200, { simulatedVUs: simulatedVUs });
            } catch(e) {
                sendJson(res, 400, { error: 'Invalid JSON' });
            }
        });
    }

    else if (path === '/api/control/reset' && req.method === 'POST') {
        resetStats();
        sendJson(res, 200, { reset: true });
    }
    
    // --- TARGET PORTAL ENDPOINTS ---
    else if (path === '/api/auth/login' && req.method === 'POST') {
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
                // Return 504 instantly under load to prevent memory leak
                setTimeout(() => {
                    finalizeRequest('error', 504);
                    res.writeHead(504, { 'Content-Type': 'text/plain' });
                    res.end("504 Gateway Timeout: PHP-FPM pool queue exhausted.");
                }, 300);
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
                    { id: 104, font: "bold", nombre: "Gestión de Configuración y CI/CD", carrera: "Pruebas de Software", vacantes: 18, semestre: "2026-I" },
                    { id: 105, nombre: "Programación Backend en Node.js", carrera: "Diseño y Programación Web", vacantes: 15, semestre: "2026-I" }
                ]);
            }, cacheDelay);
        }
    } 
    
    else if (path === '/api/matricula/guardar' && req.method === 'POST') {
        if (globalMode === 'unoptimized') {
            const currentVUs = stats.activeRequests;
            
            if (currentVUs > 45) {
                setTimeout(() => {
                    finalizeRequest('error', 500);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end("500 Internal Server Error: Connection abort by MySQL Lock Timeout.");
                }, 300);
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
    console.log(`       SIMULADOR REAL DE MATRÍCULA INTERACTIVA: IES HV4NTA`);
    console.log(`==================================================================`);
    console.log(` Servidor levantado en RED LOCAL:    http://${LAN_IP}:${PORT}`);
    console.log(`\n Pantallas de Presentación en Vivo:`);
    console.log(`   👉 Página de Inicio (Landing):     http://localhost:${PORT}/`);
    console.log(`   👉 Monitor APM Proyector (Admin): http://localhost:${PORT}/admin`);
    console.log(`   👉 Monitor APM Público (Alumnos): http://localhost:${PORT}/dashboard`);
    console.log(`   👉 Portal de Matrícula Alumnos:  ${LAN_MATRICULA_URL}`);
    console.log(`==================================================================`);
});
