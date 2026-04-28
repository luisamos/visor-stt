import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill } from 'ol/style';
import { direcionServicioWFS, proyeccion3857 } from './configuracion.js';

// Capas WFS donde se busca el codigo
const CAPAS_WFS = ['poligonos', 'lineas'];

/**
 * Lee el parametro ?id= de la URL, busca en todas las capas WFS
 * con filtro OGC EqualTo (formato MapServer) y acerca el mapa
 * al resultado encontrado resaltandolo en verde.
 */
export function zoomPorCodigo() {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('id');
    if (!codigo) return;

    console.info(`[visor] Buscando codigo "${codigo}" en: ${CAPAS_WFS.join(', ')}`);

    const promesas = CAPAS_WFS.map(typeName => buscarEnCapaWFS(typeName, codigo));

    Promise.allSettled(promesas).then(resultados => {
        const features = [];
        resultados.forEach((r, i) => {
            if (r.status === 'fulfilled' && r.value.length > 0) {
                console.info(`[visor] ${r.value.length} feature(s) en "${CAPAS_WFS[i]}".`);
                features.push(...r.value);
            }
        });

        if (features.length === 0) {
            console.warn(`[visor] Codigo "${codigo}" no encontrado en ninguna capa WFS.`);
            return;
        }

        const estiloPoligono = new Style({
            stroke: new Stroke({ color: '#27ae60', width: 3 }),
            fill:   new Fill({ color: 'rgba(39, 174, 96, 0.22)' }),
        });
        const estiloLinea = new Style({
            stroke: new Stroke({ color: '#27ae60', width: 4 }),
        });

        const source = new VectorSource({ features });
        const layer  = new VectorLayer({
            source,
            title: `Predio: ${codigo}`,
            style: (feature) => {
                const tipo = feature.getGeometry().getType();
                return tipo.includes('LineString') ? estiloLinea : estiloPoligono;
            },
        });

        global.grupoCapasExternos.getLayers().push(layer);

        global.vista.fit(source.getExtent(), {
            size:     global.mapa.getSize(),
            padding:  [70, 60, 60, 60],
            maxZoom:  18,
            duration: 1200,
        });
    });
}

/**
 * Construye un filtro OGC Filter EqualTo compatible con MapServer WFS.
 *
 * Genera:
 *   <Filter xmlns="http://www.opengis.net/ogc">
 *     <PropertyIsEqualTo>
 *       <PropertyName>codigo</PropertyName>
 *       <Literal>PAT-ALT-001</Literal>
 *     </PropertyIsEqualTo>
 *   </Filter>
 */
function buildOGCFilter(campo, valor) {
    return (
        '<Filter xmlns="http://www.opengis.net/ogc">' +
            '<PropertyIsEqualTo>' +
                `<PropertyName>${campo}</PropertyName>` +
                `<Literal>${valor}</Literal>` +
            '</PropertyIsEqualTo>' +
        '</Filter>'
    );
}

/**
 * Consulta una capa WFS usando FILTER OGC EqualTo (MapServer).
 * Devuelve un array de OL Features (vacio si no hay resultado).
 */
function buscarEnCapaWFS(typeName, codigo) {
    const filter = buildOGCFilter('codigo', codigo);

    const url =
        `${direcionServicioWFS}` +
        `?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature` +
        `&typeName=${encodeURIComponent(typeName)}` +
        `&outputFormat=application/json` +
        `&srsname=EPSG:3857` +
        `&FILTER=${encodeURIComponent(filter)}`;

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
            return [];
        });
}
