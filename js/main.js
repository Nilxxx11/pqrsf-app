// ================================
// CONSTANTES Y CONFIGURACIÓN
// ================================

const REPORT_TYPES = {
    FELICITACIONES: 'Felicitaciones',
    SUGERENCIA: 'Sugerencia',
    QUEJA: 'Queja',
    RECLAMO: 'Reclamo',
    PETICION: 'Petición'
};

const CLIENTES = [
    'Argos', 'Ecopetrol', 'Puerto Bahía', 'Contecar', 'Italco',
    'Americas', 'Hotel Hilton', 'Cementos País', 'Ajover', 'Cimaco',
    'Proelectrica', 'Axalta', 'Counques'
];

const MECANISMOS = [
    'Ninguno', 'Whatsapp', 'Correo', 'Llamada', 'Otro'
];

// ================================
// VARIABLES GLOBALES
// ================================

let currentStep = 1;
let reportData = {
    tipo_reporte: REPORT_TYPES.FELICITACIONES,
    fecha_reporte: new Date().toISOString().split('T')[0]
};

// ================================
// INICIALIZACIÓN
// ================================

document.addEventListener('DOMContentLoaded', function() {
  // 📍 Lugar de los hechos
    const lugarInput = document.getElementById('lugar_hechos');
    if (lugarInput) {
        lugarInput.addEventListener('input', e => {
            reportData.lugar_hechos = e.target.value;
        });
    }
    initializeForm();
    setupEventListeners();
    loadFormTemplates();
});

function initializeForm() {
    // Establecer fecha actual por defecto
    const fechaInput = document.getElementById('fecha_reporte');
    if (fechaInput) {
        fechaInput.value = reportData.fecha_reporte;
    }

    // Inicializar paso 1
    showStep(1);

    // Cargar formulario dinámico inicial
    updateDynamicForm();
}

function setupEventListeners() {
    // Cambiar tipo de reporte
    document.querySelectorAll('input[name="tipo_reporte"]').forEach(radio => {
        radio.addEventListener('change', function() {
            reportData.tipo_reporte = this.value;
            updateDynamicForm();
        });
    });

    // Mecanismo de reporte
    document.querySelectorAll('input[name="mecanismo"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const otroInput = document.getElementById('otro_mecanismo');
            otroInput.disabled = this.value !== 'Otro';
            if (this.value !== 'Otro') otroInput.value = '';
        });
    });

    // Habilitar campo "Otro" mecanismo
    const otroMecanismoInput = document.getElementById('otro_mecanismo');
    if (otroMecanismoInput) {
        otroMecanismoInput.addEventListener('input', function() {
            reportData.otro_mecanismo = this.value;
        });
    }

    // Términos y condiciones
    const acceptTerms = document.getElementById('acceptTerms');
    if (acceptTerms) {
        acceptTerms.addEventListener('change', function() {
            document.getElementById('submitBtn').disabled = !this.checked;
        });
    }

    // Campos del formulario
    setupFormFieldListeners();
}

function setupFormFieldListeners() {
    // Cliente
    const clienteSelect = document.getElementById('cliente');
    if (clienteSelect) {
        clienteSelect.addEventListener('change', function() {
            reportData.cliente = this.value;
        });
    }

    // Nombre reportante
    const nombreInput = document.getElementById('nombre_reportante');
    if (nombreInput) {
        nombreInput.addEventListener('input', function() {
            reportData.nombre_reportante = this.value;
        });
    }

    // Correo reportante
    const correoInput = document.getElementById('correo_reportante');
    if (correoInput) {
        correoInput.addEventListener('input', function() {
            reportData.correo_reportante = this.value;
        });
    }

    // Placa vehículo
    const placaInput = document.getElementById('placa_vehiculo');
    if (placaInput) {
        placaInput.addEventListener('input', function() {
            reportData.placa_vehiculo = this.value;
        });
    }

    // Nombre conductor
    const conductorInput = document.getElementById('nombre_conductor');
    if (conductorInput) {
        conductorInput.addEventListener('input', function() {
            reportData.nombre_conductor = this.value;
        });
    }

    // Fecha reporte
    const fechaInput = document.getElementById('fecha_reporte');
    if (fechaInput) {
        fechaInput.addEventListener('change', function() {
            reportData.fecha_reporte = this.value;
        });
    }
}
function enviarCorreoUsuario(reportData, reportId) {
  const shortId = reportId.substring(0, 8).toUpperCase();

  return emailjs.send("service_5tc9aid", "template_zc63248", {
    destinatario: reportData.correo_reportante,   // ← CLAVE
    to_name: reportData.nombre_reportante,
    report_type: reportData.tipo_reporte,
    report_id: shortId,
    client_name: reportData.cliente,
    report_date: new Date().toLocaleString("es-CO"),
    contact_phone: "+57 318 351 5383",
    contact_email: "pqrsf@transportehb.com.co"
  });
}
function enviarCorreoAdmin(reportData, reportId) {
  const shortId = reportId.substring(0, 8).toUpperCase();

  return emailjs.send("service_5tc9aid", "template_69zkaei", {
    destinatario: ADMIN_EMAIL,                    // ← CLAVE
    report_id: shortId,
    report_type: reportData.tipo_reporte,
    client_name: reportData.cliente,
    reporter_name: reportData.nombre_reportante,
    reporter_email: reportData.correo_reportante,
    report_date: new Date().toLocaleString("es-CO"),
    vehicle_plate: reportData.placa_vehiculo || "No especificada",
    driver_name: reportData.nombre_conductor || "No especificado",
    report_description: reportData.mensaje || reportData.descripcion || "Sin descripción",
    admin_link: "https://pqrs-457c0.firebaseapp.com/admin.html"
  });
}

function handleClienteChange() {
    const select = document.getElementById('cliente');
    const inputOtro = document.getElementById('cliente_otro');

    if (select.value === 'OTRO') {
        inputOtro.style.display = 'block';
        inputOtro.required = true;
    } else {
        inputOtro.style.display = 'none';
        inputOtro.required = false;
        inputOtro.value = '';
    }
}


// ================================
// NAVEGACIÓN ENTRE PASOS
// ================================

function showStep(stepNumber) {
    // Ocultar todos los pasos
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Mostrar paso actual
    const currentStepElement = document.getElementById(`step${stepNumber}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }

    // Actualizar indicador de progreso
    updateProgressIndicator(stepNumber);

    // Actualizar datos del resumen en paso 4
    if (stepNumber === 4) {
        updateSummary();
    }

    currentStep = stepNumber;
}

function nextStep(next) {
    if (!validateCurrentStep()) {
        return;
    }

    saveStepData();
    showStep(next);

    // Scroll al inicio del formulario
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function prevStep(prev) {
    showStep(prev);

    // Scroll al inicio del formulario
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function updateProgressIndicator(step) {
    document.querySelectorAll('.progress-step').forEach((stepElement, index) => {
        const stepNumber = index + 1;
        if (stepNumber <= step) {
            stepElement.classList.add('active');
        } else {
            stepElement.classList.remove('active');
        }
    });
}

// ================================
// VALIDACIÓN DE PASOS
// ================================

function validateCurrentStep() {
    const stepElement = document.getElementById(`step${currentStep}`);
    const requiredFields = stepElement.querySelectorAll('[required]');
    let isValid = true;
    let firstInvalidField = null;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            if (!firstInvalidField) firstInvalidField = field;

            field.classList.add('error');

            // Remover clase error cuando el usuario empiece a escribir
            field.addEventListener('input', function() {
                this.classList.remove('error');
            }, { once: true });
        } else {
            field.classList.remove('error');
        }
    });

    // Validaciones específicas por paso
    if (currentStep === 2) {
        isValid = validateStep2() && isValid;
    }

    if (!isValid && firstInvalidField) {
        firstInvalidField.focus();
        showMessage('Por favor complete todos los campos requeridos', 'error');
        return false;
    }

    return true;
}

function validateStep2() {
    const emailInput = document.getElementById('correo_reportante');
    if (emailInput && emailInput.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            emailInput.classList.add('error');
            showMessage('Por favor ingrese un correo electrónico válido', 'error');
            return false;
        }
    }

    const fechaInput = document.getElementById('fecha_reporte');
    if (fechaInput && fechaInput.value) {
        const selectedDate = new Date(fechaInput.value);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (selectedDate > today) {
            fechaInput.classList.add('error');
            showMessage('La fecha no puede ser futura', 'error');
            return false;
        }
    }

    return true;
}

function saveStepData() {
    // Los datos ya se guardan en tiempo real mediante los event listeners
    // Esta función es para cualquier dato adicional que necesite procesamiento
    if (currentStep === 3) {
        saveDynamicFormData();
    }
}

// ================================
// FORMULARIOS DINÁMICOS
// ================================

function loadFormTemplates() {
    // Esta función podría cargar plantillas desde el servidor
    // Por ahora usamos las plantillas embebidas en el código
}

function updateDynamicForm() {
    const container = document.getElementById('dynamicFormContainer');
    if (!container) return;

    let template = '';

    switch (reportData.tipo_reporte) {
        case REPORT_TYPES.FELICITACIONES:
            template = getFelicitacionesTemplate();
            break;
        case REPORT_TYPES.SUGERENCIA:
            template = getSugerenciaTemplate();
            break;
        case REPORT_TYPES.QUEJA:
            template = getQuejaTemplate();
            break;
        case REPORT_TYPES.RECLAMO:
            template = getReclamoTemplate();
            break;
        case REPORT_TYPES.PETICION:
            template = getPeticionTemplate();
            break;
    }

    container.innerHTML = template;
    setupDynamicFormListeners();
}

function getFelicitacionesTemplate() {
    return `
        <div class="form-group dynamic-form">
            <div class="form-header">
                <h3><i class="fas fa-trophy"></i> FELICITACIONES</h3>
                <p class="form-description">Manifestación efectuada por parte de un protegido o una entidad por la satisfacción experimentada con motivo de algún suceso favorable.</p>
            </div>
            <div class="form-content">
                <label for="mensaje"><i class="fas fa-comment"></i> Mensaje *</label>
                <textarea id="mensaje" rows="5" required
                          placeholder="Describa aquí sus felicitaciones y el motivo de su satisfacción..."></textarea>
                <div class="form-hint">
                    <i class="fas fa-lightbulb"></i> Su retroalimentación nos ayuda a mantener nuestros altos estándares de calidad
                </div>
            </div>
        </div>
    `;
}

function getSugerenciaTemplate() {
    return `
        <div class="form-group dynamic-form">
            <div class="form-header">
                <h3><i class="fas fa-lightbulb"></i> SUGERENCIA</h3>
                <p class="form-description">Es una observación o idea manifestada por un usuario que nos permite identificar oportunidades de mejora.</p>
            </div>
            <div class="form-content">
                <label for="mensaje"><i class="fas fa-comment"></i> Mensaje *</label>
                <textarea id="mensaje" rows="5" required
                          placeholder="Comparta con nosotros su sugerencia para mejorar nuestro servicio..."></textarea>
                <div class="form-hint">
                    <i class="fas fa-lightbulb"></i> Valoramos cada sugerencia como una oportunidad para crecer
                </div>
            </div>
        </div>
    `;
}

function getQuejaTemplate() {
    return `
        <div class="form-group dynamic-form">
            <div class="form-header">
                <h3><i class="fas fa-exclamation-triangle"></i> QUEJA</h3>
                <p class="form-description">Manifestación de inconformidad relacionada con conductas del conductor o condiciones del vehículo.</p>
            </div>

            <div class="categories-grid">
                <div class="category">
                    <h4><i class="fas fa-user-tie"></i> CONDUCTAS DEL CONDUCTOR</h4>
                    <div class="checkbox-group">
                        ${generateCheckbox('conductor_queja', 'Actitud de servicio', 'conductor1')}
                        ${generateCheckbox('conductor_queja', 'Agresión verbal o física', 'conductor2')}
                        ${generateCheckbox('conductor_queja', 'Presentación personal', 'conductor3')}
                        ${generateCheckbox('conductor_queja', 'Incumplimiento normas SST Y SEGURIDAD VIAL', 'conductor4')}
                        ${generateCheckbox('conductor_queja', 'Actos inseguros', 'conductor5')}
                        ${generateCheckbox('conductor_queja', 'Descenso de pasajero en zona no autorizada', 'conductor6')}
                        ${generateCheckbox('conductor_queja', 'Abastecimiento de combustible con usuarios a bordo', 'conductor7')}
                        ${generateCheckbox('conductor_queja', 'Usuario recogido en sitio no autorizado', 'conductor8')}
                        ${generateCheckbox('conductor_queja', 'Abordaje de terceros al vehículo', 'conductor9')}
                        ${generateCheckbox('conductor_queja', 'Desconocimiento de la ruta', 'conductor10')}
                        ${generateCheckbox('conductor_queja', 'Otro', 'conductor11')}
                    </div>
                    <input type="text" id="otro_conductor_queja" class="otro-input"
                           placeholder="Especifique otra conducta..." disabled>
                </div>

                <div class="category">
                    <h4><i class="fas fa-car"></i> CONDICIONES DEL VEHÍCULO</h4>
                    <div class="checkbox-group">
                        ${generateCheckbox('vehiculo_queja', 'Fallas mecánicas visibles', 'vehiculo1')}
                        ${generateCheckbox('vehiculo_queja', 'Luces, frenos o direccionales defectuosos', 'vehiculo2')}
                        ${generateCheckbox('vehiculo_queja', 'Puertas o ventanas en mal funcionamiento', 'vehiculo3')}
                        ${generateCheckbox('vehiculo_queja', 'Condiciones que afectan la seguridad o comodidad del usuario', 'vehiculo4')}
                        ${generateCheckbox('vehiculo_queja', 'Mal estado de llantas', 'vehiculo5')}
                        ${generateCheckbox('vehiculo_queja', 'Sillas, pisos o ventanas en mal estado de higiene', 'vehiculo6')}
                        ${generateCheckbox('vehiculo_queja', 'Otro', 'vehiculo7')}
                    </div>
                    <input type="text" id="otro_vehiculo_queja" class="otro-input"
                           placeholder="Especifique otra condición..." disabled>
                </div>
            </div>

            <div class="form-content">
                <label for="descripcion"><i class="fas fa-file-alt"></i> Descripción de la queja *</label>
                <textarea id="descripcion" rows="5" required
                          placeholder="Describa en detalle la situación que generó la queja..."></textarea>
                <div class="form-hint">
                    <i class="fas fa-info-circle"></i> Incluya detalles como fecha, hora y ubicación exacta si es posible
                </div>
            </div>
        </div>
    `;
}

function getReclamoTemplate() {
    return `
        <div class="form-group dynamic-form">
            <div class="form-header">
                <h3><i class="fas fa-balance-scale"></i> RECLAMO</h3>
                <p class="form-description">Manifestación por incumplimientos recurrentes o fallas no resueltas previamente.</p>
            </div>

            <div class="categories-grid">
                <div class="category">
                    <h4><i class="fas fa-user-tie"></i> CONDUCTAS DEL CONDUCTOR</h4>
                    <div class="checkbox-group">
                        ${generateCheckbox('conductor_reclamo', 'Incumplimiento de horarios establecidos', 'conductor_r1')}
                        ${generateCheckbox('conductor_reclamo', 'Retrasos frecuentes en la ruta asignada', 'conductor_r2')}
                        ${generateCheckbox('conductor_reclamo', 'No prestación del servicio programado', 'conductor_r3')}
                        ${generateCheckbox('conductor_reclamo', 'Cancelación del servicio sin previo aviso', 'conductor_r4')}
                        ${generateCheckbox('conductor_reclamo', 'Falta de seguimiento', 'conductor_r5')}
                        ${generateCheckbox('conductor_reclamo', 'Otro', 'conductor_r6')}
                    </div>
                    <input type="text" id="otro_conductor_reclamo" class="otro-input"
                           placeholder="Especifique otra conducta..." disabled>
                </div>

                <div class="category">
                    <h4><i class="fas fa-car"></i> CONDICIONES DEL VEHÍCULO</h4>
                    <div class="checkbox-group">
                        ${generateCheckbox('vehiculo_reclamo', 'Condiciones inseguras para el usuario', 'vehiculo_r1')}
                        ${generateCheckbox('vehiculo_reclamo', 'Vehículo diferente al asignado sin autorización', 'vehiculo_r2')}
                        ${generateCheckbox('vehiculo_reclamo', 'Fallos recurrentes no corregidos', 'vehiculo_r3')}
                        ${generateCheckbox('vehiculo_reclamo', 'Falta de soportes o documentos', 'vehiculo_r4')}
                        ${generateCheckbox('vehiculo_reclamo', 'Repetición de quejas previamente reportadas', 'vehiculo_r5')}
                        ${generateCheckbox('vehiculo_reclamo', 'Otro', 'vehiculo_r6')}
                    </div>
                    <input type="text" id="otro_vehiculo_reclamo" class="otro-input"
                           placeholder="Especifique otra condición..." disabled>
                </div>
            </div>

            <div class="form-content">
                <label for="descripcion"><i class="fas fa-file-alt"></i> Descripción del reclamo *</label>
                <textarea id="descripcion" rows="5" required
                          placeholder="Describa en detalle el reclamo, incluyendo fechas anteriores si es un problema recurrente..."></textarea>
                <div class="form-hint">
                    <i class="fas fa-history"></i> Mencione si este problema ha ocurrido anteriormente
                </div>
            </div>
        </div>
    `;
}

function getPeticionTemplate() {
    return `
        <div class="form-group dynamic-form">
            <div class="form-header">
                <h3><i class="fas fa-question-circle"></i> PETICIÓN</h3>
                <p class="form-description">Solicitud formal de información, documentos o servicios específicos.</p>
            </div>

            <div class="form-content">
                <h4><i class="fas fa-list-check"></i> Seleccione el tipo de petición:</h4>
                <div class="checkbox-group">
                    ${generateCheckbox('peticion_opciones', 'Solicitud de información sobre rutas y horarios', 'peticion1')}
                    ${generateCheckbox('peticion_opciones', 'Solicitud de políticas, procedimientos o protocolos del servicio', 'peticion2')}
                    ${generateCheckbox('peticion_opciones', 'Solicitud de cambios o ajustes en rutas', 'peticion3')}
                    ${generateCheckbox('peticion_opciones', 'Solicitud de ampliación o modificación de horarios', 'peticion4')}
                    ${generateCheckbox('peticion_opciones', 'Solicitud de información sobre tipos de vehículos disponibles', 'peticion5')}
                    ${generateCheckbox('peticion_opciones', 'Solicitud de cambio de conductor', 'peticion6')}
                    ${generateCheckbox('peticion_opciones', 'Solicitud de cambio temporal de ruta', 'peticion7')}
                    ${generateCheckbox('peticion_opciones', 'Solicitud de refuerzo de servicio en horas pico', 'peticion8')}
                    ${generateCheckbox('peticion_opciones', 'Solicitud de justificación por retrasos del servicio', 'peticion9')}
                    ${generateCheckbox('peticion_opciones', 'Solicitud de confirmación de horarios de recogida o entrega', 'peticion10')}
                    ${generateCheckbox('peticion_opciones', 'Otro', 'peticion11')}
                </div>
                <input type="text" id="otro_peticion" class="otro-input"
                       placeholder="Especifique otra petición..." disabled>
            </div>

            <div class="form-content">
                <label for="descripcion"><i class="fas fa-file-alt"></i> Descripción de la petición *</label>
                <textarea id="descripcion" rows="5" required
                          placeholder="Describa en detalle su petición, incluyendo información específica que necesite..."></textarea>
                <div class="form-hint">
                    <i class="fas fa-calendar-alt"></i> Indique si requiere esta información para una fecha específica
                </div>
            </div>
        </div>
    `;
}

function generateCheckbox(name, label, id) {
    return `
        <label class="checkbox-label" for="${id}">
            <input type="checkbox" name="${name}" value="${label}" id="${id}">
            <span class="checkmark"></span>
            <span>${label}</span>
        </label>
    `;
}

function setupDynamicFormListeners() {
    // Configurar checkboxes "Otro"
    document.querySelectorAll('input[type="checkbox"][value="Otro"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const categoryDiv = this.closest('.category') || this.closest('.form-content');
            const otroInput = categoryDiv ? categoryDiv.querySelector('.otro-input') : null;

            if (otroInput) {
                otroInput.disabled = !this.checked;
                if (!this.checked) otroInput.value = '';

                // Guardar valor cuando se escribe
                otroInput.addEventListener('input', function() {
                    const category = this.id.includes('conductor') ? 'conductor' :
                                   this.id.includes('vehiculo') ? 'vehiculo' : 'peticion';
                    const type = this.id.includes('queja') ? 'queja' :
                                this.id.includes('reclamo') ? 'reclamo' : 'general';

                    const key = `otro_${category}_${type}`;
                    reportData[key] = this.value;
                });
            }
        });
    });

    // Configurar mensaje/descripción
    const mensajeInput = document.getElementById('mensaje');
    if (mensajeInput) {
        mensajeInput.addEventListener('input', function() {
            reportData.mensaje = this.value;
        });
    }

    const descripcionInput = document.getElementById('descripcion');
    if (descripcionInput) {
        descripcionInput.addEventListener('input', function() {
            reportData.descripcion = this.value;
        });
    }

    // Configurar checkboxes de categorías
    document.querySelectorAll('input[type="checkbox"]:not([value="Otro"])').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            saveCategoryData();
        });
    });
}

function saveCategoryData() {
    const tipo = reportData.tipo_reporte.toLowerCase();

    if (tipo === 'queja' || tipo === 'reclamo') {
        const conductorCheckboxes = document.querySelectorAll(`input[name="conductor_${tipo}"]:checked`);
        const vehiculoCheckboxes = document.querySelectorAll(`input[name="vehiculo_${tipo}"]:checked`);

        reportData[`categoria_conductor_${tipo}`] = Array.from(conductorCheckboxes)
            .map(cb => cb.value)
            .filter(value => value !== 'Otro');

        reportData[`categoria_vehiculo_${tipo}`] = Array.from(vehiculoCheckboxes)
            .map(cb => cb.value)
            .filter(value => value !== 'Otro');
    } else if (tipo === 'petición') {
        const peticionCheckboxes = document.querySelectorAll('input[name="peticion_opciones"]:checked');
        reportData.categoria_peticion = Array.from(peticionCheckboxes)
            .map(cb => cb.value)
            .filter(value => value !== 'Otro');
    }
}

function saveDynamicFormData() {
    saveCategoryData();

    // Guardar valores de campos "Otro"
    const otroInputs = document.querySelectorAll('.otro-input:not([disabled])');
    otroInputs.forEach(input => {
        const id = input.id;
        if (id.includes('conductor')) {
            const type = id.includes('queja') ? 'queja' : 'reclamo';
            const key = `otro_conductor_${type}`;
            reportData[key] = input.value;
        } else if (id.includes('vehiculo')) {
            const type = id.includes('queja') ? 'queja' : 'reclamo';
            const key = `otro_vehiculo_${type}`;
            reportData[key] = input.value;
        } else if (id.includes('peticion')) {
            reportData.otro_peticion = input.value;
        }
    });

    // Guardar mensaje/descripción
    const mensajeInput = document.getElementById('mensaje');
    if (mensajeInput) {
        reportData.mensaje = mensajeInput.value;
    }

    const descripcionInput = document.getElementById('descripcion');
    if (descripcionInput) {
        reportData.descripcion = descripcionInput.value;
    }
}

// ================================
// RESUMEN Y ENVÍO
// ================================

function updateSummary() {
    // Tipo de reporte
    const summaryTipo = document.getElementById('summaryTipo');
    if (summaryTipo) {
        summaryTipo.textContent = reportData.tipo_reporte;
        summaryTipo.className = `type-badge badge-${reportData.tipo_reporte.toLowerCase()}`;
    }

    // Información general
    document.getElementById('summaryCliente').textContent = reportData.cliente || 'No especificado';
    document.getElementById('summaryReportante').textContent = reportData.nombre_reportante || 'No especificado';
    document.getElementById('summaryCorreo').textContent = reportData.correo_reportante || 'No especificado';
    document.getElementById('summaryFecha').textContent = reportData.fecha_reporte ?
        formatDate(reportData.fecha_reporte) : 'No especificada';

    // Información del servicio
    document.getElementById('summaryPlaca').textContent = reportData.placa_vehiculo || 'No especificada';
    document.getElementById('summaryConductor').textContent = reportData.nombre_conductor || 'No especificado';

    // Mecanismo
    let mecanismo = document.querySelector('input[name="mecanismo"]:checked')?.value || 'Ninguno';
    if (mecanismo === 'Otro' && reportData.otro_mecanismo) {
        mecanismo = `${mecanismo}: ${reportData.otro_mecanismo}`;
    }
    document.getElementById('summaryMecanismo').textContent = mecanismo;

    // Detalles específicos
    const detallesDiv = document.getElementById('summaryDetalles');
    if (detallesDiv) {
        detallesDiv.innerHTML = generateSummaryDetails();
    }
}

function generateSummaryDetails() {
    const tipo = reportData.tipo_reporte.toLowerCase();
    let html = '';

    if (tipo === 'felicitaciones' || tipo === 'sugerencia') {
        html = `<p><strong>Mensaje:</strong> ${reportData.mensaje || 'No especificado'}</p>`;
    } else if (tipo === 'queja' || tipo === 'reclamo') {
        html = `
            <p><strong>Categorías conductor:</strong><br>
            ${reportData[`categoria_conductor_${tipo}`]?.join(', ') || 'Ninguna'}</p>
            <p><strong>Categorías vehículo:</strong><br>
            ${reportData[`categoria_vehiculo_${tipo}`]?.join(', ') || 'Ninguna'}</p>
            <p><strong>Descripción:</strong><br>
            ${reportData.descripcion || 'No especificada'}</p>

            ${reportData[`otro_conductor_${tipo}`] ?
                `<p><strong>Otro conductor:</strong> ${reportData[`otro_conductor_${tipo}`]}</p>` : ''}

            ${reportData[`otro_vehiculo_${tipo}`] ?
                `<p><strong>Otro vehículo:</strong> ${reportData[`otro_vehiculo_${tipo}`]}</p>` : ''}
        `;
    } else if (tipo === 'petición') {
        html = `
            <p><strong>Opciones:</strong><br>
            ${reportData.categoria_peticion?.join(', ') || 'Ninguna'}</p>
            <p><strong>Descripción:</strong><br>
            ${reportData.descripcion || 'No especificada'}</p>

            ${reportData.otro_peticion ?
                `<p><strong>Otra petición:</strong> ${reportData.otro_peticion}</p>` : ''}
        `;
    }

    return html;
}
function resetForm() {
    reportData = {
        tipo_reporte: REPORT_TYPES.FELICITACIONES,
        fecha_reporte: new Date().toISOString().split('T')[0]
    };

    document.getElementById('cliente').value = '';
    document.getElementById('nombre_reportante').value = '';
    document.getElementById('correo_reportante').value = '';
    document.getElementById('placa_vehiculo').value = '';
    document.getElementById('nombre_conductor').value = '';
    document.getElementById('acceptTerms').checked = false;

    document.querySelector('input[name="mecanismo"][value="Ninguno"]').checked = true;
    document.getElementById('lugar_hechos').value = '';
reportData.lugar_hechos = '';

    updateDynamicForm?.(); // opcional
}

function prepareFirebaseData() {
    const clienteSelect = document.getElementById('cliente').value;
    const clienteOtro = document.getElementById('cliente_otro')?.value.trim();

    const clienteFinal =
        clienteSelect === 'OTRO'
            ? clienteOtro
            : clienteSelect;

    return {
        tipo_reporte: reportData.tipo_reporte,
        cliente: clienteFinal,
        nombre_reportante: reportData.nombre_reportante,
        correo_reportante: reportData.correo_reportante,
        fecha_reporte: reportData.fecha_reporte,

        // 📍 NUEVO CAMPO
        lugar_hechos: reportData.lugar_hechos || '',

        placa_vehiculo: reportData.placa_vehiculo || '',
        nombre_conductor: reportData.nombre_conductor || '',
        estado: 'Pendiente',
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
    };
}



function validateFinalData() {
    const clienteSelect = document.getElementById('cliente').value;
    const clienteOtro = document.getElementById('cliente_otro')?.value.trim();

    if (!reportData.tipo_reporte) return false;
    if (!clienteSelect) return false;

    if (clienteSelect === 'OTRO' && !clienteOtro) {
        console.error('Cliente "Otro" vacío');
        return false;
    }

    if (!reportData.nombre_reportante?.trim()) return false;
    if (!reportData.correo_reportante?.trim()) return false;
    if (!reportData.fecha_reporte) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reportData.correo_reportante)) {
        console.error('Email inválido');
        return false;
    }

    return true;
}



async function submitPQRS() {
    // 0️⃣ Validar términos
    const acceptTerms = document.getElementById('acceptTerms');
    if (!acceptTerms || !acceptTerms.checked) {
        showMessage('Debe aceptar los términos y condiciones', 'error');
        return;
    }

    // 1️⃣ Validar datos
    if (!validateFinalData()) {
        showMessage('Por favor complete todos los campos requeridos', 'error');
        return;
    }

    // 2️⃣ UI loading
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;

    try {
        // 3️⃣ Preparar datos
        const firebaseData = prepareFirebaseData();

        // 4️⃣ Guardar en Firebase
        const reportRef = database.ref('pqrs_reports').push();
        await reportRef.set(firebaseData);
        const reportId = reportRef.key;

        console.log('✅ Reporte guardado en Firebase:', reportId);

        // 5️⃣ 📩 Correo al USUARIO (plantilla usuario)
        await enviarCorreoUsuario(firebaseData, reportId);

        // 6️⃣ 📩 Correo al ADMIN (plantilla admin)
        await enviarCorreoAdmin(firebaseData, reportId);

        console.log('📧 Correos enviados correctamente');

        // 7️⃣ Mensaje de éxito
        showMessage(`
            <div class="message-success">
                <i class="fas fa-check-circle"></i>
                <div>
                    <h4>¡Reporte enviado exitosamente!</h4>
                    <p>Su número de seguimiento es:
                       <strong>${reportId.substring(0, 8).toUpperCase()}</strong></p>
                    <p>Recibirá un correo de confirmación en
                       <strong>${firebaseData.correo_reportante}</strong></p>
                    <p>Nos pondremos en contacto en un plazo máximo de 48 horas hábiles.</p>
                </div>
            </div>
        `, 'success');

        // 8️⃣ Reset
        setTimeout(() => {
            resetForm();
            showStep(1);
        }, 5000);

    } catch (error) {
        console.error('❌ Error enviando PQRS:', error);
        showMessage('Ocurrió un error al enviar el reporte', 'error');
    } finally {
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Reporte';
        submitBtn.disabled = false;
    }
}


// ================================
// UTILIDADES
// ================================

function showMessage(content, type = 'info') {
    const container = document.getElementById('messageContainer');
    const messageContent = document.getElementById('messageContent');

    if (!container || !messageContent) return;

    messageContent.innerHTML = content;
    container.className = `message-container message-${type}`;
    container.style.display = 'block';

    // Auto-ocultar después de 10 segundos para mensajes de éxito
    if (type === 'success') {
        setTimeout(hideMessage, 10000);
    }

    // Scroll al mensaje
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideMessage() {
    const container = document.getElementById('messageContainer');
    if (container) {
        container.style.display = 'none';
    }
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day); // 👈 fecha LOCAL, sin UTC
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}


function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ================================
// EXPORTAR FUNCIONES
// ================================

// Hacer funciones disponibles globalmente
window.formNavigation = {
    nextStep,
    prevStep,
    showStep
};

window.formSubmission = {
    submitPQRS
};

// ================================
// MANEJO DE OFFLINE
// ================================

// Detectar cambios en conexión
window.addEventListener('online', function() {
    console.log('🟢 Conexión restablecida');
    if (typeof showMessage === 'function') {
        showMessage('Conexión restablecida. Puede enviar su reporte.', 'success');
    }
});

window.addEventListener('offline', function() {
    console.log('🔴 Sin conexión a internet');
    if (typeof showMessage === 'function') {
        showMessage('Sin conexión a internet. Complete el formulario y envíelo cuando se restaure la conexión.', 'warning');
    }
});
