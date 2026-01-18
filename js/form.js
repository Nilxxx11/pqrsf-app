// Elementos del DOM
document.addEventListener('DOMContentLoaded', function() {
    // Configurar fecha actual por defecto
    const fechaInput = document.getElementById('fechaReporte');
    const today = new Date().toISOString().split('T')[0];
    fechaInput.value = today;
    fechaInput.max = today;
    
    // Referencias a elementos
    const tipoReporteGroup = document.getElementById('tipoReporteGroup');
    const seccionDinamica = document.getElementById('seccionDinamica');
    const otroMecanismoContainer = document.getElementById('otroMecanismoContainer');
    const otroMecanismoInput = document.getElementById('otroMecanismo');
    const mecanismoReporteInputs = document.querySelectorAll('input[name="mecanismoReporte"]');
    const form = document.getElementById('pqrsForm');
    const modal = document.getElementById('confirmationModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeModalX = document.querySelector('.close-modal');
    
    // Plantillas para cada tipo de reporte
    const templates = {
        'Queja': createQuejaTemplate(),
        'Reclamo': createReclamoTemplate(),
        'Peticion': createPeticionTemplate(),
        'Felicitaciones': createFelicitacionesTemplate(),
        'Sugerencia': createSugerenciaTemplate()
    };
    
    // Event Listeners
    tipoReporteGroup.addEventListener('change', handleTipoReporteChange);
    
    mecanismoReporteInputs.forEach(input => {
        input.addEventListener('change', handleMecanismoChange);
    });
    
    form.addEventListener('submit', handleFormSubmit);
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            form.reset();
            fechaInput.value = today;
        });
    }
    
    if (closeModalX) {
        closeModalX.addEventListener('click', () => {
            modal.style.display = 'none';
            form.reset();
            fechaInput.value = today;
        });
    }
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            form.reset();
            fechaInput.value = today;
        }
    });
    
    // Funciones
    function handleTipoReporteChange(e) {
        const tipoReporte = e.target.value;
        if (templates[tipoReporte]) {
            seccionDinamica.innerHTML = templates[tipoReporte];
            
            // Añadir event listeners para checkboxes "Otro"
            const otrosCheckboxes = seccionDinamica.querySelectorAll('input[type="checkbox"][value^="Otro"]');
            otrosCheckboxes.forEach(checkbox => {
                const category = checkbox.getAttribute('data-category');
                checkbox.addEventListener('change', function() {
                    const otroInputId = `otro${category}`;
                    let otroInput = document.getElementById(otroInputId);
                    
                    if (this.checked) {
                        if (!otroInput) {
                            const inputGroup = this.closest('.checkbox-option');
                            const nuevoInput = document.createElement('input');
                            nuevoInput.type = 'text';
                            nuevoInput.id = otroInputId;
                            nuevoInput.name = `otro${category.toLowerCase()}`;
                            nuevoInput.placeholder = 'Especifique';
                            nuevoInput.className = 'otro-input';
                            nuevoInput.style.marginTop = '8px';
                            nuevoInput.style.width = '100%';
                            nuevoInput.style.padding = '8px';
                            nuevoInput.required = true;
                            inputGroup.appendChild(nuevoInput);
                        }
                    } else {
                        if (otroInput) {
                            otroInput.remove();
                        }
                    }
                });
            });
        }
    }
    
    function handleMecanismoChange(e) {
        if (e.target.value === 'Otro') {
            otroMecanismoContainer.style.display = 'block';
            otroMecanismoInput.required = true;
        } else {
            otroMecanismoContainer.style.display = 'none';
            otroMecanismoInput.required = false;
            otroMecanismoInput.value = '';
        }
    }
    
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validar formulario
        if (!form.checkValidity()) {
            alert('Por favor complete todos los campos obligatorios.');
            return;
        }
        
        // Recoger datos del formulario
        const formData = new FormData(form);
        const pqrsData = {};
        
        // Campos básicos
        pqrsData.tipo_reporte = formData.get('tipoReporte');
        pqrsData.cliente = formData.get('cliente');
        pqrsData.nombre_reportante = formData.get('nombreReportante');
        pqrsData.correo_reportante = formData.get('correoReportante');
        pqrsData.fecha_reporte = formData.get('fechaReporte');
        pqrsData.placa_vehiculo = formData.get('placaVehiculo');
        pqrsData.nombre_conductor = formData.get('nombreConductor');
        pqrsData.mecanismo_reporte = formData.get('mecanismoReporte') || 'Formulario Web';
        pqrsData.otro_mecanismo = formData.get('otroMecanismo') || '';
        
        // Campos dinámicos según tipo de reporte
        switch(pqrsData.tipo_reporte) {
            case 'Queja':
                pqrsData.categoria_conductor = Array.from(formData.getAll('categoriaConductor'));
                pqrsData.categoria_vehiculo = Array.from(formData.getAll('categoriaVehiculo'));
                pqrsData.otro_conductor = formData.get('otroconductor') || '';
                pqrsData.otro_vehiculo = formData.get('otrovehiculo') || '';
                pqrsData.descripcion = formData.get('descripcionQueja') || '';
                break;
            case 'Reclamo':
                pqrsData.categoria_conductor = Array.from(formData.getAll('categoriaConductorReclamo'));
                pqrsData.categoria_vehiculo = Array.from(formData.getAll('categoriaVehiculoReclamo'));
                pqrsData.otro_conductor_reclamo = formData.get('otroconductorreclamo') || '';
                pqrsData.otro_vehiculo_reclamo = formData.get('otrovehiculoreclamo') || '';
                pqrsData.descripcion = formData.get('descripcionReclamo') || '';
                break;
            case 'Peticion':
                pqrsData.categoria_peticion = Array.from(formData.getAll('categoriaPeticion'));
                pqrsData.otro_peticion = formData.get('otropeticion') || '';
                pqrsData.descripcion = formData.get('descripcionPeticion') || '';
                break;
            case 'Felicitaciones':
                pqrsData.mensaje = formData.get('mensajeFelicitaciones') || '';
                break;
            case 'Sugerencia':
                pqrsData.mensaje = formData.get('mensajeSugerencia') || '';
                break;
        }
        
        // Metadatos
        pqrsData.estado = 'Pendiente';
        pqrsData.fecha_creacion = new Date().toISOString();
        pqrsData.fecha_actualizacion = new Date().toISOString();
        pqrsData.comentarios_internos = '';
        
        // Generar ID único
        const reportId = 'PQRS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        try {
            // Guardar en Firebase
            await database.ref('pqrs_reports/' + reportId).set(pqrsData);
            
            // Mostrar modal de confirmación
            document.getElementById('refNumber').textContent = reportId;
            modal.style.display = 'flex';
            
        } catch (error) {
            console.error('Error al guardar el reporte:', error);
            alert('Error al enviar el reporte. Por favor intente nuevamente.');
        }
    }
    
    // Funciones para crear plantillas
    function createQuejaTemplate() {
        return `
            <div class="dynamic-section">
                <h4>QUEJA</h4>
                <div class="dynamic-description">
                    Manifestación de insatisfacción con la prestación del servicio de transporte, ya sea por conductas del conductor o condiciones del vehículo.
                </div>
                
                <div class="category-group">
                    <h5>CONDUCTAS DEL CONDUCTOR</h5>
                    <div class="checkbox-group">
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductor" value="Actitud de servicio">
                            Actitud de servicio
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductor" value="Agresión verbal o física">
                            Agresión verbal o física
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductor" value="Presentación personal">
                            Presentación personal
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductor" value="Incumplimiento normas SST Y SEGURIDAD VIAL">
                            Incumplimiento normas SST Y SEGURIDAD VIAL
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductor" value="Actos inseguros">
                            Actos inseguros
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductor" value="Descenso de pasajero en zona no autorizada">
                            Descenso de pasajero en zona no autorizada
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductor" value="Abastecimiento de combustible con usuarios a bordo">
                            Abastecimiento de combustible con usuarios a bordo
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductor" value="Usuario recogido en sitio no autorizado">
                            Usuario recogido en sitio no autorizado
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductor" value="Abordaje de terceros al vehículo">
                            Abordaje de terceros al vehículo
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductor" value="Desconocimiento de la ruta">
                            Desconocimiento de la ruta
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductor" value="Otro" data-category="Conductor">
                            Otro
                        </label>
                    </div>
                </div>
                
                <div class="category-group">
                    <h5>CONDICIONES DEL VEHÍCULO</h5>
                    <div class="checkbox-group">
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaVehiculo" value="Fallas mecánicas visibles">
                            Fallas mecánicas visibles
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaVehiculo" value="Luces, frenos o direccionales defectuosos">
                            Luces, frenos o direccionales defectuosos
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaVehiculo" value="Puertas o ventanas en mal funcionamiento">
                            Puertas o ventanas en mal funcionamiento
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaVehiculo" value="Condiciones que afectan la seguridad o comodidad del usuario">
                            Condiciones que afectan la seguridad o comodidad del usuario
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaVehiculo" value="Mal estado de llantas">
                            Mal estado de llantas
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaVehiculo" value="Sillas, pisos o ventanas en mal estado de higiene">
                            Sillas, pisos o ventanas en mal estado de higiene
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaVehiculo" value="Otro" data-category="Vehiculo">
                            Otro
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="descripcionQueja">Descripción detallada de la queja *</label>
                    <textarea id="descripcionQueja" name="descripcionQueja" rows="5" required placeholder="Describa en detalle la situación que motiva la queja..."></textarea>
                </div>
            </div>
        `;
    }
    
    function createReclamoTemplate() {
        return `
            <div class="dynamic-section">
                <h4>RECLAMO</h4>
                <div class="dynamic-description">
                    Solicitud para resolver problemas relacionados con la prestación del servicio de transporte, incluyendo incumplimientos de horarios o condiciones recurrentes.
                </div>
                
                <div class="category-group">
                    <h5>CONDUCTAS DEL CONDUCTOR</h5>
                    <div class="checkbox-group">
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductorReclamo" value="Incumplimiento de horarios establecidos">
                            Incumplimiento de horarios establecidos
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductorReclamo" value="Retrasos frecuentes en la ruta asignada">
                            Retrasos frecuentes en la ruta asignada
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductorReclamo" value="No prestación del servicio programado">
                            No prestación del servicio programado
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductorReclamo" value="Cancelación del servicio sin previo aviso">
                            Cancelación del servicio sin previo aviso
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductorReclamo" value="Falta de seguimiento">
                            Falta de seguimiento
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaConductorReclamo" value="Otro" data-category="ConductorReclamo">
                            Otro
                        </label>
                    </div>
                </div>
                
                <div class="category-group">
                    <h5>CONDICIONES DEL VEHÍCULO</h5>
                    <div class="checkbox-group">
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaVehiculoReclamo" value="Condiciones inseguras para el usuario">
                            Condiciones inseguras para el usuario
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaVehiculoReclamo" value="Vehículo diferente al asignado sin autorización">
                            Vehículo diferente al asignado sin autorización
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaVehiculoReclamo" value="Fallas recurrentes no corregidas">
                            Fallas recurrentes no corregidas
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaVehiculoReclamo" value="Falta de soportes o documentos">
                            Falta de soportes o documentos
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaVehiculoReclamo" value="Repetición de quejas previamente reportadas">
                            Repetición de quejas previamente reportadas
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoriaVehiculoReclamo" value="Otro" data-category="VehiculoReclamo">
                            Otro
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="descripcionReclamo">Descripción detallada del reclamo *</label>
                    <textarea id="descripcionReclamo" name="descripcionReclamo" rows="5" required placeholder="Describa en detalle el reclamo y sus antecedentes..."></textarea>
                </div>
            </div>
        `;
    }
    
    function createPeticionTemplate() {
        return `
            <div class="dynamic-section">
                <h4>PETICIÓN</h4>
                <div class="dynamic-description">
                    Solicitud de información o documentación relacionada con los servicios de transporte.
                </div>
                
                <div class="checkbox-group">
                    <label class="checkbox-option">
                        <input type="checkbox" name="categoriaPeticion" value="Solicitud de información sobre rutas y horarios">
                        Solicitud de información sobre rutas y horarios
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="categoriaPeticion" value="Solicitud de políticas, procedimientos o protocolos del servicio">
                        Solicitud de políticas, procedimientos o protocolos del servicio
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" name="categoriaPeticion" value="Otro" data-category="Peticion">
                        Otro
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="descripcionPeticion">Descripción de la petición *</label>
                    <textarea id="descripcionPeticion" name="descripcionPeticion" rows="5" required placeholder="Describa en detalle lo que necesita o la información que solicita..."></textarea>
                </div>
            </div>
        `;
    }
    
    function createFelicitacionesTemplate() {
        return `
            <div class="dynamic-section">
                <h4>FELICITACIONES</h4>
                <div class="dynamic-description">
                    Manifestación efectuada por parte de un protegido o una entidad por la satisfacción experimentada con motivo de algún suceso favorable.
                </div>
                
                <div class="form-group">
                    <label for="mensajeFelicitaciones">Mensaje de felicitaciones *</label>
                    <textarea id="mensajeFelicitaciones" name="mensajeFelicitaciones" rows="5" required placeholder="Comparta sus felicitaciones y reconocimientos..."></textarea>
                </div>
            </div>
        `;
    }
    
    function createSugerenciaTemplate() {
        return `
            <div class="dynamic-section">
                <h4>SUGERENCIA</h4>
                <div class="dynamic-description">
                    Es una observación o idea manifestada por un usuario que nos permite identificar oportunidades de mejora.
                </div>
                
                <div class="form-group">
                    <label for="mensajeSugerencia">Mensaje de sugerencia *</label>
                    <textarea id="mensajeSugerencia" name="mensajeSugerencia" rows="5" required placeholder="Comparta su sugerencia para mejorar nuestros servicios..."></textarea>
                </div>
            </div>
        `;
    }
});