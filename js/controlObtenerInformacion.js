import LayerGroup from 'ol/layer/Group';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import { proyeccion3857, formatoText } from './configuracion';

const botonInformacion = document.getElementById("obtenerInformacion"),
contenido = document.getElementById('popup-content');

botonInformacion.addEventListener("click", function () {
    this.classList.toggle("active");    
});

export function obtenerInformacion(e)
{
    if(botonInformacion.classList.contains("active")) {
        const coordinate = e.coordinate;
        const resolucionVista = /** @type {number} */ (global.vista.getResolution());

        global.gruposDeCapas.forEach(grupo => {
            if (grupo instanceof LayerGroup) {
                grupo.getLayers().forEach(layer => {                    
                    if(layer.get('id') !== 'poligonoLinea' && layer.getVisible() && layer.get('type') !== 'base' && layer.get('type') !== 'undefined') {
                        const source = layer.getSource();
                        if(source instanceof TileWMS || source instanceof ImageWMS)
                        {                            
                            const url = source.getFeatureInfoUrl(coordinate, resolucionVista, proyeccion3857, {'INFO_FORMAT': formatoText});
                            if (url)
                            {
                                fetch(url)
                                .then(response => response.text())
                                .then(data => {
                                    contenido.innerHTML = data;
                                    global.cubrir.setPosition(e.coordinate);                        
                                })
                                .catch(error => console.error('Error al obtener GetFeatureInfo:', error));
                            }
                        }
                    }
                });
            } else console.log('El objeto no es un grupo de capas:', grupo);
        }); 
    }
}
