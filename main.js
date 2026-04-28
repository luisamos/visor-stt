import './style.css';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import LayerGroup from 'ol/layer/Group';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { defaults as defaultControls } from 'ol/control';
import Overlay from 'ol/Overlay.js';
import { proyeccion3857, centroide3857 } from './js/configuracion.js';
import { mousePosicion, actualizarEscala } from './js/controlMousePosicionEscala.js';
import { inicializarControlCapas } from './js/controlCapas.js';
import { zoomPorCodigo } from './js/controlZoomPorCodigo.js';
import { cargarCapasWMS } from './js/controlCapasWMS.js';
import { inicializarDibujo } from './js/controlDibujo.js';
import './js/barraControles.js';
import './js/controlInicioMasMenos.js';
import './js/controlBuscar.js';
import './js/controlCargarArchivoLocal.js';
import './js/controlUbicarCoordenadas.js';
import { obtenerInformacion } from './js/controlObtenerInformacion.js';

// ── Capas base ──────────────────────────────────────────
const osmLayer = new TileLayer({
    source: new OSM(),
    title: 'OpenStreetMap', type: 'base', visible: false,
});
const googleSatelite = new TileLayer({
    source: new XYZ({ url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', maxZoom: 20, attributions: '© Google' }),
    title: 'Google Satélite', type: 'base', visible: true,
});
const googleCalles = new TileLayer({
    source: new XYZ({ url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', maxZoom: 20, attributions: '© Google' }),
    title: 'Google Calles', type: 'base', visible: false,
});
const osmNoche = new TileLayer({
    source: new XYZ({ url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', maxZoom: 19, attributions: '© CartoDB' }),
    title: 'OSM Noche', type: 'base', visible: false,
});
const esriNoche = new TileLayer({
    source: new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', maxZoom: 16, attributions: '© Esri' }),
    title: 'ESRI Noche', type: 'base', visible: false,
});

// ── Overlay popup ─────────────────────────────────────────
global.cubrir = new Overlay({
    element: document.getElementById('popup'),
    autoPan: { animation: { duration: 250 } },
});

// ── Grupos de capas ──────────────────────────────────────
const capasBase = new LayerGroup({
    title: 'Capas Base',
    layers: [osmLayer, googleSatelite, googleCalles, osmNoche, esriNoche],
});
global.grupoCapasExternos = new LayerGroup({ title: 'Capas Externas', layers: [] });

// ── Vista y mapa ─────────────────────────────────────────
global.vista = new View({ projection: proyeccion3857, center: centroide3857, zoom: 14 });
const controles = defaultControls({ zoom: false, attribution: false, rotate: true });
global.gruposDeCapas = [capasBase, global.grupoCapasExternos];

global.mapa = new Map({
    target: 'map',
    layers: global.gruposDeCapas,
    view: global.vista,
    controls: controles,
    overlays: [global.cubrir],
});

// Loader: mínimo 2s; ocultar cuando mapa renderice o tras 5s de fallback
const tiempoMinimo = new Promise(resolve => setTimeout(resolve, 2000));
const mapaListo    = new Promise(resolve => {
    global.mapa.once('rendercomplete', resolve);
    setTimeout(resolve, 5000);
});

Promise.all([tiempoMinimo, mapaListo]).then(() => {
    actualizarEscala();
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.classList.add('oculto');
        loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }
});

// Cerrar popup
const cerrar = document.getElementById('popup-closer');
cerrar.onclick = function () {
    global.cubrir.setPosition(undefined);
    cerrar.blur();
    return false;
};

global.mapa.on('pointermove', mousePosicion);
global.mapa.getView().on('change:resolution', actualizarEscala);
global.mapa.on('singleclick', (e) => obtenerInformacion(e));

// Sidebar toggle
document.getElementById('toggleSidebar').addEventListener('click', () => {
    document.getElementById('layers-sidebar').classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed');
    setTimeout(() => global.mapa.updateSize(), 320);
});

inicializarControlCapas();
inicializarDibujo();
cargarCapasWMS();
zoomPorCodigo();
