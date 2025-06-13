import shp from 'shpjs';
import LayerGroup from 'ol/layer/Group';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import { proyeccion3857, mensaje } from './configuracion';
import JSZip from 'jszip';

const subirArchivo = document.getElementById('subirArchivo'),
    limpiarArchivo = document.getElementById('limpiarArchivo'),
    archivoZipKml = document.getElementById('archivoZipKmlKmz');

function archivoZipFile(file) {
    const r = new FileReader();
    r.onload = function () {
        if (r.readyState !== 2 || r.error) return;
        else convertirCapaShp(r.result, file.name);
    };
    r.readAsArrayBuffer(file);
}

async function archivoKmlKmzFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    const r = new FileReader();
    r.onload = async function () {
        if (r.readyState !== 2 || r.error) return;

        if (extension === 'kml') {
            convertirCapaKml(r.result, file.name);
        } else if (extension === 'kmz') {
            try {
                const zip = await JSZip.loadAsync(r.result);
                const kmlFile = zip.file(/\.kml$/i)[0];

                if (!kmlFile) {
                    mensaje('mensajeCargar', 'El KMZ no contiene un archivo KML válido.', 'danger');
                    return;
                }

                const kmlText = await kmlFile.async('text');
                convertirCapaKml(kmlText, file.name);
            } catch (err) {
                console.error(err);
                mensaje('mensajeCargar', 'Error al leer el archivo KMZ.', 'danger');
            }
        }
    };

    if (extension === 'kml') {
        r.readAsText(file);
    } else if (extension === 'kmz') {
        r.readAsArrayBuffer(file);
    }
}

function convertirCapaKml(data, nombreKml) {
    const formatoKml = new KML();
    const features = formatoKml.readFeatures(data, {
        featureProjection: proyeccion3857
    });
    agregarCapa(features, 'archivoKML', nombreKml);
}

function convertirCapaShp(buffer, nombreShp) {
    shp(buffer).then(function (geojson) {
        const formatoGeoJson = new GeoJSON();
        const features = formatoGeoJson.readFeatures(geojson, {
            featureProjection: proyeccion3857
        });
        agregarCapa(features, 'archivoSHP', nombreShp);
    });
}

function agregarCapa(features, capaId, capaNombre) {
    const vectorSource = new VectorSource({
        features: features,
    });

    const vectorLayer = new VectorLayer({
        source: vectorSource,
        name: capaId,
        id: capaId,
        title: capaNombre,
        style: function (feature) {
            const geometryType = feature.getGeometry().getType();
            switch (geometryType) {
                case 'Point':
                case 'MultiPoint':
                    return new Style({
                        image: new CircleStyle({
                            radius: 6,
                            fill: new Fill({ color: 'red' }),
                            stroke: new Stroke({ color: 'white', width: 2 })
                        })
                    });
                case 'LineString':
                case 'MultiLineString':
                    return new Style({
                        stroke: new Stroke({
                            color: '#0000FF',
                            width: 2
                        })
                    });
                case 'Polygon':
                case 'MultiPolygon':
                    return new Style({
                        stroke: new Stroke({
                            color: '#ffff00',
                            width: 1
                        }),
                        fill: new Fill({
                            color: 'rgba(100, 100, 100, 0.25)'
                        })
                    });
                default:
                    return null;
            }
        }
    });

    global.grupoCapasExternos.getLayers().push(vectorLayer);
    //global.layerSwitcher.renderPanel();
    const extension = vectorSource.getExtent();
    global.vista.fit(extension, {
        size: global.mapa.getSize(),
        maxZoom: global.vista.getMaxZoom() - 1,
    });
    limpiarArchivo.classList.remove('disabled');
}


subirArchivo.addEventListener('click', function () {
    const files = archivoZipKml.files;
    if (files && files.length > 0) {
        const file = files[0];
        const extension = file.name.split('.').pop().toLowerCase();

        if (extension === 'zip') {
            archivoZipFile(file);
        } else if (extension === 'kml' || extension === 'kmz') {
            archivoKmlKmzFile(file);
        } else {
            mensaje('mensajeCargar', 'Formato de archivo no soportado', 'danger');
        }
    }
});

limpiarArchivo.addEventListener('click', function () {

    global.gruposDeCapas.forEach(grupo => {
        if (grupo instanceof LayerGroup) {
            grupo.getLayers().forEach(layer => {
                if (layer.get('id') === 'archivoSHP' || layer.get('id') === 'archivoKML') {
                    archivoZipKml.value = '';
                    limpiarArchivo.classList.add('disabled');
                    grupo.getLayers().remove(layer);
                    //global.layerSwitcher.renderPanel();
                }
            });
        }
    });
});