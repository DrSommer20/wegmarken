import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface MapProps {
  stops: any[];
  onMapClick?: (lat: number, lng: number) => void;
  tempMarker?: { latitude: number, longitude: number } | null;
  onMarkerClick?: (stop: any) => void;
  isEditMode?: boolean;
  onMarkerDragEnd?: (stopId: number, lat: number, lng: number) => void;
}

export default function MapComponent({ stops, onMapClick, tempMarker, onMarkerClick, isEditMode, onMarkerDragEnd }: MapProps) {
  const initialRegion = {
    latitude: stops.length > 0 && stops[0].latitude ? stops[0].latitude : 51.1657,
    longitude: stops.length > 0 && stops[0].longitude ? stops[0].longitude : 10.4515,
    latitudeDelta: 5,
    longitudeDelta: 5,
  };

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        initialRegion={initialRegion}
        userInterfaceStyle="dark"
        onPress={(e) => onMapClick && onMapClick(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
      >
        {stops.map(stop => (
          stop.latitude && stop.longitude && (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              title={stop.name}
              description={stop.description}
              onPress={() => onMarkerClick && onMarkerClick(stop)}
              draggable={isEditMode}
              onDragEnd={(e) => onMarkerDragEnd && onMarkerDragEnd(stop.id, e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
            />
          )
        ))}

        {tempMarker && (
          <Marker
            coordinate={{ latitude: tempMarker.latitude, longitude: tempMarker.longitude }}
            pinColor="blue"
            title="Neuer Stopp"
            opacity={0.6}
          />
        )}
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
