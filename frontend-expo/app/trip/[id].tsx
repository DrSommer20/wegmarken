import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import apiClient from '../../api/apiClient';
import { writeNfcTag } from '../../services/nfcService';
import { BlurView } from 'expo-blur';
// Metro Bundler resolves this automatically to MapComponent.web.tsx or MapComponent.native.tsx
import MapComponent from '../../components/MapComponent';

export default function TripScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    try {
      const res = await apiClient.get(`/trips/${id}`);
      setTrip(res.data);
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Trip konnte nicht geladen werden');
      router.back();
    }
  };

  const handleNfc = () => {
    const url = `https://dev.sommer-home.com/trip/${id}`;
    writeNfcTag(url);
  };

  const GlassPanel = ({ children, style }: any) => {
    if (Platform.OS === 'android') {
      // Fallback for Android performance
      return <View style={[styles.glassFallback, style]}>{children}</View>;
    }
    return (
      <BlurView intensity={80} tint="dark" style={[styles.glass, style]}>
        {children}
      </BlurView>
    );
  };

  if (!trip) return <View style={styles.center}><Text style={{color: 'white'}}>Lade...</Text></View>;

  return (
    <View style={styles.container}>
      <MapComponent stops={trip.stops || []} />
      
      <TouchableOpacity style={styles.nfcBtn} onPress={handleNfc}>
        <Text style={{fontSize: 24}}>🧲</Text>
      </TouchableOpacity>

      <GlassPanel style={styles.overlay}>
        <Text style={styles.title}>{trip.name}</Text>
        <Text style={styles.desc}>{trip.description}</Text>
        
        <View style={styles.stopsContainer}>
          <Text style={styles.stopsTitle}>Wegmarken ({trip.stops?.length || 0})</Text>
          {trip.stops?.map((stop: any) => (
            <View key={stop.id} style={styles.stopItem}>
              <Text style={styles.stopName}>{stop.name}</Text>
              <Text style={styles.stopDesc}>{stop.description}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => Alert.alert('WIP', 'Stop hinzufügen UI folgt')}>
          <Text style={styles.btnText}>Stop hinzufügen</Text>
        </TouchableOpacity>
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  nfcBtn: {
    position: 'absolute', top: 20, right: 20,
    backgroundColor: 'rgba(30,30,30,0.8)', padding: 12, borderRadius: 30,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', zIndex: 10
  },
  overlay: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    padding: 24, borderRadius: 24, zIndex: 10,
    overflow: 'hidden'
  },
  glass: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  glassFallback: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ff8a00', marginBottom: 4 },
  desc: { color: 'white', marginBottom: 16 },
  stopsContainer: { maxHeight: 150, marginBottom: 16 },
  stopsTitle: { color: '#aaa', fontWeight: 'bold', marginBottom: 8 },
  stopItem: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12, marginBottom: 8 },
  stopName: { color: 'white', fontWeight: 'bold' },
  stopDesc: { color: '#aaa', fontSize: 12 },
  primaryBtn: { backgroundColor: '#e52e71', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' }
});
