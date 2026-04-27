import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
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
  mapType?: 'standard' | 'satellite' | 'hybrid';
  showRoute?: boolean;
}

function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const TILE_LAYERS = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
  },
  hybrid: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labelUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
  },
};

export default function MapComponent({ stops, onMapClick, tempMarker, onMarkerClick, isEditMode, onMarkerDragEnd, mapType = 'hybrid', showRoute }: MapProps) {
  const center: [number, number] = stops.length > 0 && stops[0].latitude 
    ? [stops[0].latitude, stops[0].longitude] 
    : [51.1657, 10.4515];

  const tileConfig = TILE_LAYERS[mapType] || TILE_LAYERS.standard;
  const useDarkFilter = mapType === 'standard';

  const routeCoordinates: [number, number][] = stops
    .filter(s => s.latitude != null && s.longitude != null)
    .map(s => [s.latitude, s.longitude]);

  return (
    <View style={styles.container}>
      <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          key={mapType}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          className={useDarkFilter ? 'map-tiles-dark' : ''}
        />
        {mapType === 'hybrid' && (tileConfig as any).labelUrl && (
          <TileLayer
            key="hybrid-labels"
            url={(tileConfig as any).labelUrl}
            attribution={tileConfig.attribution}
          />
        )}
        <MapEvents onMapClick={onMapClick} />
        
        {showRoute && routeCoordinates.length > 1 && (
          <Polyline 
            positions={routeCoordinates}
            pathOptions={{ color: '#ff8a00', weight: 3, dashArray: '5, 10' }}
          />
        )}
        
        {stops.map(stop => (
          (stop.latitude != null && stop.longitude != null) ? (
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
          ) : null
        ))}

        {tempMarker ? (
          <Marker position={[tempMarker.latitude, tempMarker.longitude]} opacity={0.6}>
            <Popup>Neuer Stopp</Popup>
          </Marker>
        ) : null}
      </MapContainer>
      <style>
        {`
          .map-tiles-dark { filter: invert(100%) hue-rotate(180deg) brightness(80%) contrast(90%); }
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
