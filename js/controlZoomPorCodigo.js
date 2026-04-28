import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill } from 'ol/style';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { direcionServicioWFS, proyeccion3857, proyeccion32719 } from './configuracion.js';

// Registrar EPSG:32719 en OpenLayers para poder reproyectar los features
proj4.defs('EPSG:32719', '+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs');
register(proj4);

// Nombre del layer WFS en MapServer (NAME del LAYER en el .map)
// Agregar mas nombres si existen layers equivalentes para lineas
const CAPAS_WFS = ['buscarTitularPoligono'];

/**
 * Lee ?id= de la URL, busca en los layers WFS de MapServer
 * con filtro OGC PropertyIsEqualTo y acerca el mapa al resultado en verde.
 */
export function zoomPorCodigo() {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('id');
    if (!codigo) return;

    console.info(`[visor] Buscando codigo "${codigo}" en WFS: ${CAPAS_WFS.join(', ')}`);

    const promesas = CAPAS_WFS.map(typeName => buscarEnCapaWFS(typeName, codigo));

    Promise.allSettled(promesas).then(resultados => {
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
 * Filtro OGC Filter EqualTo para MapServer WFS.
 *
 *   <Filter xmlns="http://www.opengis.net/ogc">
 *     <PropertyIsEqualTo>
 *       <PropertyName>codigo</PropertyName>
 *       <Literal>PAC-ALT-001</Literal>
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
 * Consulta WFS al layer de MapServer:
 *  - outputFormat=geojson  (segun wfs_getfeature_formatlist del .map)
 *  - srsname=EPSG:32719    (SRS nativo del layer en MapServer)
 *  - datos se reproyectan a EPSG:3857 al leer los features en OL
 */
function buscarEnCapaWFS(typeName, codigo) {
    const filter = buildOGCFilter('codigo', codigo);

    const url =
        `${direcionServicioWFS}` +
        `?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature` +
        `&typeName=${encodeURIComponent(typeName)}` +
        `&outputFormat=geojson` +
        `&srsname=EPSG:32719` +
        `&FILTER=${encodeURIComponent(filter)}`;

    return fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (!data.features || data.features.length === 0) return [];
            const format = new GeoJSON();
            // dataProjection = SRS en que vienen los datos (32719)
            // featureProjection = SRS que usa el mapa (3857)
            return format.readFeatures(data, {
                dataProjection:    proyeccion32719,
                featureProjection: proyeccion3857,
            });
        })
        .catch(err => {
            console.warn(`[visor] WFS "${typeName}" error:`, err.message);
            return [];
        });
}
