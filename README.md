# 🎓 Simulador Interactivo de Pruebas de Carga y Rendimiento - Matrícula IES HV4NTA

Este proyecto es un entorno educativo interactivo diseñado para el ámbito de **Diseño y Programación Web** y **Pruebas de Software**. Su objetivo principal es simular de forma empírica y en tiempo real el comportamiento, colapso y optimización de una aplicación web bajo carga masiva de usuarios concurrentes.

El proyecto permite realizar una **demostración interactiva en vivo** en el aula, donde **X cantidad de estudiantes reales** pueden acceder al servidor local desde sus dispositivos móviles (vía Wi-Fi/LAN) y experimentan de primera mano la lentitud y los errores HTTP (504/500), para luego observar la recuperación instantánea del sistema tras aplicar optimizaciones arquitectónicas.

---

## 🚀 Arquitectura del Simulador

El sistema está desarrollado en **Node.js** con cero dependencias externas, haciéndolo 100% portable y fácil de ejecutar. Reclica las siguientes capas lógicas:

1. **Servidor Backend y APM (`matricula_server.js`)**:
   - **Simulación No Optimizada (Línea Base)**: Emula el comportamiento de una base de datos MySQL sin índices (búsqueda secuencial $O(N)$) y un servidor PHP-FPM saturado (límite de procesos `pm.max_children = 20`). A mayor concurrencia, la latencia aumenta exponencialmente y se arrojan errores **HTTP 504 Gateway Timeout**.
   - **Simulación Optimizada (Redis + Índices)**: Emula la indexación del motor SQL (búsqueda en árbol balanceado $O(\log N)$) y el almacenamiento en caché en memoria con Redis (Cache Hit). Las peticiones se despachan de forma instantánea en menos de 30ms.
   - **Generador Interno de Carga (VUs)**: Un motor interno que genera usuarios virtuales en segundo plano ajustables mediante un slider en tiempo real (admite **de 0 a 1000 usuarios concurrentes**).
   - **Validación Real de Concurrencia**: Rastrea usuarios reales únicos en el servidor mediante un mapeo de hilos activos y DNI de estudiantes, filtrando las peticiones de bots simulados.
    - **Múltiples Portales Integrados**:
      - **Página de Inicio (`/`)**: Carga el archivo `views/index.html` de bienvenida con botones de navegación.
      - **Portal de Alumnos (`/matricula`)**: Interfaz móvil optimizada para que los alumnos reales envíen fichas de matrícula y observen en vivo el estado del servidor (APM cliente) y reintenten transacciones de forma directa en caso de error.
      - **Dashboard Público (`/dashboard`)**: Monitor APM de solo lectura (sin controles) para que los alumnos vigilen los gráficos generales de rendimiento desde sus propios dispositivos.
      - **Consola de Administración (`/admin`)**: Consola del docente para alternar optimizaciones, inyectar cargas concurrentes de fondo (hasta 1000 VUs) y aplicar presets.

2. **Inyector de Tráfico Externo (`scripts/load_tester.js`)**:
   - Inyector de concurrencia pura en Node.js que simula usuarios concurrentes haciendo peticiones en bucle y genera reportes detallados con percentiles (p50, p90, p95, p99), Throughput (RPS) y desglose de códigos de error.

3. **Script de Pruebas de Carga de Referencia (`scripts/k6_script.js`)**:
   - Script oficial en formato JavaScript compatible con **Grafana k6** para ejecuciones profesionales basadas en SLAs y thresholds.

---

## 🛠️ Requisitos e Instalación (Paso a Paso)

Sigue estos sencillos pasos para clonar, inicializar y ejecutar el simulador en tu computadora:

### 1. Clonar el Repositorio
Abre tu terminal preferida (PowerShell, Git Bash o Símbolo del Sistema) y ejecuta el siguiente comando para descargar el proyecto en tu equipo:
```bash
git clone https://github.com/tu-usuario/pruebas-rendimiento-ieshv4nta.git
```

### 2. Ingresar a la Carpeta del Proyecto
Navega dentro del directorio descargado:
```bash
cd pruebas-rendimiento-ieshv4nta
```

### 3. Comprobar la Instalación de Node.js
Este simulador está desarrollado utilizando módulos nativos de Node.js, por lo que **no requiere ejecutar `npm install`**. Únicamente necesitas contar con Node.js instalado (versión 18 o superior). Verifica que esté listo con:
```bash
node --version
```
*(Si no tienes Node.js, puedes descargarlo de forma gratuita desde [nodejs.org](https://nodejs.org/)).*

### 4. Inicializar y Ejecutar el Servidor de Matrícula
Levanta el simulador ejecutando el archivo principal del backend:
```bash
node matricula_server.js
```

Verás una salida en consola confirmando que el servidor está activo, detectando automáticamente tu dirección de IP de red local (LAN):
```text
==================================================================
       SIMULADOR REAL DE MATRÍCULA INTERACTIVA: IES HV4NTA
==================================================================
 Servidor levantado en RED LOCAL:    http://<TU_IP_LOCAL>:3000

 Pantallas de Presentación en Vivo:
   👉 Página de Inicio (Landing):     http://localhost:3000/
   👉 Monitor APM Proyector (Admin): http://localhost:3000/admin
   👉 Monitor APM Público (Alumnos): http://localhost:3000/dashboard
   👉 Portal de Matrícula Alumnos:  http://<TU_IP_LOCAL>:3000/matricula
==================================================================
```
*Deja esta terminal abierta ejecutándose durante toda la exposición en vivo.*

---

## 👨‍🏫 Guía Práctica de Presentación en el Aula (Paso a Paso)

Para llevar la simulación a cabo en medio de una exposición de clase ante el docente **Ing. Alegría Core, Cristhian** y tus compañeros de curso, sigue esta dinámica interactiva:

### Paso 1: Configurar la Escena
1. Proyecta la **Consola de Administración** (`http://localhost:3000/admin`) en la pantalla principal del aula.
2. Pide a tus compañeros de clase (hasta 30 personas) que se conecten al mismo Wi-Fi del salón y **escaneen el código QR** de la consola para ingresar al **Portal de Matrícula** (`/matricula`).
3. Pídeles que completen sus datos en el formulario (Nombre y DNI/ID), pero que **aún no envíen el formulario**.
4. Pídeles que observen el visor de métricas superior en sus pantallas: verán el estado inicial del servidor en verde u oscuro (`Normal`, `Redis HIT`).

### Paso 2: Simulación de Tránsito Normal
1. En el panel de control de administración, haz clic en el preset **"Tránsito Bajo"** (Modo Optimizado + 10 VUs).
2. Pide a 3 o 4 alumnos que envíen sus matrículas.
3. **Resultado**: Sus registros se procesarán inmediatamente en 20-30ms (Redis Cache Hit). El visor en sus celulares mostrará latencia baja y estado de bases de datos óptimo.

### Paso 3: Día de Matrícula Oficial - Colapso Masivo (Sin Optimizar)
1. En la consola del proyector, haz clic en el preset **"Pico Lento (Colapso)"**. Esto cambia el servidor a **Modo Sin Optimizar** e inyecta automáticamente **150 usuarios simulados de fondo**.
2. El visor en los celulares de los alumnos cambiará instantáneamente a rojo parpadeante: **`SIN OPTIMIZAR`** con latencias superiores a 3 segundos, alertando de `COLAPSO (Table Lock)` y `Pool Agotado (100% cola)`.
3. **Pide a toda la clase que presione "Enviar Ficha de Matrícula" simultáneamente.**
4. **Mecánica de Reintento Directo**: 
   - El envío fallará con errores **HTTP 504** o **HTTP 500**.
   - Los alumnos verán un gran botón rojo que dice **"Reintentar Matrícula Directamente"** y un botón secundario para volver al formulario.
   - Pídeles que presionen repetidamente el botón **"Reintentar Matrícula Directamente"**. Esto saltará el formulario e inyectará reintentos HTTP inmediatos con sus credenciales cacheadas, emulando la desesperación real de los usuarios en una web lenta.
   - En el proyector, verás cómo suben las peticiones concurrentes y los eventos de error real aparecen resaltados en amarillo y rojo.

### Paso 4: Activando la Optimización (Redis)
1. Con la clase spameando reintentos y el sistema caído, haz clic en **"Optimizado"** (o aplica el preset **"Pico Optimizado"** con 500 VUs).
2. Pide a los alumnos que presionen el botón de reintento una vez más.
3. **Resultado**: Los reintentos se procesarán inmediatamente en menos de 30 milisegundos. Verán aparecer sus confirmaciones verdes con código de registro y el APM reflejará una caída instantánea de latencia, comprobando la efectividad de las arquitecturas de caché y el correcto indexado.

---

## 📈 Pruebas de Carga Complementarias por Consola

Si deseas realizar mediciones estadísticas formales desde la consola para tu reporte escrito o demostración individual, puedes abrir una **segunda terminal** en el directorio del proyecto y utilizar los inyectores adjuntos:

### Inyector Incorporado (`scripts/load_tester.js`)
* **Para probar el sistema sin optimizar**:
  ```bash
  node scripts/load_tester.js
  ```
* **Para probar el sistema optimizado**:
  ```bash
  node scripts/load_tester.js --optimized
  ```

### Inyector Profesional Grafana k6 (`scripts/k6_script.js`)
Si tienes instalado k6 en tu equipo de desarrollo, puedes correr la simulación oficial mediante:
```bash
k6 run scripts/k6_script.js
```

---

## 🚀 Próximos Pasos: Recomendaciones para el Siguiente Nivel

Para subir este proyecto a GitHub y presentarlo como un portafolio de ingeniería de calidad y DevOps de nivel profesional, te sugerimos implementar las siguientes mejoras:

1. **Dockerización**:
   - Crear un archivo `Dockerfile` y un `docker-compose.yml` para levantar la arquitectura real con contenedores separados para el servidor Nginx, la app Laravel/Node, una base de datos MySQL real y una instancia de Redis Cache.
2. **Integrar Bases de Datos y Redis Verdaderos**:
   - Modificar la lógica para que en vez de emular retrasos con `setTimeout`, el servidor ejecute consultas SQL complejas en una base de datos real con millones de filas y use un cliente Redis oficial. Esto permitirá medir el impacto real de no poseer índices (usando sentencias `EXPLAIN` en MySQL).
3. **Monitoreo Profesional (Prometheus + Grafana)**:
   - Configurar la exportación de métricas de Node.js a formato Prometheus y diseñar un Dashboard personalizado en Grafana para visualizar la saturación de CPU, memoria y la tasa de peticiones de manera profesional.
4. **Pipelines de Integración Continua (CI/CD)**:
   - Configurar un flujo de **GitHub Actions** que levante el servidor web de matrícula en un runner temporal y ejecute pruebas de carga automatizadas con **k6-gh-action**. Define umbrales de fallo (SLAs) de modo que el pipeline falle si un commit introduce una regresión de rendimiento.
