import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

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

export default function MapComponent({ stops, onMapClick, tempMarker, onMarkerClick, isEditMode, onMarkerDragEnd, mapType = 'hybrid', showRoute }: MapProps) {
  const initialRegion = {
    latitude: stops.length > 0 && stops[0].latitude ? stops[0].latitude : 51.1657,
    longitude: stops.length > 0 && stops[0].longitude ? stops[0].longitude : 10.4515,
    latitudeDelta: 5,
    longitudeDelta: 5,
  };

  const routeCoordinates = stops
    .filter(s => s.latitude != null && s.longitude != null)
    .map(s => ({ latitude: s.latitude, longitude: s.longitude }));

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        initialRegion={initialRegion}
        userInterfaceStyle="dark"
        mapType={mapType}
        onPress={(e) => onMapClick && onMapClick(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
      >
        {showRoute && routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#ff8a00"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
        {stops.map(stop => (
          (stop.latitude != null && stop.longitude != null) ? (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              title={stop.name}
              description={stop.description}
              onPress={() => onMarkerClick && onMarkerClick(stop)}
              draggable={isEditMode}
              onDragEnd={(e) => onMarkerDragEnd && onMarkerDragEnd(stop.id, e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
            />
          ) : null
        ))}

        {tempMarker ? (
          <Marker
            coordinate={{ latitude: tempMarker.latitude, longitude: tempMarker.longitude }}
            pinColor="blue"
            title="Neuer Stopp"
            opacity={0.6}
          />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
