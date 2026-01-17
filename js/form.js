import { database } from './firebase-config.js';
import { ref, push, set } from 'firebase/database';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Documento cargado - Formulario PQRS');
    
    // Configurar fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fechaReporte').value = today;
    console.log('Fecha configurada:', today);

    // Mostrar/ocultar campo "Otro" para mecanismo de reporte
    const mecanismoRadios = document.querySelectorAll('input[name="mecanismoReporte"]');
    const otroMecanismoContainer = document.getElementById('otroMecanismoContainer');
    
    mecanismoRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('Mecanismo seleccionado:', this.value);
            if (this.value === 'Otro') {
                otroMecanismoContainer.style.display = 'block';
                document.getElementById('otroMecanismo').required = true;
            } else {
                otroMecanismoContainer.style.display = 'none';
                document.getElementById('otroMecanismo').required = false;
            }
        });
    });

    // Cambiar contenido dinámico según tipo de reporte
    const tipoReporteRadios = document.querySelectorAll('input[name="tipoReporte"]');
    const seccionDinamica = document.getElementById('seccionDinamica');
    
    console.log('Radios encontrados:', tipoReporteRadios.length);
    console.log('Sección dinámica:', seccionDinamica);

    tipoReporteRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const tipo = this.value;
            console.log('Tipo de reporte seleccionado:', tipo);
            
            // Generar y mostrar la sección dinámica
            const seccionHTML = generarSeccionDinamica(tipo);
            console.log('HTML generado:', seccionHTML);
            
            seccionDinamica.innerHTML = seccionHTML;
            
            // Agregar eventos para checkboxes "Otro" después de insertar el HTML
            setTimeout(() => {
                agregarEventosCheckboxesOtro();
                console.log('Eventos agregados para tipo:', tipo);
            }, 100);
        });
    });

    // Manejar envío del formulario
    const form = document.getElementById('pqrsForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Formulario enviado');

        // Validar formulario
        if (!validarFormulario()) {
            console.log('Validación fallida');
            return;
        }

        console.log('Formulario validado correctamente');

        // Obtener datos del formulario
        const formData = new FormData(form);
        const reporteData = {
            tipo_reporte: formData.get('tipoReporte'),
            cliente: formData.get('cliente'),
            nombre_reportante: formData.get('nombreReportante'),
            fecha_reporte: formData.get('fechaReporte'),
            placa_vehiculo: formData.get('placaVehiculo').toUpperCase(),
            nombre_conductor: formData.get('nombreConductor'),
            mecanismo_reporte: formData.get('mecanismoReporte'),
            otro_mecanismo: formData.get('otroMecanismo') || '',
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString(),
            estado: 'Pendiente',
            comentarios_internos: ''
        };

        console.log('Datos básicos del reporte:', reporteData);

        // Agregar datos específicos según el tipo de reporte
        const tipo = reporteData.tipo_reporte;
        console.log('Procesando tipo:', tipo);
        
        switch(tipo) {
            case 'Queja':
                reporteData.categoria_conductor = obtenerCheckboxesSeleccionados('categoria_conductor');
                reporteData.categoria_vehiculo = obtenerCheckboxesSeleccionados('categoria_vehiculo');
                
                // Agregar "Otro" si existe
                const otroConductor = document.getElementById('otroConductorInput')?.value;
                const otroVehiculo = document.getElementById('otroVehiculoInput')?.value;
                
                if (otroConductor && otroConductor.trim()) {
                    reporteData.categoria_conductor.push(`Otro: ${otroConductor}`);
                }
                if (otroVehiculo && otroVehiculo.trim()) {
                    reporteData.categoria_vehiculo.push(`Otro: ${otroVehiculo}`);
                }
                
                reporteData.descripcion = document.getElementById('descripcionQueja')?.value || '';
                console.log('Datos de queja:', {
                    conductor: reporteData.categoria_conductor,
                    vehiculo: reporteData.categoria_vehiculo,
                    descripcion: reporteData.descripcion
                });
                break;

            case 'Reclamo':
                reporteData.categoria_conductor = obtenerCheckboxesSeleccionados('categoria_conductor_reclamo');
                reporteData.categoria_vehiculo = obtenerCheckboxesSeleccionados('categoria_vehiculo_reclamo');
                
                // Agregar "Otro" si existe
                const otroConductorReclamo = document.getElementById('otroConductorInputReclamo')?.value;
                const otroVehiculoReclamo = document.getElementById('otroVehiculoInputReclamo')?.value;
                
                if (otroConductorReclamo && otroConductorReclamo.trim()) {
                    reporteData.categoria_conductor.push(`Otro: ${otroConductorReclamo}`);
                }
                if (otroVehiculoReclamo && otroVehiculoReclamo.trim()) {
                    reporteData.categoria_vehiculo.push(`Otro: ${otroVehiculoReclamo}`);
                }
                
                reporteData.descripcion = document.getElementById('descripcionReclamo')?.value || '';
                console.log('Datos de reclamo:', reporteData);
                break;

            case 'Peticion':
                reporteData.categorias = obtenerCheckboxesSeleccionados('categoria_peticion');
                
                // Agregar "Otro" si existe
                const otroPeticion = document.getElementById('otroPeticionInput')?.value;
                if (otroPeticion && otroPeticion.trim()) {
                    reporteData.categorias.push(`Otro: ${otroPeticion}`);
                }
                
                reporteData.descripcion = document.getElementById('descripcionPeticion')?.value || '';
                console.log('Datos de petición:', reporteData);
                break;

            case 'Felicitaciones':
                reporteData.mensaje = document.getElementById('mensajeFelicitaciones')?.value || '';
                console.log('Datos de felicitaciones:', reporteData);
                break;

            case 'Sugerencia':
                reporteData.mensaje = document.getElementById('mensajeSugerencia')?.value || '';
                console.log('Datos de sugerencia:', reporteData);
                break;
        }

        try {
            console.log('Intentando guardar en Firebase...');
            // Guardar en Firebase
            const reportsRef = ref(database, 'pqrs_reports');
            const newReportRef = push(reportsRef);
            await set(newReportRef, reporteData);
            console.log('Reporte guardado exitosamente');

            // Mostrar modal de éxito
            mostrarModalExito();
            
            // Reiniciar formulario después de 3 segundos
            setTimeout(() => {
                form.reset();
                document.getElementById('fechaReporte').value = today;
                seccionDinamica.innerHTML = '';
                console.log('Formulario reiniciado');
            }, 3000);

        } catch (error) {
            console.error('Error al guardar el reporte:', error);
            alert('Error al enviar el reporte. Por favor, intente nuevamente.');
        }
    });

    // Configurar modal
    const modal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeModalSpan = document.querySelector('.close-modal');

    closeModalBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    closeModalSpan.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    console.log('Configuración de eventos completada');
});

function generarSeccionDinamica(tipo) {
    console.log('Generando sección para tipo:', tipo);
    
    switch(tipo) {
        case 'Felicitaciones':
            return `
                <div class="dynamic-section">
                    <h2><i class="fas fa-award"></i> FELICITACIONES</h2>
                    <div class="report-description">
                        <p><strong>Definición:</strong> Manifestación efectuada por parte de un protegido o una entidad por la satisfacción experimentada con motivo de algún suceso favorable.</p>
                    </div>
                    <div class="form-group">
                        <label for="mensajeFelicitaciones">Mensaje de felicitaciones *</label>
                        <textarea id="mensajeFelicitaciones" name="mensajeFelicitaciones" rows="5" required placeholder="Escriba aquí sus felicitaciones..."></textarea>
                    </div>
                </div>
            `;

        case 'Sugerencia':
            return `
                <div class="dynamic-section">
                    <h2><i class="fas fa-lightbulb"></i> SUGERENCIA</h2>
                    <div class="report-description">
                        <p><strong>Definición:</strong> Es una observación o idea manifestada por un usuario que nos permite identificar oportunidades de mejora.</p>
                    </div>
                    <div class="form-group">
                        <label for="mensajeSugerencia">Mensaje de sugerencia *</label>
                        <textarea id="mensajeSugerencia" name="mensajeSugerencia" rows="5" required placeholder="Escriba aquí su sugerencia..."></textarea>
                    </div>
                </div>
            `;

        case 'Queja':
            console.log('Generando sección de Queja');
            return `
                <div class="dynamic-section">
                    <h2><i class="fas fa-exclamation-triangle"></i> QUEJA</h2>
                    <div class="report-description">
                        <p><strong>Definición:</strong> Manifestación de inconformidad relacionada con el incumplimiento de los estándares del servicio.</p>
                    </div>
                    
                    <div class="category-section">
                        <h3><i class="fas fa-user"></i> CONDUCTAS DEL CONDUCTOR</h3>
                        <div class="checkbox-group" id="quejaConductor">
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor[]" value="Actitud de servicio">
                                <span>Actitud de servicio</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor[]" value="Agresión verbal o física">
                                <span>Agresión verbal o física</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor[]" value="Presentación personal">
                                <span>Presentación personal</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor[]" value="Incumplimiento normas SST Y SEGURIDAD VIAL">
                                <span>Incumplimiento normas SST Y SEGURIDAD VIAL</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor[]" value="Actos inseguros">
                                <span>Actos inseguros</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor[]" value="Descenso de pasajero en zona no autorizada">
                                <span>Descenso de pasajero en zona no autorizada</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor[]" value="Abastecimiento de combustible con usuarios a bordo">
                                <span>Abastecimiento de combustible con usuarios a bordo</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor[]" value="Usuario recogido en sitio no autorizado">
                                <span>Usuario recogido en sitio no autorizado</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor[]" value="Abordaje de terceros al vehículo">
                                <span>Abordaje de terceros al vehículo</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor[]" value="Desconocimiento de la ruta">
                                <span>Desconocimiento de la ruta</span>
                            </label>
                            <div class="checkbox-option otro-option">
                                <input type="checkbox" id="otroConductorCheck">
                                <span>Otro:</span>
                                <input type="text" id="otroConductorInput" class="otro-input" placeholder="Especifique otra conducta">
                            </div>
                        </div>
                    </div>

                    <div class="category-section">
                        <h3><i class="fas fa-car"></i> CONDICIONES DEL VEHÍCULO</h3>
                        <div class="checkbox-group" id="quejaVehiculo">
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_vehiculo[]" value="Fallas mecánicas visibles">
                                <span>Fallas mecánicas visibles</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_vehiculo[]" value="Luces, frenos o direccionales defectuosos">
                                <span>Luces, frenos o direccionales defectuosos</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_vehiculo[]" value="Puertas o ventanas en mal funcionamiento">
                                <span>Puertas o ventanas en mal funcionamiento</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_vehiculo[]" value="Condiciones que afectan la seguridad o comodidad del usuario">
                                <span>Condiciones que afectan la seguridad o comodidad del usuario</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_vehiculo[]" value="Mal estado de llantas">
                                <span>Mal estado de llantas</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_vehiculo[]" value="Sillas, pisos o ventanas en mal estado de higiene">
                                <span>Sillas, pisos o ventanas en mal estado de higiene</span>
                            </label>
                            <div class="checkbox-option otro-option">
                                <input type="checkbox" id="otroVehiculoCheck">
                                <span>Otro:</span>
                                <input type="text" id="otroVehiculoInput" class="otro-input" placeholder="Especifique otra condición">
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="descripcionQueja">Descripción detallada de la queja *</label>
                        <textarea id="descripcionQueja" name="descripcionQueja" rows="5" required placeholder="Describa detalladamente la queja, incluyendo fecha, hora y circunstancias..."></textarea>
                    </div>
                </div>
            `;

        case 'Reclamo':
            console.log('Generando sección de Reclamo');
            return `
                <div class="dynamic-section">
                    <h2><i class="fas fa-exclamation-circle"></i> RECLAMO</h2>
                    <div class="report-description">
                        <p><strong>Definición:</strong> Manifestación de inconformidad por la no prestación o deficiencia en la prestación de un servicio.</p>
                    </div>
                    
                    <div class="category-section">
                        <h3><i class="fas fa-user"></i> CONDUCTAS DEL CONDUCTOR</h3>
                        <div class="checkbox-group" id="reclamoConductor">
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor_reclamo[]" value="Incumplimiento de horarios establecidos">
                                <span>Incumplimiento de horarios establecidos</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor_reclamo[]" value="Retrasos frecuentes en la ruta asignada">
                                <span>Retrasos frecuentes en la ruta asignada</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor_reclamo[]" value="No prestación del servicio programado">
                                <span>No prestación del servicio programado</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor_reclamo[]" value="Cancelación del servicio sin previo aviso">
                                <span>Cancelación del servicio sin previo aviso</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_conductor_reclamo[]" value="Falta de seguimiento">
                                <span>Falta de seguimiento</span>
                            </label>
                            <div class="checkbox-option otro-option">
                                <input type="checkbox" id="otroConductorCheckReclamo">
                                <span>Otro:</span>
                                <input type="text" id="otroConductorInputReclamo" class="otro-input" placeholder="Especifique otra conducta">
                            </div>
                        </div>
                    </div>

                    <div class="category-section">
                        <h3><i class="fas fa-car"></i> CONDICIONES DEL VEHÍCULO</h3>
                        <div class="checkbox-group" id="reclamoVehiculo">
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_vehiculo_reclamo[]" value="Condiciones inseguras para el usuario">
                                <span>Condiciones inseguras para el usuario</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_vehiculo_reclamo[]" value="Vehículo diferente al asignado sin autorización">
                                <span>Vehículo diferente al asignado sin autorización</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_vehiculo_reclamo[]" value="Fallas recurrentes no corregidas">
                                <span>Fallas recurrentes no corregidas</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_vehiculo_reclamo[]" value="Falta de soportes o documentos">
                                <span>Falta de soportes o documentos</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="checkbox" name="categoria_vehiculo_reclamo[]" value="Repetición de quejas previamente reportadas">
                                <span>Repetición de quejas previamente reportadas</span>
                            </label>
                            <div class="checkbox-option otro-option">
                                <input type="checkbox" id="otroVehiculoCheckReclamo">
                                <span>Otro:</span>
                                <input type="text" id="otroVehiculoInputReclamo" class="otro-input" placeholder="Especifique otra condición">
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="descripcionReclamo">Descripción detallada del reclamo *</label>
                        <textarea id="descripcionReclamo" name="descripcionReclamo" rows="5" required placeholder="Describa detalladamente el reclamo, incluyendo fechas, horas y hechos específicos..."></textarea>
                    </div>
                </div>
            `;

        case 'Peticion':
            console.log('Generando sección de Petición');
            return `
                <div class="dynamic-section">
                    <h2><i class="fas fa-question-circle"></i> PETICIÓN</h2>
                    <div class="report-description">
                        <p><strong>Definición:</strong> Solicitud de información, aclaración o documentación relacionada con el servicio.</p>
                    </div>
                    
                    <div class="checkbox-group" id="peticionCategorias">
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoria_peticion[]" value="Solicitud de información sobre rutas y horarios">
                            <span>Solicitud de información sobre rutas y horarios</span>
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" name="categoria_peticion[]" value="Solicitud de políticas, procedimientos o protocolos del servicio">
                            <span>Solicitud de políticas, procedimientos o protocolos del servicio</span>
                        </label>
                        <div class="checkbox-option otro-option">
                            <input type="checkbox" id="otroPeticionCheck">
                            <span>Otro:</span>
                            <input type="text" id="otroPeticionInput" class="otro-input" placeholder="Especifique otra petición">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="descripcionPeticion">Descripción detallada de la petición *</label>
                        <textarea id="descripcionPeticion" name="descripcionPeticion" rows="5" required placeholder="Describa detalladamente su petición..."></textarea>
                    </div>
                </div>
            `;

        default:
            console.log('Tipo no reconocido:', tipo);
            return '<p>Seleccione un tipo de reporte para ver los campos específicos.</p>';
    }
}

function agregarEventosCheckboxesOtro() {
    console.log('Agregando eventos para checkboxes "Otro"...');
    
    // Eventos para Quejas - Conductor
    const otroConductorCheck = document.getElementById('otroConductorCheck');
    const otroConductorInput = document.getElementById('otroConductorInput');
    
    if (otroConductorCheck && otroConductorInput) {
        console.log('Encontrados checkbox Otro Conductor');
        otroConductorCheck.addEventListener('change', function() {
            otroConductorInput.disabled = !this.checked;
            if (!this.checked) otroConductorInput.value = '';
        });
        otroConductorInput.disabled = !otroConductorCheck.checked;
    }

    // Eventos para Quejas - Vehículo
    const otroVehiculoCheck = document.getElementById('otroVehiculoCheck');
    const otroVehiculoInput = document.getElementById('otroVehiculoInput');
    
    if (otroVehiculoCheck && otroVehiculoInput) {
        console.log('Encontrados checkbox Otro Vehículo');
        otroVehiculoCheck.addEventListener('change', function() {
            otroVehiculoInput.disabled = !this.checked;
            if (!this.checked) otroVehiculoInput.value = '';
        });
        otroVehiculoInput.disabled = !otroVehiculoCheck.checked;
    }

    // Eventos para Reclamos - Conductor
    const otroConductorCheckReclamo = document.getElementById('otroConductorCheckReclamo');
    const otroConductorInputReclamo = document.getElementById('otroConductorInputReclamo');
    
    if (otroConductorCheckReclamo && otroConductorInputReclamo) {
        console.log('Encontrados checkbox Otro Conductor Reclamo');
        otroConductorCheckReclamo.addEventListener('change', function() {
            otroConductorInputReclamo.disabled = !this.checked;
            if (!this.checked) otroConductorInputReclamo.value = '';
        });
        otroConductorInputReclamo.disabled = !otroConductorCheckReclamo.checked;
    }

    // Eventos para Reclamos - Vehículo
    const otroVehiculoCheckReclamo = document.getElementById('otroVehiculoCheckReclamo');
    const otroVehiculoInputReclamo = document.getElementById('otroVehiculoInputReclamo');
    
    if (otroVehiculoCheckReclamo && otroVehiculoInputReclamo) {
        console.log('Encontrados checkbox Otro Vehículo Reclamo');
        otroVehiculoCheckReclamo.addEventListener('change', function() {
            otroVehiculoInputReclamo.disabled = !this.checked;
            if (!this.checked) otroVehiculoInputReclamo.value = '';
        });
        otroVehiculoInputReclamo.disabled = !otroVehiculoCheckReclamo.checked;
    }

    // Eventos para Peticiones - Otro
    const otroPeticionCheck = document.getElementById('otroPeticionCheck');
    const otroPeticionInput = document.getElementById('otroPeticionInput');
    
    if (otroPeticionCheck && otroPeticionInput) {
        console.log('Encontrados checkbox Otro Petición');
        otroPeticionCheck.addEventListener('change', function() {
            otroPeticionInput.disabled = !this.checked;
            if (!this.checked) otroPeticionInput.value = '';
        });
        otroPeticionInput.disabled = !otroPeticionCheck.checked;
    }
}

function obtenerCheckboxesSeleccionados(nombre) {
    const checkboxes = document.querySelectorAll(`input[name="${nombre}[]"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function validarFormulario() {
    console.log('Validando formulario...');
    
    const tipoReporte = document.querySelector('input[name="tipoReporte"]:checked');
    if (!tipoReporte) {
        alert('Por favor, seleccione un tipo de reporte');
        return false;
    }

    // Validar campos requeridos generales
    const camposRequeridos = ['cliente', 'nombreReportante', 'placaVehiculo', 'nombreConductor'];
    for (const campo of camposRequeridos) {
        const elemento = document.getElementById(campo);
        if (!elemento || !elemento.value.trim()) {
            alert(`Por favor, complete el campo: ${campo}`);
            elemento?.focus();
            return false;
        }
    }

    // Validar mecanismo de reporte
    const mecanismoReporte = document.querySelector('input[name="mecanismoReporte"]:checked');
    if (!mecanismoReporte) {
        alert('Por favor, seleccione un mecanismo de reporte');
        return false;
    }

    if (mecanismoReporte.value === 'Otro') {
        const otroMecanismo = document.getElementById('otroMecanismo');
        if (!otroMecanismo || !otroMecanismo.value.trim()) {
            alert('Por favor, especifique el mecanismo de reporte');
            otroMecanismo?.focus();
            return false;
        }
    }

    // Validar campos específicos según tipo
    const tipo = tipoReporte.value;
    console.log('Validando campos para tipo:', tipo);
    
    switch(tipo) {
        case 'Felicitaciones':
            const mensajeFelicitaciones = document.getElementById('mensajeFelicitaciones');
            if (!mensajeFelicitaciones || !mensajeFelicitaciones.value.trim()) {
                alert('Por favor, escriba su mensaje de felicitaciones');
                mensajeFelicitaciones?.focus();
                return false;
            }
            break;

        case 'Sugerencia':
            const mensajeSugerencia = document.getElementById('mensajeSugerencia');
            if (!mensajeSugerencia || !mensajeSugerencia.value.trim()) {
                alert('Por favor, escriba su sugerencia');
                mensajeSugerencia?.focus();
                return false;
            }
            break;

        case 'Queja':
            const descripcionQueja = document.getElementById('descripcionQueja');
            if (!descripcionQueja || !descripcionQueja.value.trim()) {
                alert('Por favor, describa la queja');
                descripcionQueja?.focus();
                return false;
            }
            break;

        case 'Reclamo':
            const descripcionReclamo = document.getElementById('descripcionReclamo');
            if (!descripcionReclamo || !descripcionReclamo.value.trim()) {
                alert('Por favor, describa el reclamo');
                descripcionReclamo?.focus();
                return false;
            }
            break;

        case 'Peticion':
            const descripcionPeticion = document.getElementById('descripcionPeticion');
            if (!descripcionPeticion || !descripcionPeticion.value.trim()) {
                alert('Por favor, describa la petición');
                descripcionPeticion?.focus();
                return false;
            }
            break;
    }

    console.log('Validación exitosa');
    return true;
}

function mostrarModalExito() {
    console.log('Mostrando modal de éxito');
    const modal = document.getElementById('successModal');
    modal.style.display = 'flex';
}

// Hacer las funciones disponibles globalmente para depuración
window.generarSeccionDinamica = generarSeccionDinamica;
window.validarFormulario = validarFormulario;