import * as React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import type { Coordinates, Route } from '../../types';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon in React-Leaflet
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
    center: Coordinates;
    zoom?: number;
    route?: Route | null;
    startPoint?: Coordinates | null;
    destination?: Coordinates | null;
    onStartDragEnd?: (coords: Coordinates) => void;
    onDestinationDragEnd?: (coords: Coordinates) => void;
}

// Destination custom icon (Hue rotated in CSS)
let DestinationIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    className: 'hue-change'
});

const MapView = ({ center, zoom = 13, route, startPoint, destination, onStartDragEnd, onDestinationDragEnd }: MapViewProps) => {
    const mapRef = React.useRef<L.Map>(null);

    React.useEffect(() => {
        if (mapRef.current && route && route.coordinates.length > 0) {
            const bounds = L.latLngBounds(route.coordinates.map(c => [c.lat, c.lng]));
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        } else if (mapRef.current) {
            // Only fly safely if difference is significant to avoid jitter
            mapRef.current.setView([center.lat, center.lng], zoom);
        }
    }, [route, center, zoom]);

    const handleStartDrag = React.useMemo(
        () => ({
            dragend(e: any) { // Type 'any' for Leaflet event for simplicity or use L.LeafletEvent
                const marker = e.target;
                const position = marker.getLatLng();
                if (onStartDragEnd) {
                    onStartDragEnd({ lat: position.lat, lng: position.lng });
                }
            },
        }),
        [onStartDragEnd],
    );

    const handleDestDrag = React.useMemo(
        () => ({
            dragend(e: any) {
                const marker = e.target;
                const position = marker.getLatLng();
                if (onDestinationDragEnd) {
                    onDestinationDragEnd({ lat: position.lat, lng: position.lng });
                }
            },
        }),
        [onDestinationDragEnd],
    );

    return (
        <MapContainer
            center={[center.lat, center.lng]}
            zoom={zoom}
            className="w-full h-full z-0"
            zoomControl={false}
            ref={mapRef}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Route Display */}
            {route && (
                <Polyline
                    positions={route.coordinates.map(c => [c.lat, c.lng])}
                    pathOptions={{ color: 'blue', weight: 5, opacity: 0.7 }}
                />
            )}

            {/* Start Marker (Draggable) */}
            {(startPoint || center) && (
                <Marker
                    position={startPoint ? [startPoint.lat, startPoint.lng] : [center.lat, center.lng]}
                    draggable={!!onStartDragEnd}
                    eventHandlers={handleStartDrag}
                >
                    <Popup>スタート地点 (ドラッグで移動)</Popup>
                </Marker>
            )}

            {/* Destination Marker (Draggable) */}
            {destination && (
                <Marker
                    position={[destination.lat, destination.lng]}
                    draggable={!!onDestinationDragEnd}
                    eventHandlers={handleDestDrag}
                    icon={DestinationIcon}
                >
                    <Popup>目的地 (ドラッグで移動)</Popup>
                </Marker>
            )}
        </MapContainer>
    );
};

export default MapView;
