import { crearMultipartSprint04 } from '../tests/fixtures/sprint04/registro';
import { tokenSandboxE2e } from '../tests/fixtures/registro';

const TARGET = process.env.TARGET_URL || 'http://127.0.0.1:4337';
const MODO_REAL = process.env.MODO_REAL === 'true';
const CONSENTIMIENTO = process.env.CONFIRMAR_EJECUCION_REAL === 'true';

if (MODO_REAL && !CONSENTIMIENTO) {
  console.error(
    'BLOQUEO DE SEGURIDAD: Para lanzar cargas en modo real debes pasar CONFIRMAR_EJECUCION_REAL=true explicitamente.',
  );
  process.exit(1);
}

interface Resultado {
  tipo: 'GET' | 'POST';
  status: number;
  tiempo: number;
  error?: unknown;
}

async function simularVisitante(): Promise<Resultado> {
  const inicio = performance.now();
  try {
    const res = await fetch(`${TARGET}/registro`);
    await res.text(); // Liberar la conexion de red
    return {
      tipo: 'GET',
      status: res.status,
      tiempo: performance.now() - inicio,
    };
  } catch (error) {
    return {
      tipo: 'GET',
      status: 500,
      tiempo: performance.now() - inicio,
      error,
    };
  }
}

async function simularEnvio(indice: number): Promise<Resultado> {
  const inicio = performance.now();
  try {
    const form = await crearMultipartSprint04();
    form.set('transactionId', `reg-carga-ficticia-${indice}`);

    const res = await fetch(`${TARGET}/api/register`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${tokenSandboxE2e}`,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: form as any,
    });

    await res.text(); // Liberar la conexion de red
    return {
      tipo: 'POST',
      status: res.status,
      tiempo: performance.now() - inicio,
    };
  } catch (error) {
    return {
      tipo: 'POST',
      status: 500,
      tiempo: performance.now() - inicio,
      error,
    };
  }
}

function calcularPercentiles(tiempos: number[]) {
  if (tiempos.length === 0) return { p50: 0, p95: 0, p99: 0 };
  tiempos.sort((a, b) => a - b);
  return {
    p50: tiempos[Math.floor(tiempos.length * 0.5)],
    p95: tiempos[Math.floor(tiempos.length * 0.95)],
    p99: tiempos[Math.floor(tiempos.length * 0.99)],
  };
}

async function iniciarHarness() {
  console.log(`Iniciando harness de carga hacia target: ${TARGET}`);
  console.log(`Simulando 500 visitantes y 100 envios simultaneos...\n`);

  const visitantes = Array.from({ length: 500 }, () => simularVisitante());
  const envios = Array.from({ length: 100 }, (_, i) => simularEnvio(i));

  const resultados = await Promise.all([...visitantes, ...envios]);

  const enviosRealizados = resultados.filter((r) => r.tipo === 'POST');
  const exitos = enviosRealizados.filter((r) => r.status === 200);
  const errores = enviosRealizados.filter((r) => r.status !== 200);

  const latencias = calcularPercentiles(enviosRealizados.map((r) => r.tiempo));

  console.log('--- REPORTE DE CAPACIDAD ---');
  console.log(`Envios POST exitosos (codigo 200): ${exitos.length}/100`);
  console.log(`Envios POST fallidos: ${errores.length}`);
  console.log(`Latencias POST (ms):`);
  console.log(`  - p50 (Mediana): ${latencias.p50.toFixed(2)} ms`);
  console.log(`  - p95:           ${latencias.p95.toFixed(2)} ms`);
  console.log(`  - p99:           ${latencias.p99.toFixed(2)} ms`);

  if (errores.length > 0) {
    console.log('\nEl servidor local mostro cuellos de botella bajo estres.');
  } else {
    console.log(
      '\n100% de exito. El mock local soporta la concurrencia requerida.',
    );
  }
}

iniciarHarness();
