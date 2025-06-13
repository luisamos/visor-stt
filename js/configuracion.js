import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import imagenVerde from '../imgs/ubicacionVerde.png';
import imagenRojo from '../imgs/ubicacionRojo.png';

export const direcionServicioWMS = 'http://127.0.0.1/servicio/wms',
    direcionServicioWFS = 'http://127.0.0.1/servicio/wfs',
    centroide3857 = [-7819510.69315815, -2036265.3964852241],
    proyeccion3857 = 'EPSG:3857',
    proyeccion4326 = 'EPSG:4326',
    proyeccion32717 = 'EPSG:32717',
    proyeccion32718 = 'EPSG:32718',
    proyeccion32719 = 'EPSG:32719',
    formatoPNG = 'image/png',
    formatoJPEG = 'image/jpeg',
    formatoJson = 'application/json',
    formatoText = 'text/html',
    formatoGeoJson = 'geojson',
    estiloMarcadorVerde = new Style({
        image: new Icon({
            anchor: [0.2, 20],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            src: imagenVerde,
        })
    }),
    estiloMarcadorRojo = new Style({
        image: new Icon({
            anchor: [0.2, 20],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            src: imagenRojo,
        })
    });

export function mensaje(id, mensaje, tipo) {
    const alertPlaceholder = document.getElementById(id);
    const texto = '<div class="alert alert-' + tipo + ' alert-dismissible py-1 px-2" role="alert">' +
        ' <div>' + mensaje + '</div>' +
        ' <button type="button" class="btn-close btn-close-sm" data-bs-dismiss="alert" aria-label="Close" style="transform: scale(0.8);"></button>' +
        '</div>';
    alertPlaceholder.innerHTML = texto;
}