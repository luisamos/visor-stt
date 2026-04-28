import Draw from 'ol/interaction/Draw';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import Overlay from 'ol/Overlay';
import { getArea, getLength } from 'ol/sphere';
import { Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import { unByKey } from 'ol/Observable';

let drawInteraction = null;
let sketchListener  = null;
let dinamicoTooltip = null;
let activeBtn       = null;
const tooltipOverlays = [];

let drawSource, drawLayer;

const estiloDibujo = new Style({
    fill:   new Fill({ color: 'rgba(255,204,51,0.15)' }),
    stroke: new Stroke({ color: '#e67e22', width: 2, lineDash: [7, 4] }),
    image:  new CircleStyle({
        radius: 5,
        fill:   new Fill({ color: '#e67e22' }),
        stroke: new Stroke({ color: '#fff', width: 1.5 }),
    }),
});

function crearTooltip() {
    const el = document.createElement('div');
    el.className = 'measure-tooltip measure-tooltip-dynamic';
    const overlay = new Overlay({
        element: el,
        offset: [0, -14],
        positioning: 'bottom-center',
        stopEvent: false,
        insertFirst: false,
    });
    global.mapa.addOverlay(overlay);
    tooltipOverlays.push(overlay);
    return { el, overlay };
}

function formatArea(geom) {
    const a = getArea(geom, { projection: 'EPSG:3857' });
    return a >= 10000 ? `${(a / 10000).toFixed(3)} ha` : `${a.toFixed(1)} m²`;
}

function formatLength(geom) {
    const l = getLength(geom, { projection: 'EPSG:3857' });
    return l >= 1000 ? `${(l / 1000).toFixed(3)} km` : `${l.toFixed(1)} m`;
}

function deactivate() {
    if (drawInteraction) {
        global.mapa.removeInteraction(drawInteraction);
        drawInteraction = null;
    }
    if (sketchListener) { unByKey(sketchListener); sketchListener = null; }
    if (activeBtn) { activeBtn.classList.remove('active'); activeBtn = null; }
    if (dinamicoTooltip) { dinamicoTooltip.overlay.setPosition(undefined); dinamicoTooltip = null; }
}

function startDraw(type, mode, btn) {
    deactivate();
    activeBtn = btn;
    btn.classList.add('active');

    if (mode) dinamicoTooltip = crearTooltip();

    drawInteraction = new Draw({ source: drawSource, type, style: estiloDibujo });

    drawInteraction.on('drawstart', (evt) => {
        const geom = evt.feature.getGeometry();
        sketchListener = geom.on('change', (e) => {
            if (!mode || !dinamicoTooltip) return;
            const g = e.target;
            if (mode === 'area') {
                dinamicoTooltip.el.innerHTML = formatArea(g);
                dinamicoTooltip.overlay.setPosition(g.getInteriorPoint().getCoordinates());
            } else {
                dinamicoTooltip.el.innerHTML = formatLength(g);
                dinamicoTooltip.overlay.setPosition(g.getLastCoordinate());
            }
        });
    });

    drawInteraction.on('drawend', (evt) => {
        if (sketchListener) { unByKey(sketchListener); sketchListener = null; }
        if (mode && dinamicoTooltip) {
            const geom = evt.feature.getGeometry();
            const text = mode === 'area' ? formatArea(geom) : formatLength(geom);
            const pos  = mode === 'area'
                ? geom.getInteriorPoint().getCoordinates()
                : geom.getLastCoordinate();
            dinamicoTooltip.el.innerHTML = text;
            dinamicoTooltip.el.classList.remove('measure-tooltip-dynamic');
            dinamicoTooltip.el.classList.add('measure-tooltip-static');
            dinamicoTooltip.overlay.setPosition(pos);
            dinamicoTooltip = null;
            // La medición termina al completar una figura
            setTimeout(() => deactivate(), 50);
        }
    });

    global.mapa.addInteraction(drawInteraction);
}

export function inicializarDibujo() {
    drawSource = new VectorSource({ wrapX: false });
    drawLayer  = new VectorLayer({ source: drawSource, style: estiloDibujo, zIndex: 500 });
    global.mapa.addLayer(drawLayer);

    const btnPoli    = document.getElementById('dibujarPoligono');
    const btnLinea   = document.getElementById('dibujarLinea');
    const btnArea    = document.getElementById('medirArea');
    const btnPerim   = document.getElementById('medirPerimetro');
    const btnLimpiar = document.getElementById('limpiarDibujos');
    const btnPrint   = document.getElementById('btnImprimir');

    btnPoli.addEventListener('click', () =>
        btnPoli.classList.contains('active') ? deactivate() : startDraw('Polygon', null, btnPoli));

    btnLinea.addEventListener('click', () =>
        btnLinea.classList.contains('active') ? deactivate() : startDraw('LineString', null, btnLinea));

    btnArea.addEventListener('click', () =>
        btnArea.classList.contains('active') ? deactivate() : startDraw('Polygon', 'area', btnArea));

    btnPerim.addEventListener('click', () =>
        btnPerim.classList.contains('active') ? deactivate() : startDraw('LineString', 'length', btnPerim));

    btnLimpiar.addEventListener('click', () => {
        deactivate();
        drawSource.clear();
        tooltipOverlays.forEach(o => global.mapa.removeOverlay(o));
        tooltipOverlays.length = 0;
    });

    btnPrint.addEventListener('click', () => window.print());
}
