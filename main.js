import './style.css';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import LayerGroup from 'ol/layer/Group';
import OSM from 'ol/source/OSM';
import { defaults as defaultControls } from 'ol/control';
import Overlay from 'ol/Overlay.js';
import { proyeccion3857, centroide3857 } from './js/configuracion.js';
import { mousePosicion, actualizarEscala } from './js/controlMousePosicionEscala.js';
import { inicializarControlCapas } from './js/controlCapas.js';
import { zoomPorCodigo } from './js/controlZoomPorCodigo.js';
import './js/barraControles.js';
import './js/controlInicioMasMenos.js';
import './js/controlBuscar.js';
import './js/controlCargarArchivoLocal.js';
import './js/controlUbicarCoordenadas.js';
import { obtenerInformacion } from './js/controlObtenerInformacion.js';

// Capas base
const osmLayer = new TileLayer({
    source: new OSM(),
    title: 'OpenStreetMap',
    type: 'base',
    visible: true,
});

// Overlay popup
global.cubrir = new Overlay({
    element: document.getElementById('popup'),
    autoPan: { animation: { duration: 250 } },
});

// Grupos de capas
const capasBase = new LayerGroup({ title: 'Capas Base', layers: [osmLayer] });
global.grupoCapasExternos = new LayerGroup({ title: 'Capas Externas', layers: [] });

// Vista y mapa
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

// Popup cerrar
const cerrar = document.getElementById('popup-closer');
cerrar.onclick = function () {
    global.cubrir.setPosition(undefined);
    cerrar.blur();
    return false;
};

// Mouse posicion y escala
global.mapa.on('pointermove', mousePosicion);
global.mapa.getView().on('change:resolution', actualizarEscala);
global.mapa.once('rendercomplete', () => actualizarEscala());

// Obtener informacion al hacer click
global.mapa.on('singleclick', (e) => obtenerInformacion(e));

// Sidebar toggle
document.getElementById('toggleSidebar').addEventListener('click', () => {
    document.getElementById('layers-sidebar').classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed');
    setTimeout(() => global.mapa.updateSize(), 320);
});

// Control de capas personalizado
inicializarControlCapas();

// Zoom por parametro URL ?id=<codigo>
zoomPorCodigo();
