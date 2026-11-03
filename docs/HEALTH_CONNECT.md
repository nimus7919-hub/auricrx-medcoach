# Health Connect · Android, teléfono · v1

## Implementación y compilación

Se requiere **una nueva compilación nativa Android**. Una actualización OTA no añade el SDK ni los permisos. Expo Go y APK anteriores muestran un mensaje informativo sin intentar cargar el módulo; iOS oculta los accesos.

`modules/health-connect/android` es una biblioteca local equivalente a un wrapper de React Native Health Connect: usa directamente el SDK oficial `androidx.health.connect:connect-client:1.1.0-alpha11`, un puente RN y `plugins/withHealthConnect.js`. Esta versión conserva compatibilidad con compileSdk 35, AGP 8.8.2, Kotlin 2.0.21, Expo SDK 53 y RN 0.79; la versión estable 1.1.0 del SDK exige compileSdk 36 y AGP 8.9.1. No se añade una dependencia npm descargable. El intento inicial de instalar el wrapper npm fue bloqueado por la red del entorno.

El plugin configura minSdk 26, la dependencia Maven, el registro del módulo y del contrato de permisos, los cuatro permisos, la consulta del paquete `com.google.android.apps.healthdata`, la actividad de privacidad para Android 13 y anteriores y su alias protegido para Android 14+. Copia los fuentes Kotlin y genera el aviso nativo desde `modules/health-connect/privacy.json`; el texto es el mismo en JS y en la actividad accesible sin iniciar sesión. La carpeta Android existente también tiene esta configuración aplicada. Health Connect necesita Android 9 o posterior en teléfonos compatibles; Android 8 conserva el resto de la app.

La compilación necesita acceso a Google Maven para resolver el SDK. No es necesario ejecutar prebuild para compilar la carpeta Android actual. Si se regenera, el plugin vuelve a aplicar esta integración. Revisar la declaración y la política publicada antes de distribuir la compilación.

## Play Console

En Policy > App content, completar Health apps y la declaración de acceso a Health Connect. Caso de uso: **Fitness, wellness and coaching**; actividad/bienestar, historial y gráficas para el propio usuario. No diagnóstico ni tratamiento. Adjuntar una demostración del consentimiento, permiso del sistema, pantalla de actividad y desconexión. Declarar exactamente estos permisos de lectura:

| Permiso | Justificación |
| --- | --- |
| `android.permission.health.READ_HEART_RATE` | Mostramos al usuario su historial y gráficas de frecuencia cardíaca sincronizados desde sus wearables y apps, dentro del teléfono. |
| `android.permission.health.READ_RESTING_HEART_RATE` | Mostramos al usuario el promedio de su frecuencia cardíaca en reposo de esta semana y la anterior, sin interpretación médica. |
| `android.permission.health.READ_STEPS` | Mostramos al usuario sus pasos de hoy y el historial de los últimos siete días, usando los agregados de Health Connect. |
| `android.permission.health.READ_EXERCISE` | Mostramos al usuario las sesiones de ejercicio de esta semana con tipo, duración y fecha. |

No solicitar escritura, rutas de ejercicio, lectura en segundo plano ni historial extendido. No hay notificaciones, objetivos de frecuencia cardíaca, puntuaciones, IA, publicidad, vinculación con medicamentos o inferencias clínicas. La vista usa azul marino, dorado y gris. No está limitada a Pro; el punto de entrada `HEALTH_CONNECT_ENABLED` permite incorporar después una regla de disponibilidad sin modificar el tratamiento de datos.

## Data safety

Para esta función, la categoría de datos accedidos/recopilados localmente es **Health and fitness** (Health information y Fitness information: frecuencia cardíaca, frecuencia en reposo, pasos y ejercicio).

| Pregunta | Respuesta para esta función |
| --- | --- |
| Categoría de datos | Salud/fitness |
| Uso | Funcionalidad opcional: historial y gráficas de bienestar solicitados por el usuario |
| Compartidos con terceros | No |
| Almacenamiento/procesamiento | Solo en el dispositivo; registros importados solo en memoria de la pantalla |
| Enviados fuera del dispositivo | No; ni al servidor de AuricRX, ni a OpenAI, ni al contexto Alfred/Mimi/Pawlmer, analítica o logs |
| Consentimiento | Expreso, casilla inicialmente desmarcada, antes del permiso Android |
| Borrado | Ajustes > Privacidad > Desconectar Health Connect; borra consentimiento y datos locales y revoca permisos |

**Precisar el significado de “collected” en el formulario:** Google define recopilación en Data safety como transmisión fuera del dispositivo; el procesamiento exclusivamente local no se declara como recopilación fuera del dispositivo. No marcar envío de salud/fitness por esta integración. La declaración de permisos de Health Connect sí debe incluir los cuatro tipos accedidos. Las respuestas globales de la app deben reflejar por separado sus otras funciones y SDK; este documento no afirma que toda la app carezca de recopilación.

## Aviso de privacidad: texto para publicar

### Datos de actividad y salud de Health Connect

Con tu permiso, AuricRX MedCoach leerá de Health Connect tu frecuencia cardíaca, frecuencia cardíaca en reposo, pasos y sesiones de ejercicio (que pueden venir de Samsung Health, Fitbit, Garmin, Mi Fitness u otras apps). Los usamos solo para mostrarte tu historial y gráficas dentro de la app. No hacemos diagnósticos. No vendemos estos datos, no los usamos para publicidad y no los compartimos con terceros. Se quedan en tu teléfono y no se envían a nuestros servidores. Puedes retirar este permiso cuando quieras en Ajustes > Privacidad o en Health Connect, y borrar los datos importados.

Datos importados de tus apps y dispositivos para fines de bienestar. Pueden no ser exactos. No son un diagnóstico ni sustituyen la valoración de un médico. Si te sientes mal o tienes síntomas, busca atención médica; en una emergencia llama al 911.

Publicar esta misma sección en la política enlazada en Play Console. El aviso de la actividad nativa permanece disponible desde la pantalla de permisos, incluso sin sesión ni JavaScript.

## Consentimiento y datos locales

AsyncStorage guarda solo el consentimiento por usuario: `userId`, `timestamp` ISO, `version: hc-consent-v1`, `grantedTypes`. Este consentimiento deliberadamente no usa el servicio general de consentimientos porque ese servicio transmite al servidor. Rechazarlo o pulsar Ahora no permite seguir usando la app.

Los registros de actividad nunca se agregan al estado global, perfil, medicamentos ni chats. Se consultan únicamente en primer plano tras comprobar consentimiento y los cuatro permisos. Se usa una ventana de siete días y las dos semanas de calendario para reposo; los pasos se agregan para evitar duplicación entre fuentes. Las lecturas paginan todos los registros. Sin registros se muestra texto neutral; cero pasos puede significar falta de sincronización. El origen muestra el nombre de la app si Android permite resolverlo; de lo contrario, su paquete.

Al ir al fondo, salir de la pantalla o desconectar, se descartan los datos en memoria. No hay caché persistente de datos importados. Desconectar incrementa una revisión que impide reutilizar resultados pendientes, borra el consentimiento y llama `revokeAllPermissions`. Si la revocación falla se indica al usuario que retire los permisos en Health Connect; las lecturas locales quedan bloqueadas igualmente. No se borran los registros originales de otras apps en Health Connect.

## Verificación

Ejecutar `node scripts/check-health-connect.cjs` para comprobar consentimiento local, ausencia del módulo nativo, denegación, aislamiento por usuario, desconexión, revocación fallida y descarte de una lectura pendiente. El script también transforma los JS modificados sin cargar la configuración Babel del proyecto ni archivos de entorno.

`node scripts/bundle-health-connect.cjs` genera un bundle Android aislado de la función y sus dependencias en `.health-connect-check/activity-health.android.bundle.js` (Metro añade la extensión `.js`). Usa un transformador explícito sin cargar la configuración Babel/dotenv del proyecto. No sustituye el bundle completo de producción con su configuración de publicación.

En una nueva compilación y teléfono físico, verificar: Android 13 con proveedor ausente/actualizado, Android 14+, dispositivo incompatible, rechazo total/parcial, revocación externa, volver del fondo, fuente sin registros, registros de varias apps, desconexión y cambio de cuenta. Confirmar que la casilla inicia desmarcada y no aparece el permiso Android antes de aceptar. Revisar la actividad de privacidad desde el diálogo Android antes del login. La validación JS no sustituye estas pruebas nativas.

## Fuentes consultadas

- [Configuración oficial, permisos, actividad y consultas](https://developer.android.com/health-and-fitness/health-connect/get-started).
- [Agregación de datos](https://developer.android.com/health-and-fitness/health-connect/aggregate-data).
- [Versiones del SDK AndroidX](https://developer.android.com/jetpack/androidx/releases/health-connect).
- [README del wrapper React Native y requisitos](https://github.com/matinzd/react-native-health-connect).
- [Declaración de aplicaciones de salud](https://support.google.com/googleplay/android-developer/answer/14738291).
- [Definiciones y formulario Data safety](https://support.google.com/googleplay/android-developer/answer/10787469).
