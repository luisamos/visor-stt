import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import LayerGroup from 'ol/layer/Group';
import { direcionServicioWMS } from './configuracion.js';
import { actualizarPanelCapas } from './controlCapas.js';

/**
 * Llama a WMS GetCapabilities, parsea las capas disponibles
 * y las agrega dinamicamente al mapa y al panel de capas.
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

            // Agregar al mapa y al array global (usado por obtenerInformacion)
            global.gruposDeCapas.push(grupoWMS);
            global.mapa.addLayer(grupoWMS);

            // Refrescar el panel lateral de capas
            actualizarPanelCapas();

            console.info(`[visor] ${capas.length} capa(s) WMS cargada(s) desde GetCapabilities.`);
        })
        .catch(err => console.warn('[visor] Error al obtener WMS GetCapabilities:', err));
}

/**
 * Parsea el XML de GetCapabilities y devuelve un array de TileLayer.
 * Solo toma capas que tienen un elemento <Name> con contenido
 * (evita el layer raiz contenedor que no tiene nombre util).
 */
function parsearCapasWMS(doc) {
    const capas = [];

    // Filtrar Layer con <Name> directo y no vacio
    const layerEls = Array.from(doc.querySelectorAll('Layer')).filter(el => {
        const nameEl = el.querySelector(':scope > Name');
        return nameEl && nameEl.textContent.trim().length > 0;
    });

    layerEls.forEach(layerEl => {
        const name = layerEl.querySelector(':scope > Name').textContent.trim();

        const titleEl = layerEl.querySelector(':scope > Title');
        const title   = titleEl ? titleEl.textContent.trim() : name;

        // Visibilidad inicial: encendida
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
