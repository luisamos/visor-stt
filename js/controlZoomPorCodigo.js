import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill } from 'ol/style';
import { direcionServicioWFS, proyeccion3857 } from './configuracion.js';

export function zoomPorCodigo() {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('id');
    if (!codigo) return;

    const url =
        `${direcionServicioWFS}` +
        `?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature` +
        `&typeName=predios` +
        `&outputFormat=application/json` +
        `&CQL_FILTER=codigo='${encodeURIComponent(codigo)}'` +
        `&srsname=EPSG:3857`;

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(`WFS error: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (!data.features || data.features.length === 0) {
                console.warn(`[visor] Predio con codigo "${codigo}" no encontrado.`);
                return;
            }

            const format   = new GeoJSON();
            const features = format.readFeatures(data, { featureProjection: proyeccion3857 });
            const source   = new VectorSource({ features });

            const layer = new VectorLayer({
                source,
                title: `Predio: ${codigo}`,
                style: new Style({
                    stroke: new Stroke({ color: '#e63946', width: 3 }),
                    fill:   new Fill({ color: 'rgba(230, 57, 70, 0.18)' }),
                }),
            });

            global.grupoCapasExternos.getLayers().push(layer);

            global.vista.fit(source.getExtent(), {
                size:    global.mapa.getSize(),
                padding: [70, 50, 50, 50],
                maxZoom: 18,
                duration: 1200,
            });
        })
        .catch(err => console.warn('[visor] Error al obtener predio por codigo:', err));
}
