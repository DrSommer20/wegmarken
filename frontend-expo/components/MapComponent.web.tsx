import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  stops: any[];
  onMapClick?: (lat: number, lng: number) => void;
  tempMarker?: { latitude: number, longitude: number } | null;
  onMarkerClick?: (stop: any) => void;
  isEditMode?: boolean;
  onMarkerDragEnd?: (stopId: number, lat: number, lng: number) => void;
}

function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapComponent({ stops, onMapClick, tempMarker, onMarkerClick, isEditMode, onMarkerDragEnd }: MapProps) {
  const center: [number, number] = stops.length > 0 && stops[0].latitude 
    ? [stops[0].latitude, stops[0].longitude] 
    : [51.1657, 10.4515];

  return (
    <View style={styles.container}>
      <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        <MapEvents onMapClick={onMapClick} />
        
        {stops.map(stop => (
          stop.latitude && stop.longitude && (
            <Marker 
              key={stop.id} 
              position={[stop.latitude, stop.longitude]}
              draggable={isEditMode}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(stop),
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  if (onMarkerDragEnd) onMarkerDragEnd(stop.id, position.lat, position.lng);
                }
              }}
            >
              <Popup>{stop.name}</Popup>
            </Marker>
          )
        ))}

        {tempMarker && (
          <Marker position={[tempMarker.latitude, tempMarker.longitude]} opacity={0.6}>
            <Popup>Neuer Stopp</Popup>
          </Marker>
        )}
      </MapContainer>
      <style>
        {`
          .map-tiles { filter: invert(100%) hue-rotate(180deg) brightness(80%) contrast(90%); }
          .leaflet-container { background: #121212; }
        `}
      </style>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  }
});
