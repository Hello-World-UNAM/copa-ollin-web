import { crearMultipartSprint04 } from '../tests/fixtures/sprint04/registro';

const TARGET = process.env.TARGET_URL || 'http://127.0.0.1:4337';
const MODO_REAL = process.env.MODO_REAL === 'true';
const CONSENTIMIENTO = process.env.CONFIRMAR_EJECUCION_REAL === 'true';

// 1. Validacion estricta de destino para no atacar produccion por accidente
const isLocal = TARGET.includes('127.0.0.1') || TARGET.includes('localhost');
if (!isLocal && (!MODO_REAL || !CONSENTIMIENTO)) {
  console.error(
    'BLOQUEO DE SEGURIDAD: Para lanzar cargas a destinos remotos debes pasar MODO_REAL=true y CONFIRMAR_EJECUCION_REAL=true explicitamente.',
  );
  process.exit(1);
}

// 2. Token flexible
const TOKEN = process.env.API_TOKEN || 'sandbox-token-predeterminado';

interface Resultado {
  tipo: 'GET' | 'POST';
  status: number | 'TRANSPORT_ERROR' | 'TIMEOUT';
  tiempo: number;
  esExito: boolean;
}

async function simularVisitante(): Promise<Resultado> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s limite

  const inicio = performance.now();
  try {
    const res = await fetch(`${TARGET}/registro`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    await res.text();
    return {
      tipo: 'GET',
      status: res.status,
      tiempo: performance.now() - inicio,
      esExito: res.status === 200,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const esTimeout = error instanceof Error && error.name === 'AbortError';
    return {
      tipo: 'GET',
      status: esTimeout ? 'TIMEOUT' : 'TRANSPORT_ERROR',
      tiempo: performance.now() - inicio,
      esExito: false,
    };
  }
}

async function simularEnvio(indice: number): Promise<Resultado> {
  // 3. Preparar el multipart ANTES de iniciar el cronometro
  const form = await crearMultipartSprint04();

  // 4. Asegurar IDs unicos en cada ejecucion
  form.set('transactionId', `reg-carga-ficticia-${Date.now()}-${indice}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s limite

  const inicio = performance.now();
  try {
    const res = await fetch(`${TARGET}/api/register`, {
      method: 'POST',
      headers: { authorization: `Bearer ${TOKEN}` },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: form as any,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    let esExito = false;

    // 7. Validar el contenido real de la respuesta, no solo el codigo 200
    if (res.status === 200) {
      const data = await res.json();
      esExito = data.code === 'SAVED' || data.code === 'DUPLICATE';
    } else {
      await res.text();
    }

    return {
      tipo: 'POST',
      status: res.status,
      tiempo: performance.now() - inicio,
      esExito,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const esTimeout = error instanceof Error && error.name === 'AbortError';
    return {
      tipo: 'POST',
      status: esTimeout ? 'TIMEOUT' : 'TRANSPORT_ERROR',
      tiempo: performance.now() - inicio,
      esExito: false,
    };
  }
}

function calcularPercentiles(tiempos: number[]) {
  if (tiempos.length === 0) return { p50: 0, p95: 0, p99: 0 };
  tiempos.sort((a, b) => a - b);
  return {
    p50: tiempos[Math.floor(tiempos.length * 0.5)] ?? 0,
    p95: tiempos[Math.floor(tiempos.length * 0.95)] ?? 0,
    p99: tiempos[Math.floor(tiempos.length * 0.99)] ?? 0,
  };
}

async function iniciarHarness() {
  console.log(`Iniciando harness de carga hacia target: ${TARGET}`);

  // 5. Separar ejecucion en fases secuenciales para no saturar la red local
  console.log(`\n--- FASE 1: Simulando 500 visitantes (GET) ---`);
  const visitantes = Array.from({ length: 500 }, () => simularVisitante());
  const resultadosGet = await Promise.all(visitantes);

  console.log(`--- FASE 2: Simulando 100 envios simultaneos (POST) ---`);
  const envios = Array.from({ length: 100 }, (_, i) => simularEnvio(i));
  const resultadosPost = await Promise.all(envios);

  // 8. Reporte detallado para GET y POST separando tipos de error
  function imprimirReporte(resultados: Resultado[], tipo: 'GET' | 'POST') {
    const exitos = resultados.filter((r) => r.esExito);
    const fallos = resultados.filter((r) => !r.esExito);
    const timeouts = fallos.filter((r) => r.status === 'TIMEOUT');
    const erroresTransporte = fallos.filter(
      (r) => r.status === 'TRANSPORT_ERROR',
    );
    const erroresHttp = fallos.filter((r) => typeof r.status === 'number');
    const latencias = calcularPercentiles(resultados.map((r) => r.tiempo));

    console.log(`\n=== REPORTE ${tipo} ===`);
    console.log(`Exitosos: ${exitos.length}/${resultados.length}`);
    console.log(`Fallidos: ${fallos.length}`);
    if (fallos.length > 0) {
      console.log(`  - HTTP Errors: ${erroresHttp.length}`);
      console.log(`  - Timeouts (limite excedido): ${timeouts.length}`);
      console.log(
        `  - Transport Errors (conexion rechazada): ${erroresTransporte.length}`,
      );
    }
    console.log(`Latencias (ms):`);
    console.log(`  - p50: ${latencias.p50.toFixed(2)} ms`);
    console.log(`  - p95: ${latencias.p95.toFixed(2)} ms`);
    console.log(`  - p99: ${latencias.p99.toFixed(2)} ms`);
  }

  imprimirReporte(resultadosGet, 'GET');
  imprimirReporte(resultadosPost, 'POST');
}

iniciarHarness();
