// Verified, implementation-backed product reference shared by the local guide and AI prompt.
export const PRODUCT_KNOWLEDGE_VERSION = '1.1.0';

export const PRODUCT_KNOWLEDGE = Object.freeze({
  version: PRODUCT_KNOWLEDGE_VERSION,
  navigation: {
    overview: 'Overview', photon: 'Photon acquisition', trends: 'My trends', care: 'AI Companion',
    locator: 'Find care', sharing: 'Share securely', profile: 'Profile & Settings'
  },
  recording: {
    start: 'Open Photon acquisition and choose Start acquisition. Simulation is labeled synthetic. For a physical connection, choose Bluetooth LE or USB serial, load a device-owner-supplied reference-stream configuration, choose Connect device, then Start acquisition. Imported recordings use the same validated measurement pipeline. Stop with Stop & save, or let the selected duration complete.',
    replay: 'Photon acquisition imports Arteria session JSON or Arteria-format CSV for replay through the measurement pipeline. CSV import requires the metadata produced by Export CSV. Replay is not a new live hardware measurement.',
    storage: 'Saved recordings, notes, profile preferences and reports are kept in this browser. Recording samples use IndexedDB. Browser data clearing can remove them.',
    analysis: 'The app calculates descriptive engineering checks and channel statistics. It does not calculate a wellness score, DVT score, diagnosis or validated clinical trend.'
  },
  privacy: {
    ai: 'When you agree to send messages to AI, your message and recent in-memory conversation go to the configured external AI provider (GroqCloud by default). A reviewed aggregate recording summary is sent only after separate session-sharing consent. Raw samples, notes and profile details are excluded. The provider receives transmitted content; Arteria cannot promise provider-side retention or deletion.',
    local: 'Saved recordings, notes, profile preferences, reports and optional saved chat transcripts remain in browser storage unless the user exports or shares content. Recordings, notes, reports, profile and saved transcripts are not encrypted. The separate encrypted-note download is encrypted with a user passphrase.',
    transcript: 'Optional transcript saving is off by default; if enabled, future chat bubbles are stored locally without encryption and are never automatically restored into AI context.'
  },
  capabilities: {
    hardware: 'Generic Web Bluetooth and Web Serial adapters are implemented for the documented Arteria newline-delimited JSON reference stream. The wearable board, firmware protocol, sensor units, and physical connection have not been supplied or verified. No Wi-Fi adapter, battery value, or authenticated device identity is claimed.',
    export: 'Open My trends and select a recording to use Export CSV or Export JSON. Arteria-format CSV and JSON files can be imported in Photon acquisition. Reports can be previewed, printed or saved as PDF through the browser.',
    delete: 'Delete one recording from My trends after selecting it. Profile & Settings > Data & Privacy can delete all saved recordings and clear local Arteria data after confirmation. Care Companion has separate controls to clear the current conversation and delete optional saved chat history.',
    clinic: 'Open Find care to search public clinic listings by city or ZIP, or choose to share approximate location for a nearby search. Listings do not guarantee service availability or appointments.',
    notes: 'Open My trends, select a saved recording, add text in Session notes and choose Save notes. Notes stay in local browser storage, are not encrypted, and are excluded from AI requests.',
    preferences: 'Open Profile & Settings to change English or Spanish, text size, contrast, reduced motion, default recording duration, live chart window and grid display. The language selector is also in the header.',
    unsupported: ['cloud account or sync', 'Wi-Fi device adapter', 'device authentication', 'Nina hardware protocol support before specifications are supplied', 'record tagging', 'clinical diagnosis or DVT risk score', 'validated thrombosis detection'],
    sharing: 'Share securely provides a passphrase-encrypted local note workflow and an optional separately configured recipient-restricted email flow. It does not encrypt ordinary recordings, notes, profiles or reports.'
  },
  signals: {
    simulator: 'The simulator emits synthetic optical channel values at 25 Hz in arbitrary units. They are not physiological readings.',
    checks: 'Missing samples count skipped sequence numbers. Timing gaps are adjacent device-time intervals over 1.8 times the expected sample interval. Flatline and clipping checks follow their declared engineering rules. These checks are not clinical quality measures.',
    unknown: 'Hardware model, sensors, wavelengths, placement, calibration and firmware protocol are not available or verified.'
  },
  safety: 'Arteria is a research prototype and is not a clinically validated diagnostic tool. It cannot diagnose or rule out DVT or pulmonary embolism.'
});

const answers = {
  en: {
    navigation: `Verified app guide (not AI): ${PRODUCT_KNOWLEDGE.navigation.overview} shows recent saved data; ${PRODUCT_KNOWLEDGE.navigation.photon} starts acquisition and replay; ${PRODUCT_KNOWLEDGE.navigation.trends} contains session history, charts, reports and exports; ${PRODUCT_KNOWLEDGE.navigation.care} is the optional AI assistant; ${PRODUCT_KNOWLEDGE.navigation.locator} searches public clinics; ${PRODUCT_KNOWLEDGE.navigation.sharing} contains the note-sharing tools; ${PRODUCT_KNOWLEDGE.navigation.profile} contains language, accessibility, recording, chart and local-data settings. On mobile, use the navigation bar.`,
    start: `Verified app guide (not AI): Open Photon acquisition and choose Start acquisition. The default source is Simulation, labeled synthetic. Stop with Stop & save, or let the configured duration complete. Choose Recording replay to load an Arteria session JSON file. There is no verified physical-device connection.`,
    privacy: `Verified privacy details (not AI): ${PRODUCT_KNOWLEDGE.privacy.ai} ${PRODUCT_KNOWLEDGE.privacy.local} ${PRODUCT_KNOWLEDGE.privacy.transcript}`,
    hardware: `Verified device status (not AI): ${PRODUCT_KNOWLEDGE.capabilities.hardware} Imported origin labels are declared in the file and are not authenticated.`,
    unsupported: `Verified feature list (not AI): ${PRODUCT_KNOWLEDGE.capabilities.unsupported.join('; ')}. ${PRODUCT_KNOWLEDGE.capabilities.export}`,
    export: `Verified export guide (not AI): ${PRODUCT_KNOWLEDGE.capabilities.export}`,
    delete: `Verified data controls (not AI): ${PRODUCT_KNOWLEDGE.capabilities.delete}`,
    clinic: `Verified clinic-search guide (not AI): ${PRODUCT_KNOWLEDGE.capabilities.clinic}`,
    notes: `Verified notes guide (not AI): ${PRODUCT_KNOWLEDGE.capabilities.notes}`,
    preferences: `Verified settings guide (not AI): ${PRODUCT_KNOWLEDGE.capabilities.preferences}`,
    signal: `Verified signal guide (not AI): ${PRODUCT_KNOWLEDGE.signals.checks} ${PRODUCT_KNOWLEDGE.signals.simulator} ${PRODUCT_KNOWLEDGE.safety}`,
    sharing: `Verified sharing guide (not AI): ${PRODUCT_KNOWLEDGE.capabilities.sharing} ${PRODUCT_KNOWLEDGE.privacy.local}`,
    storage: `Verified storage details (not AI): ${PRODUCT_KNOWLEDGE.recording.storage} ${PRODUCT_KNOWLEDGE.privacy.local}`,
    care: `Verified AI behavior (not AI): ${PRODUCT_KNOWLEDGE.privacy.ai} ${PRODUCT_KNOWLEDGE.safety}`,
    recording: 'Verified recording context (not AI): Aria cannot read a personal recording unless you select it in Care Companion and separately consent to share its reviewed aggregate summary. The summary excludes raw samples, notes and profile details. Without that consent, Arteria does not send recording data to AI.'
  },
  es: {
    navigation: 'Guía verificada de la aplicación (no es IA): Resumen muestra datos recientes; Adquisición Photon inicia adquisiciones y reproducciones; Mis tendencias contiene historial, gráficos, informes y exportaciones; Compañera de IA es el asistente opcional; Buscar atención consulta clínicas públicas; Compartir de forma segura contiene las herramientas para compartir notas; Perfil y ajustes contiene idioma, accesibilidad, grabación, gráficos y datos locales. En móvil, usa la barra de navegación.',
    start: 'Guía verificada de la aplicación (no es IA): Abre Adquisición Photon y selecciona Iniciar adquisición. Simulación está etiquetada como sintética. Para conectarte físicamente, elige Bluetooth LE o USB serial, carga una configuración de flujo de referencia suministrada por la persona responsable del dispositivo, selecciona Conectar dispositivo y después Iniciar adquisición. Las grabaciones importadas usan la misma canalización validada. Pulsa Detener y guardar o espera a que termine la duración elegida.',
    privacy: 'Privacidad verificada (no es IA): Al aceptar el consentimiento de mensajes, tu mensaje y el contexto reciente de la conversación se envían al proveedor externo de IA configurado. El resumen de una grabación revisada solo se envía con un consentimiento separado. No se envían muestras originales, notas ni datos del perfil. Arteria no puede garantizar la retención o eliminación por parte del proveedor. Las grabaciones, notas, perfil, informes e historiales opcionales se guardan localmente sin cifrar. La descarga de nota cifrada usa una frase de contraseña.',
    hardware: 'Estado verificado del dispositivo (no es IA): Hay adaptadores genéricos Web Bluetooth y Web Serial para el flujo JSON de referencia de Arteria. No hay hardware físico conectado ni verificado: no se han suministrado ni verificado la placa, el protocolo de firmware ni las unidades del sensor. No se afirma compatibilidad Wi-Fi, nivel de batería ni identidad autenticada. El origen declarado en archivos importados no se autentica.',
    unsupported: `Funciones verificadas (no es IA): ${PRODUCT_KNOWLEDGE.capabilities.unsupported.join('; ')}. ${PRODUCT_KNOWLEDGE.capabilities.export}`,
    export: 'Guía verificada de exportación (no es IA): Abre Mis tendencias, selecciona una grabación y usa Export CSV o Export JSON. Los formatos Arteria CSV y JSON se importan en Adquisición Photon. Los informes se pueden previsualizar, imprimir o guardar como PDF desde el navegador.',
    delete: 'Controles de datos verificados (no es IA): Elimina una grabación desde Mis tendencias después de seleccionarla. Perfil y ajustes > Datos y privacidad permite eliminar todas las grabaciones y borrar los datos locales de Arteria tras confirmar. Compañera de IA tiene controles separados para borrar la conversación actual y el historial opcional guardado.',
    clinic: 'Guía verificada de búsqueda de clínicas (no es IA): Abre Buscar atención para buscar clínicas públicas por ciudad o código postal, o acepta compartir una ubicación aproximada para buscar cerca. Los resultados no garantizan servicios ni citas disponibles.',
    notes: 'Guía verificada de notas (no es IA): Abre Mis tendencias, selecciona una grabación, escribe en Notas de la sesión y selecciona Guardar notas. Las notas permanecen en el almacenamiento local del navegador, no están cifradas y se excluyen de las solicitudes de IA.',
    preferences: 'Guía verificada de ajustes (no es IA): Abre Perfil y ajustes para cambiar inglés o español, tamaño del texto, contraste, movimiento reducido, duración predeterminada, ventana del gráfico en vivo y cuadrícula. El selector de idioma también está en la cabecera.',
    signal: `Guía verificada de señal (no es IA): ${PRODUCT_KNOWLEDGE.signals.checks} ${PRODUCT_KNOWLEDGE.signals.simulator} ${PRODUCT_KNOWLEDGE.safety}`,
    sharing: `Guía verificada para compartir (no es IA): ${PRODUCT_KNOWLEDGE.capabilities.sharing} ${PRODUCT_KNOWLEDGE.privacy.local}`,
    storage: `Almacenamiento verificado (no es IA): ${PRODUCT_KNOWLEDGE.recording.storage} ${PRODUCT_KNOWLEDGE.privacy.local}`,
    care: `Funcionamiento verificado de IA (no es IA): ${PRODUCT_KNOWLEDGE.privacy.ai} ${PRODUCT_KNOWLEDGE.safety}`,
    recording: 'Contexto verificado de grabación (no es IA): Aria no puede leer una grabación personal si no la seleccionas en Compañera de IA y aceptas por separado compartir su resumen agregado revisado. El resumen excluye muestras originales, notas y datos del perfil. Sin ese consentimiento, Arteria no envía datos de grabaciones a la IA.'
  }
};

export function verifiedProductAnswer(text, language = 'en', {sessionShared = false} = {}) {
  if (typeof text !== 'string') return null;
  const q = text.toLocaleLowerCase(language === 'es' ? 'es' : 'en');
  const has = pattern => pattern.test(q);
  // Workflow questions about managing a recording never need its private measurement data.
  if (has(/\b(how|where|can i|c[oó]mo|d[oó]nde|puedo)\b/u) && has(/\b(save|stop|guardar|guardo|guardas|guarda|guardamos|detener)\b/u) && has(/\b(recording|session|grabaci[oó]n|sesi[oó]n)\b/u)) return answers[language === 'es' ? 'es' : 'en'].start;
  if (has(/\b(how|where|can i|c[oó]mo|d[oó]nde|puedo)\b/u) && has(/\b(delete|remove|eliminar|borrar)\b/u) && has(/\b(recording|session|grabaci[oó]n|sesi[oó]n)\b/u)) return answers[language === 'es' ? 'es' : 'en'].delete;
  if (has(/\b(how|where|can i|c[oó]mo|d[oó]nde|puedo)\b/u) && has(/\b(export|download|exportar|descargar)\b/u) && has(/\b(recording|session|grabaci[oó]n|sesi[oó]n)\b/u)) return answers[language === 'es' ? 'es' : 'en'].export;
  // Individual-session questions either have explicit shared context or get a local consent instruction.
  if (/\b(my|this|that|these|mi|esta|esa|estas)\s+(recording|session|readings?|measurement|grabaci[oó]n|sesi[oó]n|lectura|medici[oó]n(?:es)?)\b/u.test(q)) return sessionShared ? null : answers[language === 'es' ? 'es' : 'en'].recording;
  let key = null;
  if (has(/\b(privacy|private|data leave|data sent|send .*data|what .*sent|groq|encrypt|encrypted|stored|storage|delete data|privacidad|privado|datos salen|datos env[ií]a|datos .* env[ií]an|qu[eé] .*env[ií]a|cifrad|guardad|almacen|eliminar datos)\b/u)) key = 'privacy';
  else if (has(/\b(bluetooth|\bble\b|usb|serial|wi[- ]?fi|battery|bater[ií]a|device connected|hardware connected|dispositivo conectado|hardware f[ií]sico|sensor conectado)\b/u)) key = 'hardware';
  else if (has(/\b(cloud|sync|account|login|csv import|import csv|tagging|tags|dvt score|risk score|diagnos|clinical|cloud|cuenta|iniciar sesi[oó]n|importar csv|etiquet|puntuaci[oó]n|cl[ií]nic|diagn[oó]stic)\b/u)) key = 'unsupported';
  else if (has(/\b(share securely|encrypted note|compartir de forma segura|nota cifrada|share my data|compartir datos)\b/u)) key = 'sharing';
  else if (has(/\b(clear chat|delete chat|delete conversation|clear local data|delete all recordings|delete recording|remove recording|borrar chat|eliminar chat|borrar conversaci[oó]n|borrar datos locales|eliminar grabaci[oó]n|borrar grabaci[oó]n)\b/u)) key = 'delete';
  else if (has(/\b(session note|add notes?|edit notes?|save notes?|chat history|save chat|transcript|nota de sesi[oó]n|anotaciones|guardar notas?|historial de chat|guardar chat|transcripci[oó]n)\b/u)) key = 'notes';
  else if (has(/\b(accessibility settings|language settings|language selector|change language|switch language|text size|high contrast|reduce motion|accesibilidad|cambiar idioma|selector de idioma|tama[nñ]o del texto|alto contraste|reducir movimiento|ajustes)\b/u)) key = 'preferences';
  else if (has(/\b(export|download|csv|json|exportar|descargar)\b/u)) key = 'export';
  else if (has(/\b(clinic|clinics|find care|care near|cl[ií]nica|cl[ií]nicas|buscar atenci[oó]n|atenci[oó]n cerca)\b/u)) key = 'clinic';
  else if (has(/\b(what can .* do|what features|feature list|does .* have|capabilities|qu[eé] funciones|qu[eé] puede hacer|funciones tiene|caracter[ií]sticas|what does arteria do|explain arteria|tell me about arteria|qu[eé] hace arteria|expl[ií]came arteria|cu[eé]ntame de arteria)\b/u)) key = 'navigation';
  else if (has(/\b(where|how do i|how can i|show me|tell me about|find|open|navigate|button|menu|page|screen|d[oó]nde|c[oó]mo|mu[eé]strame|encuentro|abrir|navegar|bot[oó]n|men[uú]|p[aá]gina|pantalla|veo)\b/u) && has(/\b(overview|dashboard|photon|scan|acquisition|record|history|session|trend|report|export|clinic|care|aria|profile|setting|inicio|resumen|adquisici[oó]n|grabar|historial|sesi[oó]n|sesiones|tendencia|informe|exportar|cl[ií]nica|perfil|ajuste)\b/u)) key = 'navigation';
  else if (has(/\b(start|begin|record|acquisition|replay|c[oó]mo empezar|iniciar|comenzar|grabar|reproducir)\b/u) && has(/\b(measurement|recording|scan|photon|medici[oó]n|grabaci[oó]n|escaneo)\b/u)) key = 'start';
  else if (has(/\b(signal quality|signal gap|missing sample|timing gap|flatline|clipping|quality check|calidad de se[nñ]al|intervalo de se[nñ]al|muestra faltante|intervalo de tiempo|se[nñ]al plana|recorte|comprobaci[oó]n de calidad)\b/u)) key = 'signal';
  return key ? answers[language === 'es' ? 'es' : 'en'][key] : null;
}
