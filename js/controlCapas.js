export function inicializarControlCapas() {
    actualizarPanelCapas();
    global.grupoCapasExternos.getLayers().on('add',    () => actualizarPanelCapas());
    global.grupoCapasExternos.getLayers().on('remove', () => actualizarPanelCapas());
}

export function actualizarPanelCapas() {
    const container = document.getElementById('panel-capas-contenido');
    if (!container) return;
    container.innerHTML = '';
    global.gruposDeCapas.forEach((grupo, grupoIdx) => {
        container.appendChild(renderGrupo(grupo, grupoIdx));
    });
}

function renderGrupo(grupo, grupoIdx) {
    const titulo = grupo.get('title') || 'Grupo';
    const capas  = grupo.getLayers().getArray();

    const section = document.createElement('div');
    section.className = 'layer-group';

    const header = document.createElement('div');
    header.className = 'layer-group-header open';
    header.innerHTML = `
        <span><i class="bi bi-layers me-1"></i>${titulo}</span>
        <i class="bi bi-chevron-up toggle-chevron"></i>`;

    const body = document.createElement('div');
    body.className = 'layer-group-body';

    if (capas.length === 0) {
        body.innerHTML = '<div class="layer-empty">Sin capas cargadas</div>';
    } else {
        capas.forEach((layer, layerIdx) => {
            body.appendChild(renderCapa(layer, grupoIdx, layerIdx));
        });
    }

    header.addEventListener('click', () => {
        body.classList.toggle('hidden');
        header.classList.toggle('open');
    });

    section.appendChild(header);
    section.appendChild(body);
    return section;
}

function renderCapa(layer, grupoIdx, layerIdx) {
    const item     = document.createElement('div');
    item.className = 'layer-item';

    const titulo   = layer.get('title') || 'Capa';
    const visible  = layer.getVisible();
    const isBase   = layer.get('type') === 'base';
    const opacidad = layer.getOpacity();

    if (isBase) {
        item.innerHTML = `
            <label class="layer-radio-label">
                <input type="radio" name="base-layer-${grupoIdx}" class="layer-radio" ${visible ? 'checked' : ''}>
                <i class="bi bi-map me-1"></i>
                <span>${titulo}</span>
            </label>`;

        item.querySelector('.layer-radio').addEventListener('change', function () {
            if (this.checked) {
                const grupo = global.gruposDeCapas[grupoIdx];
                grupo.getLayers().getArray().forEach((l, i) => {
                    if (l.get('type') === 'base') l.setVisible(i === layerIdx);
                });
            }
        });
    } else {
        const pct = Math.round(opacidad * 100);
        item.innerHTML = `
            <div class="layer-row">
                <label class="layer-check-label">
                    <input type="checkbox" class="layer-check" ${visible ? 'checked' : ''}>
                    <span>${titulo}</span>
                </label>
            </div>
            <div class="layer-opacity-row">
                <i class="bi bi-eye-fill opacity-icon"></i>
                <input type="range" class="layer-opacity-slider form-range"
                    min="0" max="1" step="0.05" value="${opacidad}">
                <span class="opacity-val">${pct}%</span>
            </div>`;

        const checkbox = item.querySelector('.layer-check');
        checkbox.addEventListener('change', () => layer.setVisible(checkbox.checked));

        const slider   = item.querySelector('.layer-opacity-slider');
        const valLabel = item.querySelector('.opacity-val');
        slider.addEventListener('input', () => {
            const val = parseFloat(slider.value);
            layer.setOpacity(val);
            valLabel.textContent = Math.round(val * 100) + '%';
        });
    }

    return item;
}
