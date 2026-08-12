/* Strings shared by every my* service.
 *
 * Loaded before the service dictionary, both in the browser and — through a vm
 * sandbox — on the server. A service dictionary then carries only the words
 * that are genuinely its own, and calls window.mergeI18N() to produce the
 * window.I18N the page and the API read.
 *
 * Keys must stay identical across languages; `npm run check:i18n` in any
 * service fails on the ones that drift apart. */
'use strict';

/* Endonyms shown in the language switcher. */
window.LANG_NAMES = {
  en: 'English',
  ru: 'Русский',
  es: 'Español',
  zh: '中文',
  hi: 'हिन्दी',
  ar: 'العربية',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  tr: 'Türkçe',
  uk: 'Українська',
};

/* Right-to-left languages. */
window.RTL_LANGS = ['ar'];

/* Locales used for date and number formatting. */
window.LANG_LOCALES = {
  en: 'en-GB', ru: 'ru-RU', es: 'es-ES', zh: 'zh-CN', hi: 'hi-IN', ar: 'ar-EG',
  pt: 'pt-BR', fr: 'fr-FR', de: 'de-DE', ja: 'ja-JP', tr: 'tr-TR', uk: 'uk-UA',
};

window.I18N_COMMON = {};

window.I18N_COMMON.en = {
  lang_aria: 'Interface language',

  btn_scan: 'Check',
  btn_rescan: 'Check again',
  btn_copy_json: 'Copy JSON',
  btn_save_json: 'Download JSON',

  toast_copied: 'Copied',
  toast_copy_fail: 'Could not copy',

  v_yes: 'yes',
  v_no: 'no',
  v_ok: 'ok',
  v_unknown: 'unknown',
  v_none: 'none',
  v_present: 'present',
  v_absent: 'absent',
  v_valid: 'valid',
  v_invalid: 'invalid',
  v_partial: 'partial',
  v_enabled: 'enabled',
  v_disabled: 'disabled',
  v_not_checked: 'not checked',

  hero_grade: 'Overall grade',
  no_target: 'nothing checked yet',
  grade_pending: 'waiting',

  card_flags: 'Findings',
  card_raw: 'Raw report',
  note_flags: 'Every finding carries a stable identifier, so the JSON output can be watched from a script. Severity describes the finding, not your site as a whole.',

  k_total_score: 'Weighted score',
  k_checked_at: 'Checked at',
  k_elapsed: 'Took',

  sev_critical: 'critical',
  sev_high: 'high',
  sev_medium: 'medium',
  sev_low: 'low',
  sev_info: 'info',

  st_ok: 'ok',
  st_safe: 'safe',
  st_warning: 'warning',
  st_weak: 'weak',
  st_missing: 'missing',
  st_unknown: 'unknown',
  st_partial: 'partial',
  st_failed: 'failed',
  st_info: 'note',
  st_vulnerable: 'vulnerable',

  err_invalid_host: 'That does not look like a host name.',
  err_domain_expected: 'This check needs a domain name, not an IP address.',
  err_invalid_port: 'That port number is out of range.',
  err_port_not_allowed: 'This service will not connect to that port.',
  err_dns_failed: 'The name did not resolve.',
  err_private_address: 'That address belongs to a private network, and this service will not probe one.',
  err_unreachable: 'The host did not answer.',
  err_scan_timeout: 'The check took too long and was stopped.',
  err_stage_timeout: 'One step took too long and was stopped.',
  err_scan_failed: 'The check could not be completed.',
  err_busy: 'Too many checks are running right now. Try again in a moment.',
  err_bad_output: 'Unsupported output format. Use json, yaml or html.',
  err_network: 'The browser could not reach the service.',
  err_bad_response: 'The service returned something unreadable.',
  err_timeout: 'The request timed out.',

  cap_scan_incomplete: 'the check was incomplete, so no grade was given',
  incomplete_title: 'Incomplete report',
  incomplete_body: 'Some of the checks did not get an answer, so the grade is withheld rather than guessed. What is missing is listed below.',

  api_hint: 'API: <code>curl {origin}/{example}</code> — add <code>?output=json</code> or <code>?output=yaml</code> to any address, or use <code>/api/stream/{example}</code> for live progress.',
  empty_examples: 'or try one of these',

  footer_family: 'More tools',
  footer1: 'Open source under the MIT licence. No ads, no registration, no accounts.',
  footer2: 'Nothing you look up is stored, and nothing is shared with anyone.',
  footer3: 'Runs anywhere Docker does, with a single command.',

  svc_myip: 'My IP',
  svc_myssl: 'SSL Test',
  svc_mydns: 'DNS Check',
  svc_mymx: 'Mail Check',
  svc_myheaders: 'Headers Check',
};

window.I18N_COMMON.ru = {
  lang_aria: 'Язык интерфейса',

  btn_scan: 'Проверить',
  btn_rescan: 'Проверить снова',
  btn_copy_json: 'Копировать JSON',
  btn_save_json: 'Скачать JSON',

  toast_copied: 'Скопировано',
  toast_copy_fail: 'Не удалось скопировать',

  v_yes: 'да',
  v_no: 'нет',
  v_ok: 'в порядке',
  v_unknown: 'неизвестно',
  v_none: 'нет',
  v_present: 'есть',
  v_absent: 'отсутствует',
  v_valid: 'корректна',
  v_invalid: 'некорректна',
  v_partial: 'частично',
  v_enabled: 'включено',
  v_disabled: 'выключено',
  v_not_checked: 'не проверялось',

  hero_grade: 'Итоговая оценка',
  no_target: 'пока ничего не проверено',
  grade_pending: 'ожидание',

  card_flags: 'Находки',
  card_raw: 'Отчёт целиком',
  note_flags: 'У каждой находки есть постоянный идентификатор, поэтому за JSON-выводом можно следить скриптом. Уровень описывает саму находку, а не сайт в целом.',

  k_total_score: 'Взвешенный балл',
  k_checked_at: 'Проверено',
  k_elapsed: 'Заняло',

  sev_critical: 'критично',
  sev_high: 'высокий',
  sev_medium: 'средний',
  sev_low: 'низкий',
  sev_info: 'к сведению',

  st_ok: 'в порядке',
  st_safe: 'безопасно',
  st_warning: 'предупреждение',
  st_weak: 'слабо',
  st_missing: 'отсутствует',
  st_unknown: 'неизвестно',
  st_partial: 'частично',
  st_failed: 'сбой',
  st_info: 'заметка',
  st_vulnerable: 'уязвимо',

  err_invalid_host: 'Это не похоже на имя хоста.',
  err_domain_expected: 'Для этой проверки нужно доменное имя, а не IP-адрес.',
  err_invalid_port: 'Номер порта вне допустимого диапазона.',
  err_port_not_allowed: 'Сервис не станет подключаться к этому порту.',
  err_dns_failed: 'Имя не разрешилось.',
  err_private_address: 'Этот адрес принадлежит частной сети, и сервис не станет её проверять.',
  err_unreachable: 'Хост не ответил.',
  err_scan_timeout: 'Проверка заняла слишком много времени и была остановлена.',
  err_stage_timeout: 'Один из этапов занял слишком много времени и был остановлен.',
  err_scan_failed: 'Проверку не удалось завершить.',
  err_busy: 'Сейчас выполняется слишком много проверок. Попробуйте через минуту.',
  err_bad_output: 'Неподдерживаемый формат вывода. Доступны json, yaml и html.',
  err_network: 'Браузер не смог достучаться до сервиса.',
  err_bad_response: 'Сервис вернул нечитаемый ответ.',
  err_timeout: 'Истекло время ожидания запроса.',

  cap_scan_incomplete: 'проверка неполная, поэтому оценка не выставлена',
  incomplete_title: 'Отчёт неполный',
  incomplete_body: 'На часть проверок ответа не пришло, поэтому оценка не выставляется вовсе — вместо того чтобы гадать. Ниже перечислено, чего не хватает.',

  api_hint: 'API: <code>curl {origin}/{example}</code> — добавьте <code>?output=json</code> или <code>?output=yaml</code> к любому адресу, либо используйте <code>/api/stream/{example}</code> для прогресса в реальном времени.',
  empty_examples: 'или попробуйте один из этих',

  footer_family: 'Другие инструменты',
  footer1: 'Открытый исходный код под лицензией MIT. Без рекламы, без регистрации, без аккаунтов.',
  footer2: 'Ничего из проверенного не сохраняется и никому не передаётся.',
  footer3: 'Запускается везде, где есть Docker, одной командой.',

  svc_myip: 'Мой IP',
  svc_myssl: 'Проверка SSL',
  svc_mydns: 'Проверка DNS',
  svc_mymx: 'Проверка почты',
  svc_myheaders: 'Проверка заголовков',
};

window.I18N_COMMON.es = {
  lang_aria: 'Idioma de la interfaz',

  btn_scan: 'Comprobar',
  btn_rescan: 'Comprobar de nuevo',
  btn_copy_json: 'Copiar JSON',
  btn_save_json: 'Descargar JSON',

  toast_copied: 'Copiado',
  toast_copy_fail: 'No se pudo copiar',

  v_yes: 'sí',
  v_no: 'no',
  v_ok: 'correcto',
  v_unknown: 'desconocido',
  v_none: 'ninguno',
  v_present: 'presente',
  v_absent: 'ausente',
  v_valid: 'válido',
  v_invalid: 'no válido',
  v_partial: 'parcial',
  v_enabled: 'activado',
  v_disabled: 'desactivado',
  v_not_checked: 'sin comprobar',

  hero_grade: 'Nota global',
  no_target: 'aún no se ha comprobado nada',
  grade_pending: 'esperando',

  card_flags: 'Hallazgos',
  card_raw: 'Informe completo',
  note_flags: 'Cada hallazgo lleva un identificador estable, de modo que la salida JSON puede vigilarse desde un script. La gravedad describe el hallazgo, no su sitio en conjunto.',

  k_total_score: 'Puntuación ponderada',
  k_checked_at: 'Comprobado',
  k_elapsed: 'Duración',

  sev_critical: 'crítico',
  sev_high: 'alto',
  sev_medium: 'medio',
  sev_low: 'bajo',
  sev_info: 'informativo',

  st_ok: 'correcto',
  st_safe: 'seguro',
  st_warning: 'aviso',
  st_weak: 'débil',
  st_missing: 'ausente',
  st_unknown: 'desconocido',
  st_partial: 'parcial',
  st_failed: 'fallo',
  st_info: 'nota',
  st_vulnerable: 'vulnerable',

  err_invalid_host: 'Eso no parece un nombre de host.',
  err_domain_expected: 'Esta comprobación necesita un nombre de dominio, no una dirección IP.',
  err_invalid_port: 'El número de puerto está fuera de rango.',
  err_port_not_allowed: 'Este servicio no se conectará a ese puerto.',
  err_dns_failed: 'El nombre no se resolvió.',
  err_private_address: 'Esa dirección pertenece a una red privada y este servicio no la sondeará.',
  err_unreachable: 'El host no respondió.',
  err_scan_timeout: 'La comprobación tardó demasiado y se detuvo.',
  err_stage_timeout: 'Un paso tardó demasiado y se detuvo.',
  err_scan_failed: 'No se pudo completar la comprobación.',
  err_busy: 'Hay demasiadas comprobaciones en curso. Inténtelo dentro de un momento.',
  err_bad_output: 'Formato de salida no admitido. Use json, yaml o html.',
  err_network: 'El navegador no pudo alcanzar el servicio.',
  err_bad_response: 'El servicio devolvió algo ilegible.',
  err_timeout: 'La petición agotó el tiempo de espera.',

  cap_scan_incomplete: 'la comprobación quedó incompleta, así que no se otorgó nota',
  incomplete_title: 'Informe incompleto',
  incomplete_body: 'Algunas comprobaciones no obtuvieron respuesta, así que la nota se omite en lugar de adivinarse. Abajo se enumera lo que falta.',

  api_hint: 'API: <code>curl {origin}/{example}</code> — añada <code>?output=json</code> o <code>?output=yaml</code> a cualquier dirección, o use <code>/api/stream/{example}</code> para ver el progreso en vivo.',
  empty_examples: 'o pruebe con uno de estos',

  footer_family: 'Más herramientas',
  footer1: 'Código abierto bajo licencia MIT. Sin anuncios, sin registro, sin cuentas.',
  footer2: 'Nada de lo que consulta se almacena ni se comparte con nadie.',
  footer3: 'Funciona en cualquier sitio donde funcione Docker, con una sola orden.',

  svc_myip: 'Mi IP',
  svc_myssl: 'Prueba SSL',
  svc_mydns: 'Comprobación DNS',
  svc_mymx: 'Comprobación de correo',
  svc_myheaders: 'Comprobación de cabeceras',
};

window.I18N_COMMON.zh = {
  lang_aria: '界面语言',

  btn_scan: '检测',
  btn_rescan: '重新检测',
  btn_copy_json: '复制 JSON',
  btn_save_json: '下载 JSON',

  toast_copied: '已复制',
  toast_copy_fail: '复制失败',

  v_yes: '是',
  v_no: '否',
  v_ok: '正常',
  v_unknown: '未知',
  v_none: '无',
  v_present: '存在',
  v_absent: '缺失',
  v_valid: '有效',
  v_invalid: '无效',
  v_partial: '部分',
  v_enabled: '已启用',
  v_disabled: '已停用',
  v_not_checked: '未检测',

  hero_grade: '总评级',
  no_target: '尚未检测任何目标',
  grade_pending: '等待中',

  card_flags: '检测结果',
  card_raw: '完整报告',
  note_flags: '每条结果都带有固定的标识符，因此可以用脚本监控 JSON 输出。严重程度描述的是该条结果，而非整个站点。',

  k_total_score: '加权得分',
  k_checked_at: '检测时间',
  k_elapsed: '耗时',

  sev_critical: '严重',
  sev_high: '高',
  sev_medium: '中',
  sev_low: '低',
  sev_info: '提示',

  st_ok: '正常',
  st_safe: '安全',
  st_warning: '警告',
  st_weak: '偏弱',
  st_missing: '缺失',
  st_unknown: '未知',
  st_partial: '部分',
  st_failed: '失败',
  st_info: '说明',
  st_vulnerable: '存在漏洞',

  err_invalid_host: '这看起来不像主机名。',
  err_domain_expected: '此项检测需要域名，而不是 IP 地址。',
  err_invalid_port: '端口号超出范围。',
  err_port_not_allowed: '本服务不会连接该端口。',
  err_dns_failed: '该名称未能解析。',
  err_private_address: '该地址属于专用网络，本服务不会对其发起探测。',
  err_unreachable: '主机没有响应。',
  err_scan_timeout: '检测耗时过长，已停止。',
  err_stage_timeout: '某个步骤耗时过长，已停止。',
  err_scan_failed: '检测未能完成。',
  err_busy: '当前同时进行的检测过多，请稍后再试。',
  err_bad_output: '不支持的输出格式。可用 json、yaml 或 html。',
  err_network: '浏览器无法连接到本服务。',
  err_bad_response: '服务返回了无法解析的内容。',
  err_timeout: '请求超时。',

  cap_scan_incomplete: '检测不完整，因此未给出评级',
  incomplete_title: '报告不完整',
  incomplete_body: '部分检测没有收到回应，因此宁可不给评级，也不去猜测。缺失的内容列在下方。',

  api_hint: 'API：<code>curl {origin}/{example}</code> — 在任意地址后加上 <code>?output=json</code> 或 <code>?output=yaml</code>，或使用 <code>/api/stream/{example}</code> 查看实时进度。',
  empty_examples: '或试试下面这些',

  footer_family: '更多工具',
  footer1: 'MIT 许可的开源项目。无广告、无需注册、无账号。',
  footer2: '你查询的内容不会被保存，也不会提供给任何人。',
  footer3: '一条命令即可在任何支持 Docker 的地方运行。',

  svc_myip: '我的 IP',
  svc_myssl: 'SSL 检测',
  svc_mydns: 'DNS 检测',
  svc_mymx: '邮件检测',
  svc_myheaders: '响应头检测',
};

window.I18N_COMMON.hi = {
  lang_aria: 'इंटरफ़ेस की भाषा',

  btn_scan: 'जाँचें',
  btn_rescan: 'दोबारा जाँचें',
  btn_copy_json: 'JSON कॉपी करें',
  btn_save_json: 'JSON डाउनलोड करें',

  toast_copied: 'कॉपी हो गया',
  toast_copy_fail: 'कॉपी नहीं हो सका',

  v_yes: 'हाँ',
  v_no: 'नहीं',
  v_ok: 'ठीक',
  v_unknown: 'अज्ञात',
  v_none: 'कोई नहीं',
  v_present: 'मौजूद',
  v_absent: 'अनुपस्थित',
  v_valid: 'वैध',
  v_invalid: 'अवैध',
  v_partial: 'आंशिक',
  v_enabled: 'सक्षम',
  v_disabled: 'निष्क्रिय',
  v_not_checked: 'जाँचा नहीं गया',

  hero_grade: 'कुल ग्रेड',
  no_target: 'अभी कुछ जाँचा नहीं गया',
  grade_pending: 'प्रतीक्षा',

  card_flags: 'निष्कर्ष',
  card_raw: 'पूरी रिपोर्ट',
  note_flags: 'हर निष्कर्ष का एक स्थायी पहचानकर्ता होता है, इसलिए JSON आउटपुट को स्क्रिप्ट से देखा जा सकता है। गंभीरता उसी निष्कर्ष की है, पूरी साइट की नहीं।',

  k_total_score: 'भारित अंक',
  k_checked_at: 'जाँच का समय',
  k_elapsed: 'समय लगा',

  sev_critical: 'गंभीर',
  sev_high: 'उच्च',
  sev_medium: 'मध्यम',
  sev_low: 'निम्न',
  sev_info: 'सूचना',

  st_ok: 'ठीक',
  st_safe: 'सुरक्षित',
  st_warning: 'चेतावनी',
  st_weak: 'कमज़ोर',
  st_missing: 'अनुपस्थित',
  st_unknown: 'अज्ञात',
  st_partial: 'आंशिक',
  st_failed: 'विफल',
  st_info: 'टिप्पणी',
  st_vulnerable: 'असुरक्षित',

  err_invalid_host: 'यह होस्ट नाम जैसा नहीं लगता।',
  err_domain_expected: 'इस जाँच के लिए डोमेन नाम चाहिए, IP पता नहीं।',
  err_invalid_port: 'पोर्ट संख्या सीमा से बाहर है।',
  err_port_not_allowed: 'यह सेवा उस पोर्ट से नहीं जुड़ेगी।',
  err_dns_failed: 'नाम हल नहीं हुआ।',
  err_private_address: 'यह पता एक निजी नेटवर्क का है, और यह सेवा उसकी जाँच नहीं करेगी।',
  err_unreachable: 'होस्ट ने उत्तर नहीं दिया।',
  err_scan_timeout: 'जाँच में बहुत समय लगा और उसे रोक दिया गया।',
  err_stage_timeout: 'एक चरण में बहुत समय लगा और उसे रोक दिया गया।',
  err_scan_failed: 'जाँच पूरी नहीं हो सकी।',
  err_busy: 'इस समय बहुत सारी जाँचें चल रही हैं। थोड़ी देर बाद कोशिश करें।',
  err_bad_output: 'यह आउटपुट प्रारूप समर्थित नहीं है। json, yaml या html का उपयोग करें।',
  err_network: 'ब्राउज़र सेवा तक नहीं पहुँच सका।',
  err_bad_response: 'सेवा ने कुछ अपठनीय लौटाया।',
  err_timeout: 'अनुरोध का समय समाप्त हो गया।',

  cap_scan_incomplete: 'जाँच अधूरी रही, इसलिए कोई ग्रेड नहीं दिया गया',
  incomplete_title: 'अधूरी रिपोर्ट',
  incomplete_body: 'कुछ जाँचों का उत्तर नहीं मिला, इसलिए ग्रेड का अनुमान लगाने के बजाय उसे रोक दिया गया है। जो नहीं मिला वह नीचे दिया है।',

  api_hint: 'API: <code>curl {origin}/{example}</code> — किसी भी पते में <code>?output=json</code> या <code>?output=yaml</code> जोड़ें, या लाइव प्रगति के लिए <code>/api/stream/{example}</code> का उपयोग करें।',
  empty_examples: 'या इनमें से कोई आज़माएँ',

  footer_family: 'और उपकरण',
  footer1: 'MIT लाइसेंस के तहत मुक्त स्रोत। कोई विज्ञापन नहीं, कोई पंजीकरण नहीं, कोई खाता नहीं।',
  footer2: 'आप जो भी जाँचते हैं वह न संग्रहीत होता है और न किसी को दिया जाता है।',
  footer3: 'जहाँ Docker चलता है वहाँ एक ही आदेश से चलता है।',

  svc_myip: 'मेरा IP',
  svc_myssl: 'SSL जाँच',
  svc_mydns: 'DNS जाँच',
  svc_mymx: 'मेल जाँच',
  svc_myheaders: 'हेडर जाँच',
};

window.I18N_COMMON.ar = {
  lang_aria: 'لغة الواجهة',

  btn_scan: 'افحص',
  btn_rescan: 'افحص من جديد',
  btn_copy_json: 'انسخ JSON',
  btn_save_json: 'نزّل JSON',

  toast_copied: 'تم النسخ',
  toast_copy_fail: 'تعذّر النسخ',

  v_yes: 'نعم',
  v_no: 'لا',
  v_ok: 'سليم',
  v_unknown: 'غير معروف',
  v_none: 'لا شيء',
  v_present: 'موجود',
  v_absent: 'غير موجود',
  v_valid: 'صالح',
  v_invalid: 'غير صالح',
  v_partial: 'جزئي',
  v_enabled: 'مفعّل',
  v_disabled: 'معطّل',
  v_not_checked: 'لم يُفحص',

  hero_grade: 'التقدير العام',
  no_target: 'لم يُفحص شيء بعد',
  grade_pending: 'في الانتظار',

  card_flags: 'الملاحظات',
  card_raw: 'التقرير الكامل',
  note_flags: 'لكل ملاحظة معرّف ثابت، فيمكن مراقبة مخرجات JSON من سكربت. درجة الخطورة تصف الملاحظة نفسها لا الموقع كاملًا.',

  k_total_score: 'الدرجة المرجّحة',
  k_checked_at: 'وقت الفحص',
  k_elapsed: 'استغرق',

  sev_critical: 'حرج',
  sev_high: 'مرتفع',
  sev_medium: 'متوسط',
  sev_low: 'منخفض',
  sev_info: 'للعلم',

  st_ok: 'سليم',
  st_safe: 'آمن',
  st_warning: 'تحذير',
  st_weak: 'ضعيف',
  st_missing: 'غير موجود',
  st_unknown: 'غير معروف',
  st_partial: 'جزئي',
  st_failed: 'أخفق',
  st_info: 'ملاحظة',
  st_vulnerable: 'قابل للاستغلال',

  err_invalid_host: 'هذا لا يبدو اسم مضيف.',
  err_domain_expected: 'هذا الفحص يحتاج اسم نطاق لا عنوان IP.',
  err_invalid_port: 'رقم المنفذ خارج النطاق.',
  err_port_not_allowed: 'لن تتصل هذه الخدمة بذلك المنفذ.',
  err_dns_failed: 'لم يُترجم الاسم إلى عنوان.',
  err_private_address: 'هذا العنوان يخص شبكة خاصة، ولن تفحصها هذه الخدمة.',
  err_unreachable: 'لم يستجب المضيف.',
  err_scan_timeout: 'استغرق الفحص وقتًا طويلًا فأُوقف.',
  err_stage_timeout: 'استغرقت إحدى الخطوات وقتًا طويلًا فأُوقفت.',
  err_scan_failed: 'تعذّر إتمام الفحص.',
  err_busy: 'هناك فحوص كثيرة جارية الآن. حاول بعد قليل.',
  err_bad_output: 'صيغة إخراج غير مدعومة. استخدم json أو yaml أو html.',
  err_network: 'لم يتمكّن المتصفح من الوصول إلى الخدمة.',
  err_bad_response: 'أعادت الخدمة شيئًا غير مقروء.',
  err_timeout: 'انتهت مهلة الطلب.',

  cap_scan_incomplete: 'كان الفحص ناقصًا، فلم يُمنح تقدير',
  incomplete_title: 'تقرير ناقص',
  incomplete_body: 'لم تصل إجابات بعض الفحوص، لذلك حُجب التقدير بدل تخمينه. وفيما يلي ما ينقص.',

  api_hint: 'واجهة برمجية: <code>curl {origin}/{example}</code> — أضف <code>?output=json</code> أو <code>?output=yaml</code> إلى أي عنوان، أو استخدم <code>/api/stream/{example}</code> لمتابعة التقدّم مباشرة.',
  empty_examples: 'أو جرّب أحد هذه',

  footer_family: 'أدوات أخرى',
  footer1: 'مفتوح المصدر برخصة MIT. بلا إعلانات ولا تسجيل ولا حسابات.',
  footer2: 'لا يُحفظ شيء مما تفحصه ولا يُشارَك مع أحد.',
  footer3: 'يعمل بأمر واحد في أي مكان يعمل فيه Docker.',

  svc_myip: 'عنواني',
  svc_myssl: 'فحص SSL',
  svc_mydns: 'فحص DNS',
  svc_mymx: 'فحص البريد',
  svc_myheaders: 'فحص الترويسات',
};

window.I18N_COMMON.pt = {
  lang_aria: 'Idioma da interface',

  btn_scan: 'Verificar',
  btn_rescan: 'Verificar de novo',
  btn_copy_json: 'Copiar JSON',
  btn_save_json: 'Baixar JSON',

  toast_copied: 'Copiado',
  toast_copy_fail: 'Não foi possível copiar',

  v_yes: 'sim',
  v_no: 'não',
  v_ok: 'ok',
  v_unknown: 'desconhecido',
  v_none: 'nenhum',
  v_present: 'presente',
  v_absent: 'ausente',
  v_valid: 'válido',
  v_invalid: 'inválido',
  v_partial: 'parcial',
  v_enabled: 'ativado',
  v_disabled: 'desativado',
  v_not_checked: 'não verificado',

  hero_grade: 'Nota geral',
  no_target: 'nada verificado ainda',
  grade_pending: 'aguardando',

  card_flags: 'Achados',
  card_raw: 'Relatório completo',
  note_flags: 'Cada achado tem um identificador estável, então a saída JSON pode ser acompanhada por script. A gravidade descreve o achado, não o site inteiro.',

  k_total_score: 'Pontuação ponderada',
  k_checked_at: 'Verificado em',
  k_elapsed: 'Levou',

  sev_critical: 'crítico',
  sev_high: 'alto',
  sev_medium: 'médio',
  sev_low: 'baixo',
  sev_info: 'informativo',

  st_ok: 'ok',
  st_safe: 'seguro',
  st_warning: 'aviso',
  st_weak: 'fraco',
  st_missing: 'ausente',
  st_unknown: 'desconhecido',
  st_partial: 'parcial',
  st_failed: 'falhou',
  st_info: 'nota',
  st_vulnerable: 'vulnerável',

  err_invalid_host: 'Isso não parece um nome de host.',
  err_domain_expected: 'Esta verificação precisa de um nome de domínio, não de um endereço IP.',
  err_invalid_port: 'O número da porta está fora do intervalo.',
  err_port_not_allowed: 'Este serviço não vai se conectar a essa porta.',
  err_dns_failed: 'O nome não foi resolvido.',
  err_private_address: 'Esse endereço pertence a uma rede privada, e este serviço não a sonda.',
  err_unreachable: 'O host não respondeu.',
  err_scan_timeout: 'A verificação demorou demais e foi interrompida.',
  err_stage_timeout: 'Uma etapa demorou demais e foi interrompida.',
  err_scan_failed: 'Não foi possível concluir a verificação.',
  err_busy: 'Há verificações demais em andamento. Tente daqui a pouco.',
  err_bad_output: 'Formato de saída não suportado. Use json, yaml ou html.',
  err_network: 'O navegador não conseguiu alcançar o serviço.',
  err_bad_response: 'O serviço devolveu algo ilegível.',
  err_timeout: 'A requisição excedeu o tempo limite.',

  cap_scan_incomplete: 'a verificação ficou incompleta, então nenhuma nota foi dada',
  incomplete_title: 'Relatório incompleto',
  incomplete_body: 'Algumas verificações não obtiveram resposta, então a nota é omitida em vez de adivinhada. O que falta está listado abaixo.',

  api_hint: 'API: <code>curl {origin}/{example}</code> — acrescente <code>?output=json</code> ou <code>?output=yaml</code> a qualquer endereço, ou use <code>/api/stream/{example}</code> para ver o progresso ao vivo.',
  empty_examples: 'ou experimente um destes',

  footer_family: 'Mais ferramentas',
  footer1: 'Código aberto sob licença MIT. Sem anúncios, sem cadastro, sem contas.',
  footer2: 'Nada do que você consulta é armazenado nem compartilhado com ninguém.',
  footer3: 'Roda em qualquer lugar com Docker, com um único comando.',

  svc_myip: 'Meu IP',
  svc_myssl: 'Teste SSL',
  svc_mydns: 'Verificação de DNS',
  svc_mymx: 'Verificação de e-mail',
  svc_myheaders: 'Verificação de cabeçalhos',
};

window.I18N_COMMON.fr = {
  lang_aria: 'Langue de l’interface',

  btn_scan: 'Vérifier',
  btn_rescan: 'Vérifier à nouveau',
  btn_copy_json: 'Copier le JSON',
  btn_save_json: 'Télécharger le JSON',

  toast_copied: 'Copié',
  toast_copy_fail: 'Copie impossible',

  v_yes: 'oui',
  v_no: 'non',
  v_ok: 'correct',
  v_unknown: 'inconnu',
  v_none: 'aucun',
  v_present: 'présent',
  v_absent: 'absent',
  v_valid: 'valide',
  v_invalid: 'invalide',
  v_partial: 'partiel',
  v_enabled: 'activé',
  v_disabled: 'désactivé',
  v_not_checked: 'non vérifié',

  hero_grade: 'Note globale',
  no_target: 'rien de vérifié pour l’instant',
  grade_pending: 'en attente',

  card_flags: 'Constats',
  card_raw: 'Rapport complet',
  note_flags: 'Chaque constat porte un identifiant stable : la sortie JSON peut donc être surveillée par un script. La gravité décrit le constat, pas votre site dans son ensemble.',

  k_total_score: 'Note pondérée',
  k_checked_at: 'Vérifié le',
  k_elapsed: 'Durée',

  sev_critical: 'critique',
  sev_high: 'élevé',
  sev_medium: 'moyen',
  sev_low: 'faible',
  sev_info: 'information',

  st_ok: 'correct',
  st_safe: 'sûr',
  st_warning: 'avertissement',
  st_weak: 'faible',
  st_missing: 'absent',
  st_unknown: 'inconnu',
  st_partial: 'partiel',
  st_failed: 'échec',
  st_info: 'note',
  st_vulnerable: 'vulnérable',

  err_invalid_host: 'Cela ne ressemble pas à un nom d’hôte.',
  err_domain_expected: 'Cette vérification demande un nom de domaine, pas une adresse IP.',
  err_invalid_port: 'Le numéro de port est hors plage.',
  err_port_not_allowed: 'Ce service ne se connectera pas à ce port.',
  err_dns_failed: 'Le nom ne s’est pas résolu.',
  err_private_address: 'Cette adresse appartient à un réseau privé, et ce service ne le sonde pas.',
  err_unreachable: 'L’hôte n’a pas répondu.',
  err_scan_timeout: 'La vérification a pris trop de temps et a été arrêtée.',
  err_stage_timeout: 'Une étape a pris trop de temps et a été arrêtée.',
  err_scan_failed: 'La vérification n’a pas pu aboutir.',
  err_busy: 'Trop de vérifications sont en cours. Réessayez dans un instant.',
  err_bad_output: 'Format de sortie non pris en charge. Utilisez json, yaml ou html.',
  err_network: 'Le navigateur n’a pas pu joindre le service.',
  err_bad_response: 'Le service a renvoyé quelque chose d’illisible.',
  err_timeout: 'La requête a expiré.',

  cap_scan_incomplete: 'la vérification est restée incomplète, aucune note n’a donc été attribuée',
  incomplete_title: 'Rapport incomplet',
  incomplete_body: 'Certaines vérifications n’ont pas obtenu de réponse : la note est retenue plutôt que devinée. Ce qui manque est listé ci-dessous.',

  api_hint: 'API : <code>curl {origin}/{example}</code> — ajoutez <code>?output=json</code> ou <code>?output=yaml</code> à n’importe quelle adresse, ou utilisez <code>/api/stream/{example}</code> pour suivre la progression en direct.',
  empty_examples: 'ou essayez l’un de ceux-ci',

  footer_family: 'Autres outils',
  footer1: 'Logiciel libre sous licence MIT. Sans publicité, sans inscription, sans compte.',
  footer2: 'Rien de ce que vous consultez n’est conservé ni transmis à qui que ce soit.',
  footer3: 'S’exécute partout où Docker fonctionne, avec une seule commande.',

  svc_myip: 'Mon IP',
  svc_myssl: 'Test SSL',
  svc_mydns: 'Contrôle DNS',
  svc_mymx: 'Contrôle e-mail',
  svc_myheaders: 'Contrôle des en-têtes',
};

window.I18N_COMMON.de = {
  lang_aria: 'Sprache der Oberfläche',

  btn_scan: 'Prüfen',
  btn_rescan: 'Erneut prüfen',
  btn_copy_json: 'JSON kopieren',
  btn_save_json: 'JSON herunterladen',

  toast_copied: 'Kopiert',
  toast_copy_fail: 'Kopieren fehlgeschlagen',

  v_yes: 'ja',
  v_no: 'nein',
  v_ok: 'in Ordnung',
  v_unknown: 'unbekannt',
  v_none: 'keine',
  v_present: 'vorhanden',
  v_absent: 'fehlt',
  v_valid: 'gültig',
  v_invalid: 'ungültig',
  v_partial: 'teilweise',
  v_enabled: 'aktiv',
  v_disabled: 'inaktiv',
  v_not_checked: 'nicht geprüft',

  hero_grade: 'Gesamtnote',
  no_target: 'noch nichts geprüft',
  grade_pending: 'wartet',

  card_flags: 'Befunde',
  card_raw: 'Vollständiger Bericht',
  note_flags: 'Jeder Befund trägt eine feste Kennung, sodass sich die JSON-Ausgabe per Skript überwachen lässt. Die Schwere beschreibt den Befund, nicht die Website als Ganzes.',

  k_total_score: 'Gewichtete Punktzahl',
  k_checked_at: 'Geprüft am',
  k_elapsed: 'Dauer',

  sev_critical: 'kritisch',
  sev_high: 'hoch',
  sev_medium: 'mittel',
  sev_low: 'gering',
  sev_info: 'Hinweis',

  st_ok: 'in Ordnung',
  st_safe: 'sicher',
  st_warning: 'Warnung',
  st_weak: 'schwach',
  st_missing: 'fehlt',
  st_unknown: 'unbekannt',
  st_partial: 'teilweise',
  st_failed: 'fehlgeschlagen',
  st_info: 'Anmerkung',
  st_vulnerable: 'angreifbar',

  err_invalid_host: 'Das sieht nicht nach einem Hostnamen aus.',
  err_domain_expected: 'Diese Prüfung braucht einen Domainnamen, keine IP-Adresse.',
  err_invalid_port: 'Die Portnummer liegt außerhalb des gültigen Bereichs.',
  err_port_not_allowed: 'Dieser Dienst verbindet sich nicht mit diesem Port.',
  err_dns_failed: 'Der Name ließ sich nicht auflösen.',
  err_private_address: 'Diese Adresse gehört zu einem privaten Netz, und dieser Dienst prüft ein solches nicht.',
  err_unreachable: 'Der Host hat nicht geantwortet.',
  err_scan_timeout: 'Die Prüfung dauerte zu lange und wurde abgebrochen.',
  err_stage_timeout: 'Ein Schritt dauerte zu lange und wurde abgebrochen.',
  err_scan_failed: 'Die Prüfung konnte nicht abgeschlossen werden.',
  err_busy: 'Es laufen gerade zu viele Prüfungen. Versuchen Sie es gleich noch einmal.',
  err_bad_output: 'Nicht unterstütztes Ausgabeformat. Möglich sind json, yaml und html.',
  err_network: 'Der Browser konnte den Dienst nicht erreichen.',
  err_bad_response: 'Der Dienst lieferte etwas Unlesbares.',
  err_timeout: 'Zeitüberschreitung bei der Anfrage.',

  cap_scan_incomplete: 'die Prüfung blieb unvollständig, daher wurde keine Note vergeben',
  incomplete_title: 'Unvollständiger Bericht',
  incomplete_body: 'Auf einen Teil der Prüfungen kam keine Antwort. Die Note wird deshalb zurückgehalten statt geraten. Was fehlt, steht unten.',

  api_hint: 'API: <code>curl {origin}/{example}</code> — hängen Sie <code>?output=json</code> oder <code>?output=yaml</code> an eine beliebige Adresse an, oder nutzen Sie <code>/api/stream/{example}</code> für den Fortschritt in Echtzeit.',
  empty_examples: 'oder probieren Sie eines davon',

  footer_family: 'Weitere Werkzeuge',
  footer1: 'Quelloffen unter der MIT-Lizenz. Ohne Werbung, ohne Registrierung, ohne Konten.',
  footer2: 'Nichts von dem, was Sie prüfen, wird gespeichert oder weitergegeben.',
  footer3: 'Läuft überall dort, wo Docker läuft — mit einem einzigen Befehl.',

  svc_myip: 'Meine IP',
  svc_myssl: 'SSL-Test',
  svc_mydns: 'DNS-Prüfung',
  svc_mymx: 'Mail-Prüfung',
  svc_myheaders: 'Header-Prüfung',
};

window.I18N_COMMON.ja = {
  lang_aria: '表示言語',

  btn_scan: '検査',
  btn_rescan: '再検査',
  btn_copy_json: 'JSON をコピー',
  btn_save_json: 'JSON をダウンロード',

  toast_copied: 'コピーしました',
  toast_copy_fail: 'コピーできませんでした',

  v_yes: 'はい',
  v_no: 'いいえ',
  v_ok: '問題なし',
  v_unknown: '不明',
  v_none: 'なし',
  v_present: 'あり',
  v_absent: 'なし',
  v_valid: '有効',
  v_invalid: '無効',
  v_partial: '一部',
  v_enabled: '有効',
  v_disabled: '無効',
  v_not_checked: '未確認',

  hero_grade: '総合評価',
  no_target: 'まだ何も検査していません',
  grade_pending: '待機中',

  card_flags: '検出結果',
  card_raw: 'レポート全文',
  note_flags: '検出結果には固定の識別子が付くので、JSON 出力をスクリプトで監視できます。深刻度はその項目についてのものであり、サイト全体の評価ではありません。',

  k_total_score: '加重スコア',
  k_checked_at: '検査日時',
  k_elapsed: '所要時間',

  sev_critical: '致命的',
  sev_high: '高',
  sev_medium: '中',
  sev_low: '低',
  sev_info: '参考',

  st_ok: '問題なし',
  st_safe: '安全',
  st_warning: '警告',
  st_weak: '弱い',
  st_missing: '未設定',
  st_unknown: '不明',
  st_partial: '一部',
  st_failed: '失敗',
  st_info: '注記',
  st_vulnerable: '脆弱',

  err_invalid_host: 'ホスト名には見えません。',
  err_domain_expected: 'この検査には IP アドレスではなくドメイン名が必要です。',
  err_invalid_port: 'ポート番号が範囲外です。',
  err_port_not_allowed: 'このサービスはそのポートには接続しません。',
  err_dns_failed: '名前を解決できませんでした。',
  err_private_address: 'そのアドレスはプライベートネットワークのもので、このサービスは調べません。',
  err_unreachable: 'ホストが応答しませんでした。',
  err_scan_timeout: '検査に時間がかかりすぎたため中止しました。',
  err_stage_timeout: 'ある工程に時間がかかりすぎたため中止しました。',
  err_scan_failed: '検査を完了できませんでした。',
  err_busy: '現在、検査が集中しています。少し待って再試行してください。',
  err_bad_output: '対応していない出力形式です。json、yaml、html が使えます。',
  err_network: 'ブラウザーからサービスに到達できませんでした。',
  err_bad_response: 'サービスが読み取れない応答を返しました。',
  err_timeout: 'リクエストがタイムアウトしました。',

  cap_scan_incomplete: '検査が不完全なため、評価は付けていません',
  incomplete_title: '不完全なレポート',
  incomplete_body: '一部の検査に応答がなかったため、評価を推測せずに保留しています。欠けている内容は以下のとおりです。',

  api_hint: 'API: <code>curl {origin}/{example}</code> — どのアドレスにも <code>?output=json</code> または <code>?output=yaml</code> を付けられます。進行状況を見るには <code>/api/stream/{example}</code> を使ってください。',
  empty_examples: 'または次のいずれかをお試しください',

  footer_family: 'ほかのツール',
  footer1: 'MIT ライセンスのオープンソース。広告なし、登録なし、アカウントなし。',
  footer2: '調べた内容は保存されず、誰にも渡されません。',
  footer3: 'Docker が動く場所ならどこでも、コマンド一つで動きます。',

  svc_myip: 'My IP',
  svc_myssl: 'SSL 検査',
  svc_mydns: 'DNS 検査',
  svc_mymx: 'メール検査',
  svc_myheaders: 'ヘッダー検査',
};

window.I18N_COMMON.tr = {
  lang_aria: 'Arayüz dili',

  btn_scan: 'Denetle',
  btn_rescan: 'Yeniden denetle',
  btn_copy_json: 'JSON’u kopyala',
  btn_save_json: 'JSON’u indir',

  toast_copied: 'Kopyalandı',
  toast_copy_fail: 'Kopyalanamadı',

  v_yes: 'evet',
  v_no: 'hayır',
  v_ok: 'sorunsuz',
  v_unknown: 'bilinmiyor',
  v_none: 'yok',
  v_present: 'var',
  v_absent: 'yok',
  v_valid: 'geçerli',
  v_invalid: 'geçersiz',
  v_partial: 'kısmen',
  v_enabled: 'açık',
  v_disabled: 'kapalı',
  v_not_checked: 'denetlenmedi',

  hero_grade: 'Genel not',
  no_target: 'henüz bir şey denetlenmedi',
  grade_pending: 'bekleniyor',

  card_flags: 'Bulgular',
  card_raw: 'Raporun tamamı',
  note_flags: 'Her bulgunun sabit bir kimliği vardır, böylece JSON çıktısı bir betikle izlenebilir. Önem derecesi bulguyu anlatır, sitenin bütününü değil.',

  k_total_score: 'Ağırlıklı puan',
  k_checked_at: 'Denetim zamanı',
  k_elapsed: 'Süre',

  sev_critical: 'kritik',
  sev_high: 'yüksek',
  sev_medium: 'orta',
  sev_low: 'düşük',
  sev_info: 'bilgi',

  st_ok: 'sorunsuz',
  st_safe: 'güvenli',
  st_warning: 'uyarı',
  st_weak: 'zayıf',
  st_missing: 'yok',
  st_unknown: 'bilinmiyor',
  st_partial: 'kısmen',
  st_failed: 'başarısız',
  st_info: 'not',
  st_vulnerable: 'açık',

  err_invalid_host: 'Bu bir ana makine adına benzemiyor.',
  err_domain_expected: 'Bu denetim IP adresi değil, alan adı ister.',
  err_invalid_port: 'Bağlantı noktası numarası aralık dışında.',
  err_port_not_allowed: 'Bu hizmet o bağlantı noktasına bağlanmaz.',
  err_dns_failed: 'Ad çözümlenemedi.',
  err_private_address: 'Bu adres özel bir ağa ait ve bu hizmet özel ağları yoklamaz.',
  err_unreachable: 'Ana makine yanıt vermedi.',
  err_scan_timeout: 'Denetim çok uzun sürdü ve durduruldu.',
  err_stage_timeout: 'Bir adım çok uzun sürdü ve durduruldu.',
  err_scan_failed: 'Denetim tamamlanamadı.',
  err_busy: 'Şu anda çok fazla denetim çalışıyor. Birazdan tekrar deneyin.',
  err_bad_output: 'Desteklenmeyen çıktı biçimi. json, yaml veya html kullanın.',
  err_network: 'Tarayıcı hizmete ulaşamadı.',
  err_bad_response: 'Hizmet okunamayan bir yanıt döndürdü.',
  err_timeout: 'İstek zaman aşımına uğradı.',

  cap_scan_incomplete: 'denetim eksik kaldı, bu yüzden not verilmedi',
  incomplete_title: 'Eksik rapor',
  incomplete_body: 'Bazı denetimlere yanıt gelmedi; not tahmin edilmek yerine verilmedi. Eksik olanlar aşağıda.',

  api_hint: 'API: <code>curl {origin}/{example}</code> — herhangi bir adrese <code>?output=json</code> ya da <code>?output=yaml</code> ekleyin, ya da canlı ilerleme için <code>/api/stream/{example}</code> kullanın.',
  empty_examples: 'ya da şunlardan birini deneyin',

  footer_family: 'Diğer araçlar',
  footer1: 'MIT lisanslı açık kaynak. Reklam yok, kayıt yok, hesap yok.',
  footer2: 'Sorguladığınız hiçbir şey saklanmaz ve kimseyle paylaşılmaz.',
  footer3: 'Docker’ın çalıştığı her yerde tek komutla çalışır.',

  svc_myip: 'IP’m',
  svc_myssl: 'SSL denetimi',
  svc_mydns: 'DNS denetimi',
  svc_mymx: 'Posta denetimi',
  svc_myheaders: 'Başlık denetimi',
};

window.I18N_COMMON.uk = {
  lang_aria: 'Мова інтерфейсу',

  btn_scan: 'Перевірити',
  btn_rescan: 'Перевірити знову',
  btn_copy_json: 'Копіювати JSON',
  btn_save_json: 'Завантажити JSON',

  toast_copied: 'Скопійовано',
  toast_copy_fail: 'Не вдалося скопіювати',

  v_yes: 'так',
  v_no: 'ні',
  v_ok: 'гаразд',
  v_unknown: 'невідомо',
  v_none: 'немає',
  v_present: 'є',
  v_absent: 'відсутній',
  v_valid: 'коректний',
  v_invalid: 'некоректний',
  v_partial: 'частково',
  v_enabled: 'увімкнено',
  v_disabled: 'вимкнено',
  v_not_checked: 'не перевірялося',

  hero_grade: 'Підсумкова оцінка',
  no_target: 'поки нічого не перевірено',
  grade_pending: 'очікування',

  card_flags: 'Знахідки',
  card_raw: 'Повний звіт',
  note_flags: 'Кожна знахідка має сталий ідентифікатор, тож за JSON-виводом можна стежити скриптом. Рівень описує саму знахідку, а не сайт загалом.',

  k_total_score: 'Зважений бал',
  k_checked_at: 'Перевірено',
  k_elapsed: 'Тривало',

  sev_critical: 'критично',
  sev_high: 'високий',
  sev_medium: 'середній',
  sev_low: 'низький',
  sev_info: 'до відома',

  st_ok: 'гаразд',
  st_safe: 'безпечно',
  st_warning: 'попередження',
  st_weak: 'слабко',
  st_missing: 'відсутній',
  st_unknown: 'невідомо',
  st_partial: 'частково',
  st_failed: 'збій',
  st_info: 'примітка',
  st_vulnerable: 'вразливо',

  err_invalid_host: 'Це не схоже на імʼя хоста.',
  err_domain_expected: 'Для цієї перевірки потрібне доменне імʼя, а не IP-адреса.',
  err_invalid_port: 'Номер порту поза припустимим діапазоном.',
  err_port_not_allowed: 'Сервіс не підключатиметься до цього порту.',
  err_dns_failed: 'Імʼя не розвʼязалося.',
  err_private_address: 'Ця адреса належить приватній мережі, і сервіс її не перевірятиме.',
  err_unreachable: 'Хост не відповів.',
  err_scan_timeout: 'Перевірка тривала надто довго й була зупинена.',
  err_stage_timeout: 'Один з етапів тривав надто довго й був зупинений.',
  err_scan_failed: 'Перевірку не вдалося завершити.',
  err_busy: 'Зараз виконується забагато перевірок. Спробуйте за хвилину.',
  err_bad_output: 'Непідтримуваний формат виводу. Доступні json, yaml і html.',
  err_network: 'Браузер не зміг звʼязатися із сервісом.',
  err_bad_response: 'Сервіс повернув нечитабельну відповідь.',
  err_timeout: 'Час очікування запиту вичерпано.',

  cap_scan_incomplete: 'перевірка неповна, тому оцінку не виставлено',
  incomplete_title: 'Звіт неповний',
  incomplete_body: 'На частину перевірок відповіді не надійшло, тому оцінку не виставляють зовсім — замість того щоб гадати. Нижче перелічено, чого бракує.',

  api_hint: 'API: <code>curl {origin}/{example}</code> — додайте <code>?output=json</code> або <code>?output=yaml</code> до будь-якої адреси, або скористайтеся <code>/api/stream/{example}</code> для поступу в реальному часі.',
  empty_examples: 'або спробуйте один із цих',

  footer_family: 'Інші інструменти',
  footer1: 'Відкритий код за ліцензією MIT. Без реклами, без реєстрації, без облікових записів.',
  footer2: 'Нічого з перевіреного не зберігається й нікому не передається.',
  footer3: 'Запускається всюди, де є Docker, однією командою.',

  svc_myip: 'Мій IP',
  svc_myssl: 'Перевірка SSL',
  svc_mydns: 'Перевірка DNS',
  svc_mymx: 'Перевірка пошти',
  svc_myheaders: 'Перевірка заголовків',
};

/**
 * Merges a service dictionary over the shared one.
 *
 * A service may override a shared key — `btn_scan` reads better as "Scan" in
 * myssl than as "Check" — but it never has to repeat one.
 *
 * The English half of the service dictionary is laid down under every language
 * before that language's own entries. That is what lets a service ship its
 * vocabulary in fewer than twelve languages without the interface breaking: the
 * chrome — buttons, errors, severities, the names of the sibling tools — is
 * translated here for all twelve, and a service string that has not been
 * translated yet appears in English rather than as a raw key. `check:i18n`
 * reports which languages are in that state, and fails on one that is *partly*
 * translated, because that is drift rather than a decision.
 */
window.mergeI18N = function mergeI18N(own) {
  var merged = {};
  var languages = Object.keys(window.I18N_COMMON);
  for (var i = 0; i < languages.length; i++) {
    var lang = languages[i];
    merged[lang] = Object.assign({}, window.I18N_COMMON[lang], own.en || {}, own[lang] || {});
  }
  // Kept so the check script can tell "not translated yet" from "translated
  // and then a key went missing".
  window.I18N_OWN = own;
  return merged;
};
