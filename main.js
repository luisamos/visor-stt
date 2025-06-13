import './style.css';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import LayerGroup from 'ol/layer/Group';
import OSM from 'ol/source/OSM';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';
import { defaults as defaultControls } from 'ol/control';
import Overlay from 'ol/Overlay.js';
import { proyeccion3857, centroide3857 } from './js/configuracion.js';
import { mousePosicion, actualizarEscala } from './js/controlMousePosicionEscala.js';

//Capas temáticas
const osmLayer = new TileLayer({ source: new OSM(), title: 'OpenStreetMap', type: 'base', visible: true, });
//const poligonos = new TileLayer({ source: new TileWMS({ url: direcionServicioWMS, params: { 'LAYERS': 'poligonos', 'TILED': true, 'FORMAT': formatoPNG }, serverType: 'mapserver', transition: 0 }), title: 'Poligonos', visible: true });
//const lineas = new TileLayer({ source: new TileWMS({ url: direcionServicioWMS, params: { 'LAYERS': 'lineas', 'TILED': true, 'FORMAT': formatoPNG }, serverType: 'mapserver', transition: 0 }), title: 'Líneas', visible: true });
//const sector07 = new TileLayer({source: new TileWMS({url: 'http://209.45.78.210:9100/cgi-bin/mapcache/?', params: {'LAYERS': 'mdw-sector07', 'TILED': true, 'FORMAT': formatoJPEG, VERSION: '1.1.1'}, serverType: 'mapserver', transition: 0}), title: 'Sector07', visible: true});
//const manzanas = new TileLayer({source: new TileWMS({url: 'http://209.45.78.210:9100/servicio/wms?', params: {'LAYERS': 'manzanas', 'TILED': true, 'FORMAT': formatoPNG, VERSION: '1.1.1'}, serverType: 'mapserver', transition: 0}), title: 'Manzanas', visible: true});
global.cubrir = new Overlay({ element: document.getElementById('popup'), autoPan: { animation: { duration: 250, }, }, });

// Grupos de capas
const capasBase = new LayerGroup({ title: 'Capas Base', layers: [osmLayer], });
global.grupoCapasExternos = new LayerGroup({ title: 'Capas externas', layers: [] });
//global.capaConsulta = new LayerGroup({ title: 'Consulta', layers: [] });

global.vista = new View({ projection: proyeccion3857, center: centroide3857, zoom: 14 });
const controles = defaultControls({ zoom: false, attribution: false, rotate: true });
global.gruposDeCapas = [capasBase, global.grupoCapasExternos];
global.mapa = new Map({ target: 'map', layers: gruposDeCapas, view: global.vista, controls: controles, overlays: [cubrir], });
const cerrar = document.getElementById('popup-closer');
global.layerSwitcher = new LayerSwitcher({ tipLabel: 'Capas', groupSelectStyle: 'children', collapsed: false });
global.mapa.addControl(global.layerSwitcher);

// 0. Mouse Posición - Escala
global.mapa.on('pointermove', mousePosicion);
global.mapa.getView().on('change:resolution', actualizarEscala);
global.mapa.once('rendercomplete', function () { actualizarEscala(); });

// 1. Barra de controles
import './js/barraControles.js';
// 2. Control de Mas y Menos
import './js/controlInicioMasMenos.js';
// 3. Buscar por Centros Poblados.
import './js/controlBuscar.js';
// 4. Cargar archivos local
import './js/controlCargarArchivoLocal.js';
// 5. Obtener por coordenadas
import './js/controlUbicarCoordenadas.js';
// 5. Obtener información
import { obtenerInformacion } from './js/controlObtenerInformacion.js';
global.mapa.on('singleclick', function (e) { obtenerInformacion(e); });
cerrar.onclick = function () { global.cubrir.setPosition(undefined); cerrar.blur(); return false; };
