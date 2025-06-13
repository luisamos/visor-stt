import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import { estiloMarcadorRojo } from './configuracion';
import datos from '../json/datos3857.json';
import Fuse from 'fuse.js';

const searchInput = document.getElementById('txtBuscar');
const resultsContainer = document.getElementById('resultado');

let marker = null;

const fuse = new Fuse(datos, {
    keys: ['a', 'b'],
    threshold: 0.3,
    includeScore: true,
});

function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

function buscar() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    resultsContainer.innerHTML = '';

    if (searchTerm === '') return;

    const resultados = fuse.search(searchTerm).slice(0, 20).map(r => r.item);

    if (resultados.length === 0) {
        resultsContainer.innerHTML = '<div class="result-item">No se encontraron resultados</div>';
        return;
    }

    resultados.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item');
        resultItem.textContent = item.b;

        resultItem.addEventListener('click', () => {
            const coordenadas = [item.x, item.y];
            if (marker) {
                global.mapa.removeLayer(marker);
            }

            marker = new VectorLayer({
                source: new VectorSource({
                    features: [
                        new Feature({
                            geometry: new Point(coordenadas),
                        })
                    ]
                }),
                style: estiloMarcadorRojo,
            });

            global.mapa.addLayer(marker);
            global.vista.animate({
                center: coordenadas,
                duration: 1000
            });
        });

        resultsContainer.appendChild(resultItem);
    });
}

searchInput.addEventListener('input', debounce(buscar, 300));
