import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import LayerGroup from 'ol/layer/Group';
import { direcionServicioWMS } from './configuracion.js';
import { actualizarPanelCapas } from './controlCapas.js';

/**
 * Llama a WMS GetCapabilities y carga solo las capas publicadas:
 * aquellas con queryable="1" opaque="0" cascaded="0".
 * Los layers contenedores (STT raiz) solo tienen queryable="1"
 * sin los otros atributos, por eso quedan excluidos.
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
                console.warn('[visor] WMS GetCapabilities: no se encontraron capas publicadas.');
                return;
            }

            const grupoWMS = new LayerGroup({ title: 'Capas WMS', layers: capas });
            global.gruposDeCapas.push(grupoWMS);
            global.mapa.addLayer(grupoWMS);
            actualizarPanelCapas();

            console.info(`[visor] ${capas.length} capa(s) WMS cargada(s): ${capas.map(c => c.get('title')).join(', ')}`);
        })
        .catch(err => console.warn('[visor] Error en WMS GetCapabilities:', err));
}

/**
 * Selector: Layer[queryable="1"][opaque="0"][cascaded="0"]
 * Solo coincide con los layers reales (poligonos, lineas).
 * Los layers contenedores como <Layer queryable="1"> sin opaque/cascaded
 * quedan excluidos automaticamente.
 */
function parsearCapasWMS(doc) {
    const capas = [];

    const layerEls = doc.querySelectorAll('Layer[queryable="1"][opaque="0"][cascaded="0"]');

    layerEls.forEach(layerEl => {
        const nameEl  = layerEl.querySelector(':scope > Name');
        const titleEl = layerEl.querySelector(':scope > Title');
        if (!nameEl || !nameEl.textContent.trim()) return;

        const name  = nameEl.textContent.trim();
        const title = titleEl ? titleEl.textContent.trim() : name;

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
