import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import LayerGroup from 'ol/layer/Group';
import { direcionServicioWMS } from './configuracion.js';
import { actualizarPanelCapas } from './controlCapas.js';

/**
 * Carga capas WMS desde GetCapabilities usando ImageLayer+ImageWMS:
 * genera UNA sola peticion por capa por render en lugar de
 * cientos de peticiones de tiles (TileWMS).
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
                console.warn('[visor] WMS GetCapabilities: no se encontraron capas.');
                return;
            }

            const grupoWMS = new LayerGroup({ title: 'Capas WMS', layers: capas });
            global.gruposDeCapas.push(grupoWMS);
            global.mapa.addLayer(grupoWMS);
            actualizarPanelCapas();

            console.info(`[visor] ${capas.length} capa(s) WMS: ${capas.map(c => c.get('title')).join(', ')}`);
        })
        .catch(err => console.warn('[visor] Error WMS GetCapabilities:', err));
}

/**
 * Solo toma Layer[queryable="1"][opaque="0"][cascaded="0"] (layers reales).
 * Usa ImageWMS: 1 request por capa por render, vs cientos con TileWMS.
 */
function parsearCapasWMS(doc) {
    const capas = [];

    doc.querySelectorAll('Layer[queryable="1"][opaque="0"][cascaded="0"]').forEach(layerEl => {
        const nameEl  = layerEl.querySelector(':scope > Name');
        const titleEl = layerEl.querySelector(':scope > Title');
        if (!nameEl || !nameEl.textContent.trim()) return;

        const name  = nameEl.textContent.trim();
        const title = titleEl ? titleEl.textContent.trim() : name;

        capas.push(new ImageLayer({
            title,
            visible: true,
            source: new ImageWMS({
                url: direcionServicioWMS,
                params: {
                    LAYERS:  name,
                    FORMAT:  'image/png',
                    VERSION: '1.1.1',
                },
                serverType: 'mapserver',
            }),
        }));
    });

    return capas;
}
