import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import LayerGroup from 'ol/layer/Group';
import { direcionServicioWMS } from './configuracion.js';
import { actualizarPanelCapas } from './controlCapas.js';

/**
 * Llama a WMS GetCapabilities, toma solo los Layer queryable="1"
 * y los agrega dinamicamente al mapa y al panel de capas.
 */
export function cargarCapasWMS() {
    const url = `${direcionServicioWMS}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities`;

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text();
        })
        .then(xmlText => {
            const doc  = new DOMParser().parseFromString(xmlText, 'text/xml');
            const capas = parsearCapasWMS(doc);

            if (capas.length === 0) {
                console.warn('[visor] WMS GetCapabilities: no se encontraron capas queryable.');
                return;
            }

            const grupoWMS = new LayerGroup({ title: 'Capas WMS', layers: capas });

            global.gruposDeCapas.push(grupoWMS);
            global.mapa.addLayer(grupoWMS);
            actualizarPanelCapas();

            console.info(`[visor] ${capas.length} capa(s) WMS cargada(s).`);
        })
        .catch(err => console.warn('[visor] Error al obtener WMS GetCapabilities:', err));
}

/**
 * Solo parsea <Layer queryable="1"> con un <Name> directo no vacio.
 * Esto excluye el Layer raiz contenedor y capas no consultables.
 */
function parsearCapasWMS(doc) {
    const capas = [];

    // Seleccionar unicamente los Layer con queryable="1"
    const layerEls = Array.from(doc.querySelectorAll('Layer[queryable="1"]')).filter(el => {
        const nameEl = el.querySelector(':scope > Name');
        return nameEl && nameEl.textContent.trim().length > 0;
    });

    layerEls.forEach(layerEl => {
        const name = layerEl.querySelector(':scope > Name').textContent.trim();

        const titleEl = layerEl.querySelector(':scope > Title');
        const title   = titleEl ? titleEl.textContent.trim() : name;

        const capa = new TileLayer({
            title,
            visible: true,
            source: new TileWMS({
                url: direcionServicioWMS,
                params: {
                    LAYERS:  name,
                    TILED:   true,
                    FORMAT:  'image/png',
                    VERSION: '1.1.1',
                },
                serverType: 'mapserver',
                transition: 0,
            }),
        });

        capas.push(capa);
    });

    return capas;
}
