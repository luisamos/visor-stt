import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill } from 'ol/style';
import { direcionServicioWFS, proyeccion3857 } from './configuracion.js';

// Capas WFS donde se busca el codigo
const CAPAS_WFS = ['poligonos', 'lineas'];

/**
 * Lee el parametro ?id= de la URL, busca en todas las capas WFS definidas
 * y acerca el mapa al primer resultado encontrado, resaltandolo en verde.
 */
export function zoomPorCodigo() {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('id');
    if (!codigo) return;

    console.info(`[visor] Buscando codigo "${codigo}" en: ${CAPAS_WFS.join(', ')}`);

    // Buscar en ambas capas en paralelo
    const promesas = CAPAS_WFS.map(typeName => buscarEnCapaWFS(typeName, codigo));

    Promise.allSettled(promesas).then(resultados => {
        // Reunir todos los features encontrados
        const features = [];
        resultados.forEach((r, i) => {
            if (r.status === 'fulfilled' && r.value.length > 0) {
                console.info(`[visor] ${r.value.length} feature(s) encontrado(s) en "${CAPAS_WFS[i]}".`);
                features.push(...r.value);
            }
        });

        if (features.length === 0) {
            console.warn(`[visor] Codigo "${codigo}" no encontrado en ninguna capa WFS.`);
            return;
        }

        // Estilo verde segun tipo de geometria
        const estiloPoligono = new Style({
            stroke: new Stroke({ color: '#27ae60', width: 3 }),
            fill:   new Fill({ color: 'rgba(39, 174, 96, 0.22)' }),
        });
        const estiloLinea = new Style({
            stroke: new Stroke({ color: '#27ae60', width: 4 }),
        });

        const source = new VectorSource({ features });

        const layer = new VectorLayer({
            source,
            title: `Predio: ${codigo}`,
            style: (feature) => {
                const tipo = feature.getGeometry().getType();
                return tipo.includes('LineString') ? estiloLinea : estiloPoligono;
            },
        });

        // Agregar capa resaltada al grupo de capas externas
        global.grupoCapasExternos.getLayers().push(layer);

        // Acercar al extent del feature encontrado
        global.vista.fit(source.getExtent(), {
            size:     global.mapa.getSize(),
            padding:  [70, 60, 60, 60],
            maxZoom:  18,
            duration: 1200,
        });
    });
}

/**
 * Hace un GetFeature WFS a una capa con CQL_FILTER=codigo='<codigo>'.
 * Devuelve array de OL Features (puede ser vacio si no hay resultado).
 */
function buscarEnCapaWFS(typeName, codigo) {
    const url =
        `${direcionServicioWFS}` +
        `?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature` +
        `&typeName=${encodeURIComponent(typeName)}` +
        `&outputFormat=application/json` +
        `&CQL_FILTER=codigo='${encodeURIComponent(codigo)}'` +
        `&srsname=EPSG:3857`;

    return fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (!data.features || data.features.length === 0) return [];
            const format = new GeoJSON();
            return format.readFeatures(data, { featureProjection: proyeccion3857 });
        })
        .catch(err => {
            console.warn(`[visor] WFS "${typeName}" error:`, err.message);
            return []; // no interrumpir la busqueda en las otras capas
        });
}
