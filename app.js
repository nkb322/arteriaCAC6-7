(() => {
  "use strict";
//definitions, ignore unless need to change vars for some reaoson
  const views = ["overview", "photon", "trends", "locator", "sharing", "care", "profile"];
  const modal = document.getElementById("accessibility-modal");
  const toastRegion = document.getElementById("toast-region");
  const chatLog = document.getElementById("chat-log");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  let toastTimer;
//ok there are a lot of definitions here, but I think they are all necessary for the code to work properly. I will not change any of them unless I have a good reason to do so.
  const translations = {
    en: {
      "language.label": "Choose language",
      "nav.overview": "Overview",
      "nav.photon": "Photon acquisition",
      "nav.trends": "My trends",
      "nav.locator": "Find care",
      "nav.sharing": "Share securely",
      "nav.care": "Care guide",
      "nav.profile": "Profile & Settings",
      "nav.new": "NEW",

      "common.breadcrumb": "My health",
      "common.today": "Today",
      "common.demoMode": "DEMO MODE",
      "common.demo": "DEMO",
      "common.illustrativeData": "Illustrative demo data",
      "common.conceptPreview": "CONCEPT PREVIEW",
      "common.simulated": "SIMULATED",
      "common.dismiss": "Dismiss note",
      "common.urgentTitle": "Need urgent help?",
      "common.skip": "Skip to main content",
      "common.navigation": "Main navigation",
      "common.home": "Arteria home",
      "common.yourSpace": "YOUR SPACE",
      "common.patchConnected": "PATCH CONNECTED",
      "common.patchDetails": "Patch connection details",
      "common.battery": "Battery",
      "common.synced": "Synced just now",
      "common.personalProfile": "Local guest · no account",
      "common.accessibilitySettings": "Accessibility settings",
      "common.notifications": "Source status",
      "common.profile": "Open Profile & Settings",
      //yea cool
      "common.justNow": "just now",
      "common.notificationText": "Current source status",
      "common.profileText": "Local guest profile | No cloud account",
      "common.profileToast": "This is a sample profile. No account information is connected.",
      "common.patchToast": "Arteria One is shown as connected for this demo. No wearable is paired.",
      "common.prototypeToast": "Arteria records sessions from an explicitly selected source. Simulation is synthetic. No hardware adapter or diagnostic model is configured.",
      "common.readAloudUnavailable": "Read aloud isn’t supported in this browser. Try your device’s screen reader instead.",
      "common.noReply": "Aria doesn’t have a reply to read aloud yet.",
      "common.readAloudError": "Your browser couldn’t read this reply aloud.",
      "overview.scoreAria": "Illustrative wellness score: 82 out of 100",
      "overview.outOf": "of 100",
      "overview.snapshot": "Your wellness snapshot",
      "overview.moreActive": "More active",
      "overview.rest": "Rest",
      "overview.chartAria": "Illustrative weekly movement pattern, gradually increasing from Monday to Sunday",
      "overview.eyebrow": "A MOMENT FOR YOU",
      "overview.greeting": "Hello, Guest",
      "overview.subtitle": "Let’s take a gentle look at how you’re doing today.",
      "overview.scanButton": "Start acquisition",
      "overview.noticeTitle": "A note about this experience:",
      "overview.noticeBody": "Measurements come from the selected source. Simulation and replay are labeled. No medical wellness score or diagnosis is calculated.",
      "overview.patchLabel": "YOUR PATCH",
      "overview.dailyOverview": "Daily overview",
      "overview.steady": "Steady signals today",
      "overview.sampleCheckin": "Your sample check-in looks steady. Keep following the plan you made with your care team.",
      "overview.lastCheckin": "Last check-in",
      "overview.demoReading": "Today at 9:41 AM · Demo reading",
      "overview.patternsPersonal": "Patterns are personal. Your care team has the full picture.",
      "overview.seeTrends": "See my trends",
      "overview.companionLabel": "YOUR PERSONAL COMPANION",
      "overview.hereForYou": "HERE FOR YOU",
      "overview.companionGreeting": "How are you feeling today?",
      "overview.companionDescription": "We can talk through your routine, explore this prototype, or get a few questions ready for your care team.",
      "overview.talkAria": "Talk with Aria",
      "overview.private": "Private by design",
      "overview.notClinician": "Not a clinician",
      "overview.closerLook": "A CLOSER LOOK",
      "overview.glance": "Today at a glance",
      "overview.movement": "Movement",
      "overview.steps": "steps",
      "overview.movementEncouragement": "Gentle movement adds up",
      "overview.photonSignal": "Photon signal",
      "overview.inRange": "In range",
      "overview.opticalPreview": "Optical concept preview",
      "overview.wearTime": "Wear time",
      "overview.hours": "hrs",
      "overview.patchComfort": "Patch comfort check: good",
      "overview.yourWeek": "YOUR WEEK",
      "overview.steadyProgress": "Small steps, steady progress",
      "overview.checkinsProgress": "See how your daily check-ins are coming together.",
      "overview.exploreTrends": "Explore trends",
      "overview.illustrativeMovement": "Illustrative movement pattern",
      "overview.realPatchData": "Your real patch data would appear here",
      "photon.eyebrow": "A LIGHT-BASED SENSING IDEA",
      "photon.title": "Meet Photon",
      "photon.subtitle": "Record a session, inspect the signal, and keep its source and units visible.",
      "photon.noticeTitle": "Acquisition, with a clear source.",

      //MAKE SURE TO CHANGE THIS OMG ONCE THE ACTUAL THING IS CONNECTED FR FR
      "photon.noticeBody": "Choose simulation or a recorded session. Physical hardware requires its firmware adapter. These signals cannot detect or rule out DVT.",
      "photon.patchConcept": "PHOTONIC PATCH CONCEPT",
      "photon.seeLight": "See light in a new way",
      "photon.multiWave": "MULTI-WAVELENGTH CONCEPT",
      "photon.reflectedLight": "Light, reflected with purpose.",
      "photon.researchExploration": "A research-inspired interface exploration",

      "photon.red": "RED",
      "photon.infrared": "NEAR-INFRARED",
      "photon.green": "GREEN",
      "photon.ready": "Ready when you are",
      "photon.scanHint": "Record, inspect and export a measurement session.",
      "photon.startSequence": "Start demo sequence",
      "photon.running": "Previewing the light sequence…",
      "photon.runningStatus": "Simulating a light sequence",
      "photon.runningHint": "Just an animation · no sensor or body data is involved.",
      "photon.complete": "Sequence preview complete",
      //REMOVE REMOVE
      "photon.completeHint": "No health measurement was made. This concept cannot detect or rule out DVT.",
      "photon.replay": "Replay demo sequence",
      "photon.toast": "Preview complete. No body data was collected or analyzed.",
      "photon.theIdea": "THE IDEA",
      "photon.whatIf": "What if a patch could see beyond the surface?",
      "photon.explanation": "Different colors of light interact with tissue in different ways. We’re exploring whether that could someday support more comfortable, continuous monitoring.",
      "photon.designedForYou": "Designed around you",
      "photon.ambition": "Small, comfortable, and ambitious",
      "photon.spectrum": "A SPECTRUM OF POSSIBILITY",
      "photon.threeWaves": "Three wavelengths, one concept",
      "photon.redLight": "Red light",
      "photon.oneChannel": "One possible signal channel",
      "photon.nearInfrared": "Near-infrared",
      "photon.researchDirection": "Another research direction",
      "photon.greenLight": "Green light",
      "photon.complementarySignals": "Exploring complementary signals",
      //REMOVEE
      "photon.scienceNote": "These are design concepts only. Performance and clinical utility have not been established.",
      "trends.eyebrow": "YOUR PERSONAL HISTORY",
      "trends.title": "Your trends",
      "trends.subtitle": "Notice the patterns, and give yourself credit for the little wins.",
      "trends.rangeLabel": "Choose trend time range",
      "trends.last7": "Last 7 days",
      "trends.last30": "Last 30 days",
      "trends.noticeTitle": "These are examples, not health readings.",
      "trends.noticeBody": "The chart and metrics below are here to show how a future experience might look.",
      "trends.demoMovement": "DEMO MOVEMENT PATTERN",
      //REMOVE REMOVE
      "trends.chartDescription": "Illustrative values only · a future patch experience might show personalized patterns.",
      "trends.stepsPlaceholder": "Steps shown are illustrative placeholders, not a measurement.",
      "trends.movementWeek": "Movement this week",
      "trends.stepsDay": "steps/day",
      "trends.moreEachDay": "A little more each day",
      "trends.patchWear": "Patch wear time",
      "trends.hoursDay": "hrs/day",
      "trends.comfortMatters": "Your comfort matters",
      "trends.completedCheckins": "Check-ins completed",
      "trends.of7Days": "of 7 days",
      "trends.consistency": "Consistency, not perfection",
      "trends.reminderEyebrow": "A GENTLE REMINDER",
      "trends.reminderTitle": "Your routine is yours to define.",
      "trends.reminderBody": "There’s no single “right” way to build a habit. If you have questions about what’s right for you, your care team is the best place to start.",
      "trends.talkItThrough": "Talk it through",
      "trends.weekTitle": "Your week at a glance",
      "trends.monthTitle": "Your month at a glance",
      "locator.eyebrow": "CARE THAT FITS YOUR LIFE",
      "locator.title": "Find care nearby",
      "locator.subtitle": "Choose what matters to you, then explore nearby services.",
      "locator.badge": "OPENSTREETMAP LISTINGS",
      "locator.privacyTitle": "Your location stays in your hands.",
      "locator.privacyBody": "If you search by location, an approximate location (rounded to about 100 metres) and your chosen radius are sent to Nominatim and Photon, public services that search OpenStreetMap data. Arteria doesn’t save your location. You can search for a city or ZIP code instead.",
      "locator.filterHeading": "START WITH WHAT WORKS FOR YOU",
      "locator.where": "Where should we look?",
      "locator.consent": "I understand an approximate location will be shared with Nominatim and Photon to find nearby services.",
      "locator.useLocation": "Use my location",
      "locator.orSearch": "OR SEARCH A PLACE",
      "locator.areaLabel": "City, town, or ZIP code",
      "locator.areaPlaceholder": "For example, 02139 or Cambridge",
      "locator.searchArea": "Search area",
      "locator.searchPrivacy": "We’ll send the place you enter to Nominatim, then use Photon to look for nearby services. Your search isn’t saved here.",
      "locator.serviceTypeLabel": "What kind of care are you looking for?",
      "locator.anyService": "Any nearby health service",
      "locator.vascular": "Vascular care",
      "locator.ultrasound": "Ultrasound or imaging",
      "locator.urgent": "Urgent or emergency care",
      "locator.clinics": "Clinics and doctors",
      "locator.radiusLabel": "How far would you like to look?",
      "locator.within5": "Within 5 km",
      "locator.within10": "Within 10 km",
      "locator.within25": "Within 25 km",
      "locator.accessFilter": "Show places listed as wheelchair accessible",
      "locator.sourceNotice": "Listings can be incomplete or out of date. Please call to confirm services, step-free access, and opening hours before you go. Map data ©",
      "locator.attribution": "OpenStreetMap contributors",
      "locator.options": "YOUR OPTIONS",
      "locator.ready": "Ready when you are",
      "locator.initialStatus": "Choose how you’d like to search. We won’t look up your location until you ask us to.",
      "locator.urgentNotice": "If you may be having a medical emergency, call your local emergency number now. Don’t wait for this app or an online listing.",
      "locator.loadingArea": "Finding {place}…",
      "locator.permission": "Waiting for your location permission…",
      "locator.loadingServices": "Looking for nearby services…",
      "locator.noMatch": "No listings match those preferences. Try a different care type, turn off the access filter, or widen your search.",
      "locator.noServices": "We couldn’t find nearby listings. Try a wider search or another area.",
      "locator.searchFailed": "The map search isn’t responding right now. Please try again shortly or search a different area.",
      "locator.searchFailedTitle": "We couldn’t load nearby listings",
      "locator.noPlace": "We couldn’t find that place. Check the spelling or try a nearby town or ZIP code.",
      "locator.areaFailed": "We couldn’t search that area right now. Please try again shortly.",
      "locator.locationUnavailable": "Location isn’t available in this browser. You can search by city or ZIP code instead.",
      "locator.locationDenied": "Location access wasn’t allowed. You can search by city or ZIP code instead.",
      "locator.locationError": "We couldn’t get your location. Check your browser settings or search by city or ZIP code.",
      "locator.showing": "Showing the closest matches near {place}. Listings may be incomplete.",
      "locator.placeCount": "{count} places",
      "locator.placeCountOne": "1 place",
      "locator.placeNear": "Places near {place}",
      "locator.distance": "{distance} km",
      "locator.accessListed": "Wheelchair access listed",
      "locator.accessUnknown": "Access details not listed",
      "locator.viewMap": "View on map ↗",
      "locator.mapAria": "View {name} on OpenStreetMap in a new tab",
      "locator.vascularCategory": "Vascular care",
      "locator.imagingCategory": "Ultrasound or imaging",
      "locator.urgentCategory": "Urgent or emergency care",
      "locator.hospitalCategory": "Hospital",
      "locator.clinicsCategory": "Clinics and doctors",
      "locator.otherCategory": "Health service",
      "sharing.emailInvalid": "Enter a valid email address.",
      "sharing.passwordMismatch": "Those passphrases don’t match. Please try again.",
      "sharing.passwordTooShort": "Choose a passphrase with at least 12 characters.",
      "sharing.secureRequired": "Secure encryption isn’t available in this browser. Open Arteria over HTTPS and try again.",
      "sharing.encrypting": "Encrypting your note on this device…",
      "sharing.sending": "Sending your encrypted file…",
      "sharing.sent": "Your encrypted file is on its way. Check your inbox, and keep your passphrase somewhere safe.",
      "sharing.sendFailed": "Delivery could not be confirmed. Your passphrase was not sent. Download the encrypted file locally instead.",
      "sharing.badFile": "Choose a valid Arteria encrypted file.",
      "sharing.passwordRequired": "Enter the passphrase you used for this file.",
      "sharing.decrypting": "Unlocking your file on this device…",
      "sharing.unlocked": "Your note is unlocked and downloaded to this device.",
      "sharing.wrongPassword": "We couldn’t unlock this file. Check your passphrase and try again.",
      "sharing.encryptionFailed": "We couldn’t securely prepare your note. Nothing was sent.",
      "sharing.emailSetup": "Secure email isn’t set up yet. Please try again later.",
      "sharing.emailUnavailable": "The email service couldn’t be reached. Please try again.",
      "sharing.emailRejected": "The email service couldn’t send your file. Please try again.",
      "care.inputAria": "Message Aria",
      "care.voiceAria": "Read Aria's latest reply aloud",
      "care.sendAria": "Send message",
      "care.newChatAria": "Start a fresh conversation",
      "care.teamToast": "For medical questions, contact your clinician using the details they provided.",
      "sharing.eyebrow": "YOUR INFORMATION, YOUR CHOICE",
      "sharing.title": "Share a note with your care team",
      "sharing.subtitle": "Download an encrypted note locally, or email it when the service is configured.",
      "sharing.encryptionBadge": "ENCRYPTED BEFORE SENDING",
      "sharing.privacyTitle": "Your notes stay private.",
      "sharing.privacyBody": "The note is encrypted in this browser. Download stays local. Email sends only the encrypted file, address and language to the configured service; never the passphrase. Measurement history and exports are separate and unencrypted.",
      "sharing.formEyebrow": "MAKE YOUR OWN SHARE FILE",
      "sharing.formTitle": "A few details, only if you want to share them",
      "sharing.nameLabel": "Your name (optional)",
      "sharing.namePlaceholder": "Name to show in your file",
      "sharing.emailLabel": "Your email address",
      "sharing.notesLabel": "What would you like your care team to know?",
      "sharing.notesPlaceholder": "For example: questions for my next appointment, details I don’t want to forget, or what I’d like to discuss.",
      "sharing.notesHelp": "Only include information you feel comfortable sharing in an email attachment.",
      "sharing.passphraseLabel": "Create a passphrase for your file",
      "sharing.passphrasePlaceholder": "At least 12 characters",
      "sharing.passphraseHelp": "Use at least 12 characters. Give the passphrase to your recipient through a separate channel, never alongside the file.",
      "sharing.confirmLabel": "Enter your passphrase again",
      "sharing.confirmPlaceholder": "Repeat your passphrase",
      "sharing.consent": "I’m sending this encrypted file to my own email address. I understand I’ll need to give the passphrase to my care team separately if I choose to share the file with them.",
      "sharing.sendButton": "Email me my encrypted file",
      "sharing.howEyebrow": "HOW YOUR SHARE FILE WORKS",
      "sharing.howTitle": "A private handoff, with you in control.",
      "sharing.step1Title": "Your browser creates the file",
      "sharing.step1Body": "The note you write is encrypted here on your device before anything is sent.",
      "sharing.step2Title": "Download locally or email when configured",
      "sharing.step2Body": "The encrypted attachment requires your passphrase. Email metadata is not encrypted by this app.",
      "sharing.step3Title": "You decide what to do next",
      "sharing.step3Body": "Keep the file for yourself, or choose to share it with your care team and pass them the passphrase separately.",
      "sharing.openEyebrow": "OPEN A FILE YOU ALREADY HAVE",
      "sharing.openTitle": "Unlock your Arteria file",
      "sharing.fileLabel": "Encrypted Arteria file",
      "sharing.unlockPassphrase": "Passphrase",
      //this is the passphrase for the file, not the email
      "sharing.unlockPlaceholder": "Your file’s passphrase",
      "sharing.openButton": "Unlock and download note",
      "sharing.disclaimer": "This prototype is not connected to a medical record and doesn’t send your file to a provider. Email can still reveal who you contacted; the attachment itself is encrypted. Never use this for urgent care.",
      "care.eyebrow": "A SUPPORTIVE SPACE",
      "care.title": "Your care companion",
      "care.subtitle": "A place to talk things through and get ready for your next conversation.",
      "care.companion": "Your personal companion",
      "care.disclaimer": "Aria is a rule-based informational guide with fixed replies. It cannot diagnose, assess symptoms, create a medical care plan, or replace your care team.",
      "care.welcome": "Hi! How are you feeling today? We can talk about your routine, explore this prototype, or get a few questions ready for your care team.",
      "care.suggestionsLabel": "WHAT WOULD BE HELPFUL?",
      "care.suggestion1": "Help me prepare for my next appointment",
      "care.suggestion2": "What is the Photon concept?",
      "care.suggestion3": "Give me a gentle movement idea",
      "care.inputPlaceholder": "What’s on your mind?",
      "care.chatFootnote": "This demo keeps your messages in this browser session. Aria isn’t a substitute for medical advice.",
      "care.noteEyebrow": "YOUR CARE, YOUR WAY",
      "care.noteTitle": "It’s okay to come with questions.",
      "care.noteBody": "Write down what’s on your mind before your next appointment. Aria can help you get organized; your care team can give you medical guidance.",
      "care.question1": "What should I know about my monitoring plan?",
      "care.question2": "When should I get in touch with you?",
      "care.question3": "How can I wear the patch comfortably?",
      "care.urgent": "If you may be having a medical emergency, call your local emergency number now. Don’t wait for an app or a patch reading.",
      "care.teamTitle": "Prepare an appointment note",
      "care.teamBody": "Write, encrypt and download your questions.",
      "care.userMeta": "YOU · just now",
      "care.ariaMeta": "ARIA · just now",
      "care.emergencyReply": "I’m sorry you’re dealing with this. I can’t assess symptoms. If you may be having a medical emergency—especially chest pain, difficulty breathing, fainting, or coughing blood—call your local emergency number now. Don’t wait for this app or a patch reading.",
      "care.symptomReply": "I can’t tell what is causing a symptom or whether it’s a blood clot. New or worsening one-sided leg swelling, pain, warmth, or redness deserves prompt medical advice—please contact your clinician or local urgent-care service now. If you have chest pain or trouble breathing, call your local emergency number.",
      "care.readingReply": "I cannot interpret measurements, estimate medical risk, or diagnose DVT. Check the session source label: simulation is synthetic, and replay preserves its declared origin. Your care team can explain real clinical results.",
      "care.photonReply": "Photon records and visualizes sessions from simulation or recorded-data replay. A real device needs its firmware adapter. The signal checks describe data quality, not thrombosis or another diagnosis.",
      "care.appointmentReply": "A helpful question to bring could be: “What should I watch for, and what changes should prompt me to contact you?” You might also ask how to wear your patch comfortably and who to call with concerns.",
      "care.movementReply": "If movement is part of the plan your clinician recommended, you could ask them what gentle activity is right for you. A small, comfortable change—like a short stretch or stroll—can be a kind place to start, but follow your care team’s advice.",
      "care.helloReply": "Hi! I’m glad you stopped by. What would feel helpful today—a routine check-in, a question to prepare for your care team, or learning about the Photon concept?",
      "care.generalReply": "Thanks for sharing that with me. I can help you reflect on your routine, explain this prototype, or prepare questions for your care team. I can’t provide medical advice or interpret health readings—your clinician is the right person for those.",
      "care.startOver": "Hi! What would be helpful to explore today? I can help you reflect, explain this prototype, or prepare questions for your care team.",
      "footer.about": "About this prototype",
      "footer.accessibility": "Accessibility",
      "accessibility.title": "Accessibility settings",
      "accessibility.description": "Adjust the interface for more comfortable reading. Your choices are saved on this device.",
      "accessibility.close": "Close accessibility settings",
      "accessibility.largeText": "Larger text",
      "accessibility.largeTextHelp": "Increase text size throughout the app",
      "accessibility.highContrast": "High contrast",
      "accessibility.highContrastHelp": "Increase contrast between text and surfaces",
      "accessibility.reduceMotion": "Reduce motion",
      "accessibility.reduceMotionHelp": "Limit decorative animation and transitions",
      "accessibility.keyboard": "Keyboard friendly",
      "accessibility.keyboardHelp": "Use Tab to move between controls, Enter or Space to activate, and Escape to close this panel.",
      "accessibility.done": "Done",
      "accessibility.eyebrow": "MAKE IT YOURS"
    },
    //spanish part lwk AIed for disclosure
    es: {
      "language.label": "Elegir idioma",
      "nav.overview": "Resumen",
      "nav.photon": "Adquisición Photon",
      "nav.trends": "Mis tendencias",
      "nav.locator": "Buscar atención",
      "nav.sharing": "Compartir de forma segura",
      "nav.care": "Guía de atención",
      "nav.profile": "Perfil y ajustes",
      "nav.new": "NUEVO",
      "common.breadcrumb": "Mi salud",
      "common.today": "Hoy",
      "common.demoMode": "MODO DEMO",
      "common.demo": "DEMO",
      "common.illustrativeData": "Datos de ejemplo",
      "common.conceptPreview": "VISTA DEL CONCEPTO",
      "common.simulated": "SIMULADO",
      "common.dismiss": "Cerrar aviso",
      "common.urgentTitle": "¿Necesitas ayuda urgente?",
      "common.skip": "Saltar al contenido principal",
      "common.navigation": "Navegación principal",
      "common.home": "Inicio de Arteria",
      "common.yourSpace": "TU ESPACIO",
      "common.patchConnected": "PARCHE CONECTADO",
      "common.patchDetails": "Detalles de conexión del parche",
      "common.battery": "Batería",
      "common.synced": "Sincronizado hace un momento",
      "common.personalProfile": "Perfil de muestra · sin cuenta",
      "common.accessibilitySettings": "Opciones de accesibilidad",
      "common.notifications": "Estado de la fuente",
      "common.profile": "Abrir perfil y ajustes",
      "common.justNow": "ahora",
      "common.notificationText": "Estado actual de la fuente",
      "common.profileText": "Perfil de invitado local · Sin cuenta en la nube",
      "common.profileToast": "Este es un perfil de ejemplo. No hay ninguna cuenta conectada.",
      "common.patchToast": "El parche Arteria One aparece conectado en esta demostración. No hay ningún dispositivo vinculado.",
      "common.prototypeToast": "Arteria graba sesiones de una fuente elegida. La simulación es sintética. No se ha configurado un adaptador físico ni un modelo diagnóstico.",
      "common.readAloudUnavailable": "Este navegador no permite leer en voz alta. Prueba el lector de pantalla de tu dispositivo.",
      "common.noReply": "Aria aún no tiene una respuesta para leer en voz alta.",
      "common.readAloudError": "Tu navegador no pudo leer esta respuesta en voz alta.",
      "overview.scoreAria": "Puntuación de bienestar ilustrativa: 82 de 100",
      "overview.outOf": "de 100",
      "overview.snapshot": "Tu resumen de bienestar",
      "overview.moreActive": "Más actividad",
      "overview.rest": "Descanso",
      "overview.chartAria": "Patrón de movimiento ilustrativo de la semana, con un aumento gradual de lunes a domingo",
      "overview.eyebrow": "UN MOMENTO PARA TI",
      "overview.greeting": "Hola, Invitado",
      "overview.subtitle": "Veamos con calma cómo te sientes hoy.",
      "overview.scanButton": "Iniciar adquisición",
      "overview.noticeTitle": "Una nota sobre esta experiencia:",
      "overview.noticeBody": "Las mediciones proceden de la fuente seleccionada. La simulación y reproducción están etiquetadas. No se calcula una puntuación médica ni un diagnóstico.",
      "overview.patchLabel": "TU PARCHE",
      "overview.dailyOverview": "Resumen del día",
      "overview.steady": "Señales estables hoy",
      "overview.sampleCheckin": "Tu ejemplo de registro se ve estable. Sigue el plan que preparaste con tu equipo de atención.",
      "overview.lastCheckin": "Último registro",
      "overview.demoReading": "Hoy a las 9:41 · Lectura de demostración",
      "overview.patternsPersonal": "Cada persona es diferente. Tu equipo de atención conoce todo el contexto.",
      "overview.seeTrends": "Ver mis tendencias",
      "overview.companionLabel": "TU COMPAÑERA PERSONAL",
      "overview.hereForYou": "ESTAMOS AQUÍ PARA TI",
      "overview.companionGreeting": "¿Cómo te sientes hoy?",
      "overview.companionDescription": "Podemos hablar de tu rutina, explorar este prototipo o preparar algunas preguntas para tu equipo de atención.",
      "overview.talkAria": "Hablar con Aria",
      "overview.private": "Tu privacidad es lo primero",
      "overview.notClinician": "No es profesional de salud",
      "overview.closerLook": "UN POCO MÁS DE CERCA",
      "overview.glance": "Tu día de un vistazo",
      "overview.movement": "Movimiento",
      "overview.steps": "pasos",
      "overview.movementEncouragement": "Cada movimiento cuenta",
      "overview.photonSignal": "Señal Photon",
      "overview.inRange": "Dentro del rango",
      "overview.opticalPreview": "Vista previa del concepto óptico",
      "overview.wearTime": "Tiempo de uso",
      "overview.hours": "h",
      "overview.patchComfort": "Comodidad del parche: bien",
      "overview.yourWeek": "TU SEMANA",
      "overview.steadyProgress": "Paso a paso, con constancia",
      "overview.checkinsProgress": "Así se van sumando tus registros diarios.",
      "overview.exploreTrends": "Explorar tendencias",
      "overview.illustrativeMovement": "Patrón de movimiento ilustrativo",
      "overview.realPatchData": "Aquí aparecerían los datos reales del parche",
      "photon.eyebrow": "UNA IDEA DE SENSORES ÓPTICOS",
      "photon.title": "Conoce Photon",
      "photon.subtitle": "Graba una sesión, revisa la señal y conserva su fuente y unidades.",
      "photon.noticeTitle": "Adquisición con una fuente identificada.",
      "photon.noticeBody": "Elige una simulación o una sesión grabada. El hardware necesita un adaptador según su firmware. Estas señales no pueden detectar ni descartar una TVP.",
      "photon.patchConcept": "CONCEPTO DE PARCHE FOTÓNICO",
      "photon.seeLight": "Descubre otra forma de ver la luz",
      "photon.multiWave": "CONCEPTO MULTIESPECTRAL",
      "photon.reflectedLight": "La luz reflejada con intención.",
      "photon.researchExploration": "Una exploración de interfaz inspirada en la investigación",
      "photon.red": "ROJO",
      "photon.infrared": "INFRARROJO CERCANO",
      "photon.green": "VERDE",
      "photon.ready": "Cuando quieras, aquí estamos",
      "photon.scanHint": "Graba, revisa y exporta una sesión.",
      "photon.startSequence": "Iniciar secuencia de demostración",
      "photon.running": "Vista previa de la secuencia de luz…",
      "photon.runningStatus": "Simulando una secuencia de luz",
      "photon.runningHint": "Es solo una animación · no hay sensores ni datos del cuerpo.",
      "photon.complete": "Vista previa de la secuencia terminada",
      "photon.completeHint": "No se hizo ninguna medición de salud. Este concepto no puede detectar ni descartar una TVP.",
      "photon.replay": "Repetir la demostración",
      "photon.toast": "Vista previa terminada. No se recopilaron ni analizaron datos del cuerpo.",
      "photon.theIdea": "LA IDEA",
      "photon.whatIf": "¿Y si un parche pudiera ver más allá de la superficie?",
      "photon.explanation": "Los distintos colores de luz interactúan de forma diferente con los tejidos. Exploramos si eso podría ayudar algún día a monitorear de forma más cómoda y continua.",
      "photon.designedForYou": "Pensado para ti",
      "photon.ambition": "Pequeño, portátil y siempre activo: una aspiración, no una promesa.",
      "photon.spectrum": "UN ABANICO DE POSIBILIDADES",
      "photon.threeWaves": "Tres longitudes de onda, un concepto",
      "photon.redLight": "Luz roja",
      "photon.oneChannel": "Un posible canal de señal",
      "photon.nearInfrared": "Infrarrojo cercano",
      "photon.researchDirection": "Otra línea de investigación",
      "photon.greenLight": "Luz verde",
      "photon.complementarySignals": "Exploración de señales complementarias",
      "photon.scienceNote": "Son solo conceptos de diseño. Aún no se ha demostrado su rendimiento ni su utilidad clínica.",
      "trends.eyebrow": "TU HISTORIAL PERSONAL",
      "trends.title": "Tus tendencias",
      "trends.subtitle": "Observa los patrones y reconoce los pequeños logros.",
      "trends.rangeLabel": "Elegir el período de tendencias",
      "trends.last7": "Últimos 7 días",
      "trends.last30": "Últimos 30 días",
      "trends.noticeTitle": "Son ejemplos, no lecturas de salud.",
      "trends.noticeBody": "El gráfico y las métricas muestran cómo podría verse una experiencia futura.",
      "trends.demoMovement": "PATRÓN DE MOVIMIENTO DE DEMOSTRACIÓN",
      "trends.chartDescription": "Solo valores ilustrativos · un futuro parche podría mostrar patrones personalizados.",
      "trends.stepsPlaceholder": "Los pasos son ejemplos, no una medición.",
      "trends.movementWeek": "Movimiento esta semana",
      "trends.stepsDay": "pasos/día",
      "trends.moreEachDay": "Un poco más cada día",
      "trends.patchWear": "Tiempo de uso del parche",
      "trends.hoursDay": "h/día",
      "trends.comfortMatters": "Tu comodidad importa",
      "trends.completedCheckins": "Registros completados",
      "trends.of7Days": "de 7 días",
      "trends.consistency": "Constancia, no perfección",
      "trends.reminderEyebrow": "UN RECORDATORIO CON CARIÑO",
      "trends.reminderTitle": "Tú decides cómo será tu rutina.",
      "trends.reminderBody": "No hay una única forma «correcta» de crear un hábito. Si tienes dudas sobre lo que te conviene, empieza por hablar con tu equipo de atención.",
      "trends.talkItThrough": "Hablemos",
      "trends.weekTitle": "Tu semana de un vistazo",
      "trends.monthTitle": "Tu mes de un vistazo",
      "locator.eyebrow": "ATENCIÓN QUE SE ADAPTA A TU VIDA",
      "locator.title": "Busca atención cerca de ti",
      "locator.subtitle": "Elige lo que te importa y explora los servicios cercanos.",
      "locator.badge": "DIRECTORIO DE OPENSTREETMAP",
      "locator.privacyTitle": "Tú decides cómo compartir tu ubicación.",
      "locator.privacyBody": "Si buscas por ubicación, se envía una ubicación aproximada (redondeada a unos 100 metros) y el radio que elijas a Nominatim y Photon, servicios públicos que consultan los datos de OpenStreetMap. Arteria no guarda tu ubicación. También puedes buscar una ciudad o un código postal.",
      "locator.filterHeading": "EMPECEMOS POR LO QUE TE SIRVE",
      "locator.where": "¿Dónde buscamos?",
      "locator.consent": "Entiendo que se compartirá una ubicación aproximada con Nominatim y Photon para buscar servicios cercanos.",
      "locator.useLocation": "Usar mi ubicación",
      "locator.orSearch": "O BUSCA UN LUGAR",
      "locator.areaLabel": "Ciudad, localidad o código postal",
      "locator.areaPlaceholder": "Por ejemplo, 02139 o Cambridge",
      "locator.searchArea": "Buscar zona",
      "locator.searchPrivacy": "Enviaremos el lugar a Nominatim y luego usaremos Photon para buscar servicios cercanos. La búsqueda no se guarda aquí.",
      "locator.serviceTypeLabel": "¿Qué tipo de atención buscas?",
      "locator.anyService": "Cualquier servicio de salud cercano",
      "locator.vascular": "Atención vascular",
      "locator.ultrasound": "Ecografía o diagnóstico por imagen",
      "locator.urgent": "Atención urgente o de emergencia",
      "locator.clinics": "Clínicas y consultorios",
      "locator.radiusLabel": "¿A qué distancia buscamos?",
      "locator.within5": "A menos de 5 km",
      "locator.within10": "A menos de 10 km",
      "locator.within25": "A menos de 25 km",
      "locator.accessFilter": "Mostrar lugares que indican acceso para silla de ruedas",
      "locator.sourceNotice": "El directorio puede estar incompleto o desactualizado. Llama para confirmar los servicios, el acceso sin escalones y los horarios antes de ir. Datos del mapa ©",
      "locator.attribution": "colaboradores de OpenStreetMap",
      "locator.options": "TUS OPCIONES",
      "locator.ready": "Cuando quieras, aquí estamos",
      "locator.initialStatus": "Elige cómo quieres buscar. No consultaremos tu ubicación hasta que nos lo pidas.",
      "locator.urgentNotice": "Si crees que podrías estar ante una emergencia médica, llama ahora al número local de emergencias. No esperes a esta aplicación ni a un directorio en línea.",
      "locator.loadingArea": "Buscando {place}…",
      "locator.permission": "Esperando tu permiso para usar la ubicación…",
      "locator.loadingServices": "Buscando servicios cercanos…",
      "locator.noMatch": "No hay lugares que coincidan con tus preferencias. Prueba otro tipo de atención, desactiva el filtro de acceso o amplía la búsqueda.",
      "locator.noServices": "No encontramos servicios cercanos. Prueba con un radio más amplio u otra zona.",
      "locator.searchFailed": "El servicio de mapas no responde ahora. Inténtalo de nuevo en un momento o busca otra zona.",
      "locator.searchFailedTitle": "No pudimos cargar los lugares cercanos",
      "locator.noPlace": "No encontramos ese lugar. Revisa cómo lo escribiste o prueba con otra localidad o código postal.",
      "locator.areaFailed": "No pudimos buscar esa zona ahora. Inténtalo de nuevo en un momento.",
      "locator.locationUnavailable": "Este navegador no permite consultar la ubicación. Puedes buscar una ciudad o un código postal.",
      "locator.locationDenied": "No se permitió el acceso a la ubicación. Puedes buscar una ciudad o un código postal.",
      "locator.locationError": "No pudimos obtener tu ubicación. Revisa la configuración del navegador o busca una ciudad o un código postal.",
      "locator.showing": "Mostramos las opciones más cercanas a {place}. El directorio podría estar incompleto.",
      "locator.placeCount": "{count} lugares",
      "locator.placeCountOne": "1 lugar",
      "locator.placeNear": "Lugares cerca de {place}",
      "locator.distance": "{distance} km",
      "locator.accessListed": "Indica acceso para silla de ruedas",
      "locator.accessUnknown": "No se indican detalles de acceso",
      "locator.viewMap": "Ver en el mapa ↗",
      "locator.mapAria": "Ver {name} en OpenStreetMap en una pestaña nueva",
      "locator.vascularCategory": "Atención vascular",
      "locator.imagingCategory": "Ecografía o diagnóstico por imagen",
      "locator.urgentCategory": "Atención urgente o de emergencia",
      "locator.hospitalCategory": "Hospital",
      "locator.clinicsCategory": "Clínicas y consultorios",
      "locator.otherCategory": "Servicio de salud",
      "sharing.emailInvalid": "Escribe una dirección de correo válida.",
      "sharing.passwordMismatch": "Las frases de contraseña no coinciden. Inténtalo de nuevo.",
      "sharing.passwordTooShort": "Elige una frase de contraseña de al menos 12 caracteres.",
      "sharing.secureRequired": "Este navegador no permite un cifrado seguro. Abre Arteria con HTTPS e inténtalo de nuevo.",
      "sharing.encrypting": "Cifrando tu nota en este dispositivo…",
      "sharing.sending": "Enviando tu archivo cifrado…",
      "sharing.sent": "Tu archivo cifrado ya se envió. Revisa tu correo y guarda tu frase de contraseña en un lugar seguro.",
      "sharing.sendFailed": "No se pudo confirmar la entrega. No se envió tu frase de contraseña. Descarga el archivo cifrado localmente.",
      "sharing.badFile": "Elige un archivo cifrado válido de Arteria.",
      "sharing.passwordRequired": "Escribe la frase de contraseña que usaste para este archivo.",
      "sharing.decrypting": "Desbloqueando el archivo en este dispositivo…",
      "sharing.unlocked": "La nota está desbloqueada y se descargó en este dispositivo.",
      "sharing.wrongPassword": "No pudimos desbloquear el archivo. Revisa la frase de contraseña e inténtalo de nuevo.",
      "sharing.encryptionFailed": "No pudimos preparar la nota de forma segura. No se envió nada.",
      "sharing.emailSetup": "El correo seguro aún no está configurado. Inténtalo de nuevo más tarde.",
      "sharing.emailUnavailable": "No pudimos conectar con el servicio de correo. Inténtalo de nuevo.",
      "sharing.emailRejected": "El servicio de correo no pudo enviar el archivo. Inténtalo de nuevo.",
      "care.inputAria": "Mensaje para Aria",
      "care.voiceAria": "Leer en voz alta la última respuesta de Aria",
      "care.sendAria": "Enviar mensaje",
      "care.newChatAria": "Iniciar una conversación nueva",
      "care.teamToast": "Para preguntas médicas, comunícate con tu profesional de salud usando los datos que te proporcionó.",
      "sharing.eyebrow": "TÚ DECIDES SOBRE TU INFORMACIÓN",
      "sharing.title": "Comparte una nota con tu equipo de atención",
      "sharing.subtitle": "Descarga una nota cifrada o envíala por correo cuando el servicio esté configurado.",
      "sharing.encryptionBadge": "CIFRADO ANTES DEL ENVÍO",
      "sharing.privacyTitle": "Tus notas son privadas.",
      "sharing.privacyBody": "La nota se cifra en el navegador. La descarga es local. El correo envía el archivo cifrado, la dirección y el idioma al servicio configurado, nunca la contraseña. El historial y las exportaciones de mediciones son independientes y no están cifrados.",
      "sharing.formEyebrow": "CREA TU ARCHIVO PARA COMPARTIR",
      "sharing.formTitle": "Incluye solo los datos que quieras compartir",
      "sharing.nameLabel": "Tu nombre (opcional)",
      "sharing.namePlaceholder": "Nombre que aparecerá en el archivo",
      "sharing.emailLabel": "Tu dirección de correo electrónico",
      "sharing.notesLabel": "¿Qué te gustaría contarle a tu equipo de atención?",
      "sharing.notesPlaceholder": "Por ejemplo: preguntas para tu próxima cita, detalles que no quieres olvidar o temas que te gustaría conversar.",
      "sharing.notesHelp": "Incluye solo información que te sientas cómodo compartiendo en un archivo adjunto.",
      "sharing.passphraseLabel": "Crea una frase de contraseña para el archivo",
      "sharing.passphrasePlaceholder": "Al menos 12 caracteres",
      "sharing.passphraseHelp": "Usa al menos 12 caracteres. Entrega la frase de contraseña por otro canal, nunca junto con el archivo.",
      "sharing.confirmLabel": "Escribe de nuevo tu frase de contraseña",
      "sharing.confirmPlaceholder": "Repite tu frase de contraseña",
      "sharing.consent": "Enviaré este archivo cifrado a mi propio correo. Entiendo que, si decido compartirlo con mi equipo de atención, tendré que darles la frase de contraseña por separado.",
      "sharing.sendButton": "Enviarme mi archivo cifrado",
      "sharing.howEyebrow": "ASÍ FUNCIONA EL ARCHIVO",
      "sharing.howTitle": "Un envío privado que tú controlas.",
      "sharing.step1Title": "Tu navegador crea el archivo",
      "sharing.step1Body": "La nota se cifra en tu dispositivo antes de enviar nada.",
      "sharing.step2Title": "Descarga o envía por correo si está configurado",
      "sharing.step2Body": "El archivo requiere tu frase de contraseña. La aplicación no cifra los metadatos del correo.",
      "sharing.step3Title": "Tú decides qué hacer después",
      "sharing.step3Body": "Guarda el archivo o, si quieres, compártelo con tu equipo de atención y envíales la frase de contraseña por separado.",
      "sharing.openEyebrow": "ABRE UN ARCHIVO QUE YA TIENES",
      "sharing.openTitle": "Desbloquea tu archivo de Arteria",
      "sharing.fileLabel": "Archivo cifrado de Arteria",
      "sharing.unlockPassphrase": "Frase de contraseña",
      "sharing.unlockPlaceholder": "La frase de contraseña de tu archivo",
      "sharing.openButton": "Desbloquear y descargar la nota",
      "sharing.disclaimer": "Este prototipo no está conectado a un expediente médico y no envía archivos a proveedores. El correo puede revelar con quién te comunicaste, aunque el archivo adjunto está cifrado. No lo uses para una emergencia.",
      "care.eyebrow": "UN ESPACIO DE APOYO",
      "care.title": "Tu compañera de atención",
      "care.subtitle": "Un espacio para conversar y prepararte para tu próxima consulta.",
      "care.companion": "Tu compañera personal",
      "care.disclaimer": "Aria es una guía informativa basada en reglas y respuestas fijas. No diagnostica, evalúa síntomas ni crea planes médicos, y no sustituye al equipo médico.",
      "care.welcome": "¡Hola! ¿Cómo te sientes hoy? Podemos hablar de tu rutina, explorar este prototipo o preparar algunas preguntas para tu equipo de atención.",
      "care.suggestionsLabel": "¿QUÉ TE AYUDARÍA?",
      "care.suggestion1": "Ayúdame a prepararme para mi próxima cita",
      "care.suggestion2": "¿Qué es el concepto Photon?",
      "care.suggestion3": "Dame una idea para moverme con suavidad",
      "care.inputPlaceholder": "¿Qué tienes en mente?",
      "care.chatFootnote": "En esta demostración, los mensajes permanecen en esta sesión del navegador. Aria no sustituye el consejo médico.",
      "care.noteEyebrow": "TU ATENCIÓN, A TU MANERA",
      "care.noteTitle": "Está bien tener preguntas.",
      "care.noteBody": "Anota lo que te preocupa antes de tu próxima cita. Aria puede ayudarte a organizarte; tu equipo de atención puede orientarte sobre temas médicos.",
      "care.question1": "¿Qué debería saber sobre mi plan de seguimiento?",
      "care.question2": "¿En qué casos debería comunicarme contigo?",
      "care.question3": "¿Cómo puedo usar el parche con comodidad?",
      "care.urgent": "Si crees que podrías estar ante una emergencia médica, llama ahora al número local de emergencias. No esperes a una aplicación ni a una lectura del parche.",
      "care.teamTitle": "Prepara una nota para tu consulta",
      "care.teamBody": "Escribe, cifra y descarga tus preguntas.",
      "care.userMeta": "TÚ · ahora",
      "care.ariaMeta": "ARIA · ahora",
      "care.emergencyReply": "Siento que estés pasando por esto. No puedo evaluar síntomas. Si podrías estar ante una emergencia médica —sobre todo si tienes dolor en el pecho, dificultad para respirar, te desmayas o toses sangre— llama ahora al número local de emergencias. No esperes a esta aplicación ni a una lectura del parche.",
      "care.symptomReply": "No puedo determinar la causa de un síntoma ni saber si es un coágulo. Si tienes nueva hinchazón, dolor, calor o enrojecimiento en una pierna, o si empeora, busca orientación médica pronto y comunícate con tu profesional de salud o un centro de atención urgente. Si tienes dolor en el pecho o dificultad para respirar, llama al número local de emergencias.",
      "care.readingReply": "No puedo interpretar mediciones, estimar riesgo médico ni diagnosticar una TVP. Revisa la etiqueta de origen: la simulación es sintética y la reproducción conserva su origen declarado. Tu equipo médico puede explicar los resultados clínicos.",
      "care.photonReply": "Photon graba y muestra sesiones simuladas o reproducidas. Un dispositivo real necesita un adaptador de firmware. Las comprobaciones describen la señal, no una trombosis ni otro diagnóstico.",
      "care.appointmentReply": "Una pregunta útil podría ser: «¿En qué cambios debería fijarme y cuándo debería comunicarme contigo?». También puedes preguntar cómo usar el parche con comodidad y a quién llamar si algo te preocupa.",
      "care.movementReply": "Si tu profesional de salud recomendó hacer actividad, pregúntale qué tipo de movimiento suave es adecuado para ti. Un pequeño cambio cómodo, como estirarte o dar un paseo breve, puede ser un buen comienzo. Sigue las indicaciones de tu equipo de atención.",
      "care.helloReply": "¡Hola! Me alegra que estés aquí. ¿Qué te ayudaría hoy: hablar de tu rutina, preparar una pregunta para tu equipo de atención o conocer el concepto Photon?",
      "care.generalReply": "Gracias por contármelo. Puedo ayudarte a reflexionar sobre tu rutina, explicar este prototipo o preparar preguntas para tu equipo de atención. No puedo dar consejos médicos ni interpretar lecturas; para eso, consulta con tu profesional de salud.",
      "care.startOver": "¡Hola! ¿Qué te gustaría explorar? Puedo ayudarte a reflexionar, explicar este prototipo o preparar preguntas para tu equipo de atención.",
      "footer.about": "Acerca de este prototipo",
      "footer.accessibility": "Accesibilidad",
      "accessibility.title": "Opciones de accesibilidad",
      "accessibility.description": "Ajusta la interfaz para leer con más comodidad. Tus preferencias se guardan en este dispositivo.",
      "accessibility.close": "Cerrar opciones de accesibilidad",
      "accessibility.largeText": "Texto más grande",
      "accessibility.largeTextHelp": "Aumentar el tamaño del texto en toda la aplicación",
      "accessibility.highContrast": "Alto contraste",
      "accessibility.highContrastHelp": "Aumentar el contraste entre el texto y el fondo",
      "accessibility.reduceMotion": "Reducir movimiento",
      "accessibility.reduceMotionHelp": "Limitar animaciones y transiciones decorativas",
      "accessibility.keyboard": "Accesible con teclado",
      "accessibility.keyboardHelp": "Usa Tab para moverte, Enter o Espacio para activar controles y Escape para cerrar este panel.",
      "accessibility.done": "Listo",
      "accessibility.eyebrow": "PERSONALÍZALO"
    }
  };

  //woah that was long

  const languageSelect = document.getElementById("language-select");
  let currentLanguage = "en";

  function translate(key) {
    return translations[currentLanguage][key] || translations.en[key] || key;
  }

  function setLanguage(language, saveChoice = true) {
    currentLanguage = language === "es" ? "es" : "en";
    document.documentElement.lang = currentLanguage;
    languageSelect.value = currentLanguage;
    document.title = currentLanguage === "es"
      ? "Arteria — Tu salud vascular, a la vista"
      : "Arteria — Your vascular health, in view";

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = translate(element.dataset.i18n);
    });
    //use data-i18n-placeholder for placeholder text, data-i18n-aria for aria-label, and data-i18n-title for title attributes
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.placeholder = translate(element.dataset.i18nPlaceholder);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      element.setAttribute("aria-label", translate(element.dataset.i18nAria));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((element) => {
      element.title = translate(element.dataset.i18nTitle);
    });
    languageSelect.setAttribute("aria-label", translate("language.label"));
    document.querySelectorAll(".chat-card").forEach((element) => {
      element.setAttribute("aria-label", currentLanguage === "es" ? "Conversación con Aria" : "Chat with Aria");
    });

    const pageTitle = document.getElementById("breadcrumb-current");
    //breadcrumb-current is the current page title in the breadcrumb navigation, which is also used as the page title for accessibility purposes
    const activeView = document.querySelector(".view:not([hidden])");
    const viewKey = activeView?.id.replace("view-", "") || "overview";
    pageTitle.textContent = translate(`nav.${viewKey}`);
    document.getElementById("today-date").textContent = new Intl.DateTimeFormat(
      currentLanguage === "es" ? "es" : "en",
      //languages yayay
      { month: "short", day: "numeric" }
    ).format(new Date());
    const trendRange = document.getElementById("range-select");
    document.getElementById("trend-range-title").textContent = translate(
      trendRange.value === "30" ? "trends.monthTitle" : "trends.weekTitle"
    );

    document.dispatchEvent(new Event("arteria-language"));

    if (saveChoice) {
      try {
        localStorage.setItem("arteria-language", currentLanguage);
      } catch (error) {
        showToast(
          currentLanguage === "es"
            ? "El idioma se aplicará durante esta visita, pero no se pudo guardar."
            : "Your language choice will apply for this visit, but couldn’t be saved."
            //show toast if localStorage is unavailable, e.g. in private browsing mode
        );
      }
    }
  }
//backup function in case localStorage is unavailable
  try {
    setLanguage(localStorage.getItem("arteria-language") || "en", false);
  } catch (error) {
    setLanguage("en", false);
  }
  languageSelect.addEventListener("change", () => setLanguage(languageSelect.value));

  function showToast(message) {
    toastRegion.replaceChildren();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    toastRegion.append(toast);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.remove(), 4200);
  }
//toast is for temporary messages that appear and disappea
  function navigate(view, replace = false) {
    if (!views.includes(view)) return;
    document.querySelectorAll(".view").forEach((section) => {
      const isCurrent = section.id === `view-${view}`;
      section.hidden = !isCurrent;
      section.classList.toggle("active-view", isCurrent);
    });

    document.querySelectorAll(".nav-link").forEach((button) => {
      const isCurrent = button.dataset.view === view;
      button.classList.toggle("active", isCurrent);
      if (isCurrent) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    document.getElementById("breadcrumb-current").textContent = translate(`nav.${view}`);
    if (location.hash !== `#${view}`) history[replace ? "replaceState" : "pushState"](null, "", `#${view}`);
    document.getElementById(`view-${view}`).focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: document.body.classList.contains("reduce-motion") ? "auto" : "smooth" });
    document.dispatchEvent(new CustomEvent("arteria-view",{detail:view}));
  }

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.view));
  });
  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.go));
  });
  document.querySelectorAll(".brand").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate("overview");
    });
  });

  const initialView = location.hash.slice(1);
  if (views.includes(initialView)) navigate(initialView, true);
  window.addEventListener("popstate", () => { const view=location.hash.slice(1); if(views.includes(view))navigate(view,true); });
  window.addEventListener("hashchange", () => { const view=location.hash.slice(1); if(views.includes(view))navigate(view,true); });

  const topPopover = document.getElementById("top-popover");
  function togglePopover(message) {
    const alreadyOpen = !topPopover.classList.contains("hidden") && topPopover.textContent.includes(message);
    topPopover.classList.toggle("hidden", alreadyOpen);
    if (!alreadyOpen) topPopover.textContent = message;
  }
  document.getElementById("notifications-button").addEventListener("click", () => {
    togglePopover(`${translate("common.notificationText")}: ${document.getElementById("device-state").textContent}`);
  });
  document.getElementById("top-profile").addEventListener("click", () => {
    navigate("profile");
  });
  document.getElementById("profile-button").addEventListener("click", () => {
    navigate("profile");
  });
  document.querySelectorAll(".notice-close").forEach((button) => {
    button.addEventListener("click", () => button.closest(".notice-banner").remove());
  });
  document.getElementById("care-team-button").addEventListener("click", () => {
    navigate("sharing");
  });

  const accessibilityControls = {
    largeText: document.getElementById("large-text-toggle"),
    highContrast: document.getElementById("contrast-toggle"),
    reduceMotion: document.getElementById("motion-toggle")
  };
  const classNames = { largeText: "large-text", highContrast: "high-contrast", reduceMotion: "reduce-motion" };
  function loadAccessibility() {
    try {
      const saved = JSON.parse(localStorage.getItem("arteria-accessibility") || "{}");
      Object.entries(accessibilityControls).forEach(([key, control]) => {
        control.checked = saved[key] === true;
        document.body.classList.toggle(classNames[key], control.checked);
      });
    } catch (error) {
      showToast("Accessibility preferences could not be loaded. You can still change them for this visit.");
    }
  }
  loadAccessibility();

  let accessibilityOpener;
  function openAccessibility() {
    accessibilityOpener=document.activeElement;
    document.querySelector(".app-shell").inert=true;
    modal.classList.remove("hidden");
    const firstControl = accessibilityControls.largeText;
    firstControl.focus();
  }
  function closeAccessibility() {
    document.querySelector(".app-shell").inert=false;
    modal.classList.add("hidden");
    (accessibilityOpener?.isConnected ? accessibilityOpener : document.getElementById("accessibility-open")).focus();
  }
  document.getElementById("accessibility-open").addEventListener("click", openAccessibility);
  document.getElementById("footer-accessibility").addEventListener("click", openAccessibility);
  document.getElementById("accessibility-close").addEventListener("click", closeAccessibility);
  document.getElementById("accessibility-done").addEventListener("click", closeAccessibility);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeAccessibility();
  });
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAccessibility();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...modal.querySelectorAll("button, input")].filter((element) => !element.disabled);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  Object.entries(accessibilityControls).forEach(([key, control]) => {
    control.addEventListener("change", () => {
      document.body.classList.toggle(classNames[key], control.checked);
      document.dispatchEvent(new Event("arteria-accessibility"));
      try {
        const saved = JSON.parse(localStorage.getItem("arteria-accessibility") || "{}");
        localStorage.setItem("arteria-accessibility", JSON.stringify({ ...saved, [key]: control.checked }));
      } catch (error) {
        showToast("This preference will apply for this visit, but could not be saved on this device.");
      }
    });
  });

  document.getElementById("footer-about").addEventListener("click", (event) => {
    event.preventDefault();
    showToast(translate("common.prototypeToast"));
  });

  function appendMessage(text, sender) {
    const message = document.createElement("div");
    message.className = `chat-message ${sender === "user" ? "user-message" : "aria-message"}`;
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = sender === "user" ? "J" : "A";
    const content = document.createElement("div");
    content.className = "message-content";
    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.textContent = translate(sender === "user" ? "care.userMeta" : "care.ariaMeta");
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;
    content.append(meta, bubble);
    message.append(avatar, content);
    chatLog.append(message);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  const emergencyWords = /\b(chest pain|chest hurts|shortness of breath|can't breathe|cannot breathe|trouble breathing|difficulty breathing|fainted|fainting|coughing blood|cough blood|sudden breathlessness)\b/i;
  const concerningWords = /\b(one leg|calf|leg swelling|swollen leg|leg pain|warm leg|red leg|dvt|blood clot|clot)\b/i;
  function companionReply(message) {
    const emergencySymptoms = /\b(dolor en el pecho|falta de aire|dificultad para respirar|no puedo respirar|me cuesta respirar|desmayo|me desmay[eé]|toser sangre|toso sangre)\b/i;
    const possibleClotSymptoms = /\b(una pierna|pantorrilla|pierna hinchada|pierna inflamada|hinchaz[oó]n|dolor en la pierna|pierna caliente|pierna roja|tvp|co[aá]gulo|co[aá]gulos)\b/i;
    if (emergencyWords.test(message) || emergencySymptoms.test(message)) {
      return translate("care.emergencyReply");
    }
    if (concerningWords.test(message) || possibleClotSymptoms.test(message)) {
      return translate("care.symptomReply");
    }
    if (/\b(diagnos\w*|diagn[oó]stic\w*|is it dvt|do i have|am i at risk|interpret|reading|score|result|scan|tengo tvp|riesgo|lectura|resultado|escaneo)\b/i.test(message)) {
      return translate("care.readingReply");
    }
    if (/\b(photon|light|photonic|scan|infrared)\b/i.test(message)) {
      return translate("care.photonReply");
    }
    if (/\b(appointment|doctor|clinician|care team|question|cita|consulta|m[eé]dico|doctora|equipo de atenci[oó]n|pregunta)\b/i.test(message)) {
      return translate("care.appointmentReply");
    }
    if (/\b(movement|walk|exercise|activity|steps|movimiento|caminar|ejercicio|actividad|pasos)\b/i.test(message)) {
      return translate("care.movementReply");
    }
    if (/\b(hello|hi|hey|good morning|hola|buenos d[ií]as|buenas tardes|buenas noches)\b/i.test(message)) {
      return translate("care.helloReply");
    }
    return translate("care.generalReply");
  }

  function sendMessage(text) {
    const cleanText = text.trim();
    if (!cleanText) return;
    appendMessage(cleanText, "user");
    appendMessage(companionReply(cleanText), "aria");
  }
  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(chatInput.value);
    chatInput.value = "";
    chatInput.focus();
  });
  document.querySelectorAll(".suggestion-button").forEach((button) => {
    button.addEventListener("click", () => sendMessage(button.textContent));
  });
  document.getElementById("clear-chat").addEventListener("click", () => {
    chatLog.replaceChildren();
    appendMessage(translate("care.startOver"), "aria");
    chatInput.focus();
  });

  document.getElementById("voice-button").addEventListener("click", () => {
    const speech = window.speechSynthesis;
    if (!speech || typeof SpeechSynthesisUtterance === "undefined") {
      showToast(translate("common.readAloudUnavailable"));
      return;
    }
    const latestReply = [...chatLog.querySelectorAll(".aria-message .message-bubble")].at(-1);
    if (!latestReply) {
      showToast(translate("common.noReply"));
      return;
    }
    speech.cancel();
    const utterance = new SpeechSynthesisUtterance(latestReply.textContent);
    utterance.rate = 0.95;
    utterance.lang = currentLanguage === "es" ? "es-ES" : "en-US";
    utterance.onerror = () => showToast(translate("common.readAloudError"));
    speech.speak(utterance);
  });

  async function fetchBounded(url, options = {}) {
    const response=await fetch(url, {...options, signal: options.signal || AbortSignal.timeout(12000), referrerPolicy:'no-referrer'});
    return response;
  }
  // coordinates rounded btw
  //this is the nearby care thingie. it uses openstreetmaps api
  const locationConsent = document.getElementById("location-consent");
  const useLocationButton = document.getElementById("use-location-button");
  const areaSearchForm = document.getElementById("area-search-form");
  const areaQuery = document.getElementById("area-query");
  const serviceType = document.getElementById("service-type");
  const searchRadius = document.getElementById("search-radius");
  const stepFreeFilter = document.getElementById("step-free-filter");
  const locatorStatus = document.getElementById("locator-status");
  const serviceResults = document.getElementById("service-results");
  const resultsTitle = document.getElementById("results-title");
  const resultsCount = document.getElementById("results-count");
  let nearbyServices = [];
  let lastSearchPoint = null;
  let lastPlaceLabel = "";
  let searchRequest = 0;
  let geocoderRequest = 0;
  let geolocationRequest = 0;
  let isLoadingNearbyServices = false;
  let nearbyAbort = null, geocoderAbort = null;

  locationConsent.addEventListener("change", () => {
    useLocationButton.disabled = !locationConsent.checked;
    if(!locationConsent.checked){geolocationRequest++;nearbyAbort?.abort();geocoderAbort?.abort();searchRequest++;isLoadingNearbyServices=false;nearbyServices=[];lastSearchPoint=null;lastPlaceLabel="";serviceResults.replaceChildren();resultsCount.classList.add("hidden");setLocatorStatus(translate("locator.initialStatus"));}
  });
  //well i think its obvi but just checking if the user has given consent to use their location. if they have, the button is enabled. if not, it is disabled.

  function setLocatorStatus(message, isError = false) {
    locatorStatus.textContent = message;
    locatorStatus.classList.toggle("error", isError);
    locatorStatus.classList.remove("hidden");
  }

  function categoryForService(tags) {
    const name = `${tags.name || ""} ${tags.extra?.["healthcare:speciality"] || ""} ${tags.healthcare || ""} ${tags.amenity || ""} ${tags.osm_value || ""}`;
    if (/\b(vascular|phlebolog)\b/i.test(name)) return "locator.vascularCategory";
    if (/\b(ultrasound|sonograph|radiology|imaging|diagnostic)\b/i.test(name)) return "locator.imagingCategory";
    //ooh ok this part is relaly improtant lots of room to add in stuff if needed
    if (["urgent_care","emergency"].includes(tags.osm_value) || /\b(urgent|emergency|accident|casualty)\b/i.test(name)) {
      return "locator.urgentCategory";
    }
    if (tags.osm_value === "hospital") return "locator.hospitalCategory";
    if (/^(clinic|doctor|doctors|urgent_care|emergency|radiology|diagnostic_imaging|medical_laboratory)$/.test(tags.osm_value || "")) {
      return "locator.clinicsCategory";
    }
    return "locator.otherCategory";
  }
//AIed this part
  function matchesPreferences(service) {
    const matchesAccess = !stepFreeFilter.checked || service.wheelchairAccessible;
    const matchesRadius = service.distanceKm <= Number(searchRadius.value);
    const categories={vascular:['locator.vascularCategory'],ultrasound:['locator.imagingCategory'],urgent:['locator.urgentCategory'],general:['locator.clinicsCategory']};
    const matchesType=serviceType.value==='all'||categories[serviceType.value]?.includes(service.category);
    return matchesAccess && matchesRadius && matchesType;
  }

  function serviceAddress(tags) {
    const street = [tags.housenumber, tags.street].filter(Boolean).join(" ");
    return [street, tags.city, tags.postcode].filter(value=>typeof value==="string" && value).join(", ").slice(0,300) || (currentLanguage==="es" ? "Dirección no indicada" : "Address not listed");
  }

  function createServiceCard(service) {
    const card = document.createElement("article");
    card.className = "card service-card";

    const heading = document.createElement("div");
    heading.className = "service-card-heading";

    const title = document.createElement("h3");
    title.textContent = service.name;
//this is the title of the service card, which is the name of the service
    const distance = document.createElement("span");
    distance.className = "service-distance";
    distance.textContent = translate("locator.distance").replace("{distance}", service.distanceKm.toFixed(1));
    heading.append(title, distance);

    const category = document.createElement("span");
    category.className = "service-category";
    category.textContent = translate(service.category);

    const address = document.createElement("p");
    address.className = "service-address";
    address.textContent = service.address;

    const footer = document.createElement("div");
    footer.className = "service-card-footer";

    const access = document.createElement("span");
    access.className = service.wheelchairAccessible ? "access-tag accessible" : "access-tag";
    access.textContent = translate(
      service.wheelchairAccessible ? "locator.accessListed" : "locator.accessUnknown"
    );

    const mapLink = document.createElement("a");
    mapLink.className = "text-button";
    mapLink.href = `https://www.openstreetmap.org/?mlat=${service.latitude}&mlon=${service.longitude}#map=17/${service.latitude}/${service.longitude}`;
    mapLink.target = "_blank";
    mapLink.rel = "noopener noreferrer";
    mapLink.textContent = translate("locator.viewMap");
    mapLink.setAttribute(
      "aria-label",
      translate("locator.mapAria").replace("{name}", service.name)
    );

    footer.append(access, mapLink);
    card.append(heading, category, address, footer);
    return card;
  }

  function renderServices() {
    if (!lastSearchPoint || isLoadingNearbyServices) return;

    const matchingServices = nearbyServices
      .filter(matchesPreferences)
      .sort((first, second) => first.distanceKm - second.distanceKm);

    serviceResults.replaceChildren(...matchingServices.map(createServiceCard));
    resultsCount.textContent = matchingServices.length === 1
      ? translate("locator.placeCountOne")
      : translate("locator.placeCount").replace("{count}", String(matchingServices.length));
    resultsCount.classList.remove("hidden");

    if (matchingServices.length === 0) {
      setLocatorStatus(
        nearbyServices.length
          ? translate("locator.noMatch")
          : translate("locator.noServices")
      );
      return;
    }

    locatorStatus.textContent = translate("locator.showing").replace("{place}", lastPlaceLabel);
    locatorStatus.classList.remove("hidden", "error");
  }

  function distanceBetweenKm(firstLatitude, firstLongitude, secondLatitude, secondLongitude) {
    const radians = (degrees) => (degrees * Math.PI) / 180;
    const latitudeDifference = radians(secondLatitude - firstLatitude);
    const longitudeDifference = radians(secondLongitude - firstLongitude);
    const arc =
      Math.sin(latitudeDifference / 2) ** 2 +
      Math.cos(radians(firstLatitude)) *
        Math.cos(radians(secondLatitude)) *
        Math.sin(longitudeDifference / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
  }

  async function searchNearbyServices(latitude, longitude, placeLabel) {
    nearbyAbort?.abort(); nearbyAbort=new AbortController();
    const requestNumber = ++searchRequest;
    if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>85||Math.abs(longitude)>180){setLocatorStatus(translate("locator.searchFailed"),true);return;}
    const queryLatitude = Number(latitude.toFixed(3));
    const queryLongitude = Number(longitude.toFixed(3));
    lastSearchPoint = { latitude: queryLatitude, longitude: queryLongitude };
    lastPlaceLabel = placeLabel;
    isLoadingNearbyServices = true;
    nearbyServices = [];
    serviceResults.replaceChildren();
    resultsCount.classList.add("hidden");
    resultsTitle.textContent = translate("locator.placeNear").replace("{place}", placeLabel);
    setLocatorStatus(translate("locator.loadingServices"));

    const latitudeDelta = Number(searchRadius.value) / 111.32;
    const longitudeDelta = latitudeDelta / Math.cos((queryLatitude * Math.PI) / 180);
    const boundingBox = [
      queryLongitude - longitudeDelta,
      queryLatitude - latitudeDelta,
      queryLongitude + longitudeDelta,
      queryLatitude + latitudeDelta
    ].join(",");
    const searchTerms = {
      all: "health clinic",
      vascular: "vascular clinic",
      ultrasound: "ultrasound",
      urgent: "urgent care",
      general: "doctor"
    };
    const searchUrl = new URL("https://photon.komoot.io/api/");
    searchUrl.searchParams.set("q", searchTerms[serviceType.value]);
    searchUrl.searchParams.set("lat", String(queryLatitude));
    searchUrl.searchParams.set("lon", String(queryLongitude));
    searchUrl.searchParams.set("bbox", boundingBox);
    searchUrl.searchParams.set("limit", "30");
    searchUrl.searchParams.set("lang", currentLanguage);

    try {
      const response = await fetchBounded(searchUrl, { headers: { Accept: "application/json" }, signal: AbortSignal.any([nearbyAbort.signal,AbortSignal.timeout(12000)]) });

      if (!response.ok) {
        throw new Error(`Nearby search returned status ${response.status}.`);
      }

      const data = await response.json();
      if (requestNumber !== searchRequest) return;

      isLoadingNearbyServices = false;
      nearbyServices = (Array.isArray(data.features) ? data.features : [])
        .map((feature) => {
          const tags = feature.properties || {};
          const [longitude, latitude] = feature.geometry?.coordinates || [];
          const isHealthService = [
            "clinic",
            "doctor",
            "doctors",
            "hospital",
            "urgent_care",
            "emergency",
            "radiology",
            "diagnostic_imaging",
            "medical_laboratory"
          ]
            .includes(tags.osm_value);
          const isAnimalService = /\b(veterinary|animal|pet)\b/i.test(tags.name || "") ||
            tags.osm_value === "veterinary";

          if (
            !Number.isFinite(latitude) || Math.abs(latitude)>90 ||
            !Number.isFinite(longitude) || Math.abs(longitude)>180 ||
            typeof tags.name !== "string" || !tags.name.trim() ||
            !isHealthService ||
            isAnimalService
          ) {
            return null;
          }

          return {
            name: tags.name.slice(0,200),
            category: categoryForService(tags),
            address: serviceAddress(tags),
            distanceKm: distanceBetweenKm(queryLatitude, queryLongitude, latitude, longitude),
            latitude,
            longitude,
            wheelchairAccessible: tags.extra?.wheelchair === "yes"
          };
        })
        .filter((service) => service && service.distanceKm <= Number(searchRadius.value));

      renderServices();
    } catch (error) {
      if (requestNumber !== searchRequest) return;
      isLoadingNearbyServices = false;
      console.error("Nearby care search failed:", error);
      resultsTitle.textContent = translate("locator.searchFailedTitle");
      setLocatorStatus(translate("locator.searchFailed"), true);
    }
  }

  useLocationButton.addEventListener("click", () => {
    if (!locationConsent.checked) return;
    if (!navigator.geolocation) {
      setLocatorStatus(translate("locator.locationUnavailable"), true);
      return;
    }

    nearbyAbort?.abort();geocoderAbort?.abort();nearbyServices=[];serviceResults.replaceChildren();resultsCount.classList.add("hidden");
    const requestNumber = ++geolocationRequest;
    geocoderRequest += 1;
    searchRequest += 1;
    isLoadingNearbyServices = false;
    useLocationButton.disabled = true;
    setLocatorStatus(translate("locator.permission"));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (requestNumber !== geolocationRequest) return;
        useLocationButton.disabled = !locationConsent.checked;
        searchNearbyServices(
          position.coords.latitude,
          position.coords.longitude,
          currentLanguage === "es" ? "tu ubicación" : "your location"
        );
      },
      (error) => {
        if (requestNumber !== geolocationRequest) return;
        useLocationButton.disabled = !locationConsent.checked;
        const message =
          error.code === error.PERMISSION_DENIED
            ? translate("locator.locationDenied")
            : translate("locator.locationError");
        setLocatorStatus(message, true);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });

  areaSearchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const searchText = areaQuery.value.trim();
    if (!searchText) return;

    geocoderAbort?.abort(); nearbyAbort?.abort(); geocoderAbort=new AbortController();
    nearbyServices=[];serviceResults.replaceChildren();resultsCount.classList.add("hidden");
    const requestNumber = ++geocoderRequest;
    geolocationRequest += 1;
    searchRequest += 1;
    isLoadingNearbyServices = false;
    setLocatorStatus(translate("locator.loadingArea").replace("{place}", searchText));
    try {
      const geocoderUrl = new URL("https://nominatim.openstreetmap.org/search");
      geocoderUrl.searchParams.set("format", "jsonv2");
      geocoderUrl.searchParams.set("limit", "1");
      geocoderUrl.searchParams.set("q", searchText);
      geocoderUrl.searchParams.set("accept-language", currentLanguage);
      const response = await fetchBounded(geocoderUrl, { headers: { Accept: "application/json" }, signal: AbortSignal.any([geocoderAbort.signal,AbortSignal.timeout(12000)]) });

      if (!response.ok) {
        throw new Error(`Area search returned status ${response.status}.`);
      }

      const matches = await response.json();
      if (requestNumber !== geocoderRequest) return;
      if (!Array.isArray(matches) || !matches.length) {
        setLocatorStatus(translate("locator.noPlace"), true);
        return;
      }

      await searchNearbyServices(
        Number(matches[0].lat),
        Number(matches[0].lon),
        (typeof matches[0].name === "string" ? matches[0].name : searchText).split(",")[0]
      );
    } catch (error) {
      if (requestNumber !== geocoderRequest) return;
      console.error("Area search failed:", error);
      setLocatorStatus(
        translate("locator.areaFailed"),
        true
      );
    }
  });
  languageSelect.addEventListener("change", () => {
    if (lastSearchPoint && !isLoadingNearbyServices) renderServices();
  });

  serviceType.addEventListener("change", () => {
    if (lastSearchPoint) {
      searchNearbyServices(
        lastSearchPoint.latitude,
        lastSearchPoint.longitude,
        lastPlaceLabel
      );
    }
  });
  stepFreeFilter.addEventListener("change", renderServices);
  searchRadius.addEventListener("change", () => {
    if (lastSearchPoint) {
      searchNearbyServices(
        lastSearchPoint.latitude,
        lastSearchPoint.longitude,
        lastPlaceLabel
      );
    }
  });

  //ok back to my own code
  // this is the part that handles the sharing of personal notes. it encrypts the note and allows the user to share it securely via email.
  const shareForm = document.getElementById("share-form");
  const shareName = document.getElementById("share-name");
  const shareEmail = document.getElementById("share-email");
  const shareNotes = document.getElementById("share-notes");
  const sharePassphrase = document.getElementById("share-passphrase");
  const sharePassphraseConfirm = document.getElementById("share-passphrase-confirm");
  const shareConsent = document.getElementById("share-consent");
  const shareSubmit = document.getElementById("share-submit");
  const shareStatus = document.getElementById("share-status");
  const encryptedFileInput = document.getElementById("encrypted-file");
  //this is the part that handles the decryption of the shared personal notes. it allows the user to enter the passphrase and decrypt the note.
  const decryptPassphrase = document.getElementById("decrypt-passphrase");
  const decryptButton = document.getElementById("decrypt-button");
  const decryptStatus = document.getElementById("decrypt-status");
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const encryptedFileHeader = "ARTERIA-ENCRYPTED-V1\n";
  //wow i want to chagne this name
  const encryptionIterations = 310000;
  //iterations we can chagne prolly fi needed ?? try to keep it high enough to be secure but not too high to be slow
  const maxEncryptedFileBytes = 48 * 1024;
  //once again see if we can change this if needed. this is the max size of the encrypted file that can be sent via email. if the file is too large, it will not be sent and an error message will be displayed.
//might be a nice feature to alow it to accomodate larger file sizes

  function setShareStatus(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle("error", isError);
  }
//aied this part cuz how do u make files liek that bruh
  function encodeBase64(bytes) {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function decodeBase64(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  async function deriveEncryptionKey(passphrase, salt) {
    const passphraseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: encryptionIterations,
        hash: "SHA-256"
      },
      passphraseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  function buildPersonalNote() {
    const timestamp = new Intl.DateTimeFormat(currentLanguage === "es" ? "es" : "en", {
      dateStyle: "long",
      timeStyle: "short"
    }).format(new Date());
    const name = shareName.value.trim();
    const notes = shareNotes.value.trim();

    if (currentLanguage === "es") {
      return [
        "NOTA PERSONAL DE ARTERIA",
        "Prototipo conceptual · No es un expediente médico ni un documento clínico",
        `Fecha: ${timestamp}`,
        name ? `Nombre: ${name}` : "",
        "",
        "NOTAS PARA MI EQUIPO DE ATENCIÓN",
        notes || "No se agregaron notas.",
        "",
        "Esta nota fue escrita por la persona usuaria. Los datos de demostración de Arteria no son mediciones médicas.",
        "No uses esta nota para emergencias. Si necesitas ayuda urgente, llama al número local de emergencias."
      ].filter((line) => line !== "").join("\n");
    }

    return [
      "ARTERIA PERSONAL NOTE",
      "Not a medical record or clinical document",
      `Date: ${timestamp}`,
      name ? `Name: ${name}` : "",
      "",
      "NOTES FOR MY CARE TEAM",
      notes || "No notes added.",
      "",
      "This note was written by the person using the app. Arteria demo data is not a medical measurement.",
      "Do not use this note for emergencies. If you need urgent help, call your local emergency number."
    ].filter((line) => line !== "").join("\n");
  }

  async function encryptPersonalNote(plainText, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveEncryptionKey(passphrase, salt);
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(plainText)
      )
    );
    return [
      encryptedFileHeader,
      encodeBase64(salt),
      "\n",
      encodeBase64(iv),
      "\n",
      encodeBase64(ciphertext)
    ].join("");
  }

  function localizedServerError(code, fallbackKey) {
    const knownErrors = {
      "Secure email isn’t set up yet. Please try again later.": "sharing.emailSetup",
      "Enter a valid email address.": "sharing.emailInvalid"
    };
    return translate(knownErrors[code] || fallbackKey);
  }

  document.getElementById("download-encrypted").addEventListener("click",async()=>{
    const button=document.getElementById("download-encrypted");
    shareEmail.disabled=true; const valid=shareForm.reportValidity();shareEmail.disabled=false;
    if(!valid)return;
    if(sharePassphrase.value.length<12){setShareStatus(shareStatus,translate("sharing.passwordTooShort"),true);return;}
    if(sharePassphrase.value!==sharePassphraseConfirm.value){setShareStatus(shareStatus,translate("sharing.passwordMismatch"),true);return;}
    if(!window.isSecureContext||!window.crypto?.subtle){setShareStatus(shareStatus,translate("sharing.secureRequired"),true);return;}
    button.disabled=true;shareSubmit.disabled=true;setShareStatus(shareStatus,translate("sharing.encrypting"));
    try{
      const encrypted=await encryptPersonalNote(buildPersonalNote(),sharePassphrase.value);
      if(encoder.encode(encrypted).byteLength>maxEncryptedFileBytes)throw new Error('size');
      const url=URL.createObjectURL(new Blob([encrypted],{type:'application/octet-stream'}));
      const link=document.createElement('a');link.href=url;link.download='arteria-encrypted-note.arteria';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setShareStatus(shareStatus,currentLanguage==='es'?'Nota cifrada descargada. Conserva la frase de contraseña por separado.':'Encrypted note downloaded. Keep the passphrase separately.');
    }catch{setShareStatus(shareStatus,translate("sharing.encryptionFailed"),true);}
    finally{button.disabled=false;shareSubmit.disabled=false;}
  });
  document.getElementById("clear-note").addEventListener("click",()=>{shareForm.reset();setShareStatus(shareStatus,'');});
  shareForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!shareForm.reportValidity()) return;
    if (!shareEmail.value.trim() || !shareEmail.validity.valid) {setShareStatus(shareStatus,translate("sharing.emailInvalid"),true);shareEmail.focus();return;}
    if (!shareConsent.checked) {setShareStatus(shareStatus,currentLanguage==="es"?"Confirma el consentimiento antes de enviar por correo.":"Confirm consent before emailing.",true);return;}

    const passphrase = sharePassphrase.value;
    if (passphrase.length < 12) {
      setShareStatus(shareStatus, translate("sharing.passwordTooShort"), true);
      sharePassphrase.focus();
      return;
    }
    if (passphrase !== sharePassphraseConfirm.value) {
      setShareStatus(shareStatus, translate("sharing.passwordMismatch"), true);
      sharePassphraseConfirm.focus();
      return;
    }
    if (!window.isSecureContext || !window.crypto?.subtle) {
      setShareStatus(shareStatus, translate("sharing.secureRequired"), true);
      return;
    }

    shareSubmit.disabled = true;
    document.getElementById("download-encrypted").disabled=true;
    setShareStatus(shareStatus, translate("sharing.encrypting"));

    try {
      const encryptedFile = encryptPersonalNote(buildPersonalNote(), passphrase);
      const encryptedContents = await encryptedFile;
      if (encoder.encode(encryptedContents).byteLength > maxEncryptedFileBytes) {
        throw new Error("The encrypted report is too large to email.");
      }

      setShareStatus(shareStatus, translate("sharing.sending"));
      const response = await fetchBounded("/.netlify/functions/share-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: shareEmail.value.trim(),
          encryptedFile: encryptedContents,
          language: currentLanguage,
          website: document.getElementById("share-website").value
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "The email service couldn’t send your file. Please try again.");
      }

      setShareStatus(shareStatus, translate("sharing.sent"));
      sharePassphrase.value = "";
      sharePassphraseConfirm.value = "";
    } catch (error) {
      console.error("Encrypted share request failed:", error);
      const message = error instanceof Error ? error.message : "";
      const fallback = message.includes("couldn’t be reached")
        ? "sharing.emailUnavailable"
        : "sharing.sendFailed";
      setShareStatus(
        shareStatus,
        localizedServerError(message, fallback),
        true
      );
    } finally {
      shareSubmit.disabled = false;
      document.getElementById("download-encrypted").disabled=false;
    }
  });
  //this is the part that handles the decryption of the shared personal notes. it allows the user to enter the passphrase and decrypt the note.

  decryptButton.addEventListener("click", async () => {
    const file = encryptedFileInput.files?.[0];
    if (!file) {
      setShareStatus(decryptStatus, translate("sharing.badFile"), true);
      encryptedFileInput.focus();
      return;
    }
    if (file.size > maxEncryptedFileBytes) {
      setShareStatus(decryptStatus, translate("sharing.badFile"), true);
      return;
    }
    if (!decryptPassphrase.value) {
      setShareStatus(decryptStatus, translate("sharing.passwordRequired"), true);
      decryptPassphrase.focus();
      return;
    }
    if (!window.isSecureContext || !window.crypto?.subtle) {
      setShareStatus(decryptStatus, translate("sharing.secureRequired"), true);
      return;
    }

    decryptButton.disabled = true;
    setShareStatus(decryptStatus, translate("sharing.decrypting"));
    try {
      const serializedFile = await file.text();
      if (encoder.encode(serializedFile).byteLength > maxEncryptedFileBytes) {
        throw new Error("invalid encrypted file");
      }
      const parts = serializedFile.split("\n");
      if (parts.length !== 4 || `${parts[0]}\n` !== encryptedFileHeader) {
        throw new Error("invalid encrypted file");
      }

      const salt = decodeBase64(parts[1]);
      const iv = decodeBase64(parts[2]);
      const ciphertext = decodeBase64(parts[3]);
      if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) {
        throw new Error("invalid encrypted file");
      }

      const key = await deriveEncryptionKey(decryptPassphrase.value, salt);
      const clearText = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
      );
      const noteBlob = new Blob([clearText], { type: "text/plain;charset=utf-8" });
      const downloadUrl = URL.createObjectURL(noteBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = `arteria-note-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setShareStatus(decryptStatus, translate("sharing.unlocked"));
      decryptPassphrase.value = "";
    } catch (error) {
      console.error("Could not unlock the encrypted Arteria file:", error);
      setShareStatus(
        decryptStatus,
        error instanceof DOMException && error.name === "OperationError"
          ? translate("sharing.wrongPassword")
          : translate("sharing.badFile"),
        true
      );
    } finally {
      decryptButton.disabled = false;
    }
  });
})();
// ok yea all of that up there from like 1200 was AIed maybe? whatever part is the file sharing and location functionality is AIed for disclosure
