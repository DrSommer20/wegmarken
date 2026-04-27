import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Modal, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import apiClient from '../../api/apiClient';
import { writeNfcTag } from '../../services/nfcService';
import { BlurView } from 'expo-blur';
import MapComponent from '../../components/MapComponent';

export default function TripScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  
  // UI State
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [selectedStop, setSelectedStop] = useState<any>(null);
  const [tempMarker, setTempMarker] = useState<{ latitude: number, longitude: number } | null>(null);
  
  // New Stop State
  const [stopName, setStopName] = useState('');
  const [stopDesc, setStopDesc] = useState('');
  const [stopDate, setStopDate] = useState('');

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

  const handleMapClick = (lat: number, lng: number) => {
    if (mode === 'edit') {
      setTempMarker({ latitude: lat, longitude: lng });
      setSelectedStop(null);
    }
  };

  const saveStop = async () => {
    if (!tempMarker || !stopName) return Alert.alert('Fehler', 'Bitte Name und Position angeben');
    
    try {
      await apiClient.post(`/trips/${id}/stops`, {
        name: stopName,
        description: stopDesc,
        stopDate: stopDate || null,
        latitude: tempMarker.latitude,
        longitude: tempMarker.longitude
      });
      setTempMarker(null);
      setStopName('');
      setStopDesc('');
      setStopDate('');
      fetchTrip();
    } catch (e) {
      Alert.alert('Fehler', 'Stop konnte nicht gespeichert werden');
    }
  };

  const handleNfc = () => {
    const url = `https://dev.sopa-it.de/trip/${id}`;
    writeNfcTag(url);
  };

  const GlassPanel = ({ children, style }: any) => {
    if (Platform.OS === 'android') {
      return <View style={[styles.glassFallback, style]}>{children}</View>;
    }
    return (
      <BlurView intensity={80} tint="dark" style={[styles.glass, style]}>
        {children}
      </BlurView>
    );
  };

  if (!trip) return <View style={styles.center}><Text style={{ color: 'white' }}>Lade...</Text></View>;

  return (
    <View style={styles.container}>
      <MapComponent 
        stops={trip.stops || []} 
        onMapClick={handleMapClick}
        tempMarker={tempMarker}
        onMarkerClick={(stop) => {
          if (mode === 'view') {
            setSelectedStop(stop);
            setTempMarker(null);
          }
        }}
      />
      
      {/* Top Buttons */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setMode(mode === 'view' ? 'edit' : 'view')}>
          <Text style={styles.controlBtnText}>{mode === 'view' ? '✏️ Bearbeiten' : '👁️ Ansicht'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleNfc}>
          <Text style={styles.controlBtnText}>🧲 NFC</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Stop Details (View Mode) */}
      {mode === 'view' && selectedStop && (
        <GlassPanel style={styles.overlay}>
          <View style={styles.overlayHeader}>
            <Text style={styles.title}>{selectedStop.name}</Text>
            <TouchableOpacity onPress={() => setSelectedStop(null)}>
              <Text style={{color: 'white', fontSize: 20}}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.dateText}>{selectedStop.stopDate || 'Kein Datum'}</Text>
          <Text style={styles.desc}>{selectedStop.description || 'Keine Beschreibung vorhanden.'}</Text>
        </GlassPanel>
      )}

      {/* Add Stop Form (Edit Mode) */}
      {mode === 'edit' && tempMarker && (
        <GlassPanel style={styles.overlay}>
          <Text style={styles.overlayTitle}>Neuen Stopp hinzufügen</Text>
          <TextInput
            style={styles.input}
            placeholder="Name des Stopps"
            placeholderTextColor="#888"
            value={stopName}
            onChangeText={setStopName}
          />
          <TextInput
            style={styles.input}
            placeholder="Beschreibung"
            placeholderTextColor="#888"
            value={stopDesc}
            onChangeText={setStopDesc}
          />
          <TextInput
            style={styles.input}
            placeholder="Datum (YYYY-MM-DD)"
            placeholderTextColor="#888"
            value={stopDate}
            onChangeText={setStopDate}
          />
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setTempMarker(null)}>
              <Text style={styles.btnText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={saveStop}>
              <Text style={styles.btnText}>Speichern</Text>
            </TouchableOpacity>
          </View>
        </GlassPanel>
      )}

      {/* Default Overlay (when nothing selected) */}
      {!selectedStop && !tempMarker && (
        <GlassPanel style={styles.overlay}>
          <Text style={styles.title}>{trip.name}</Text>
          <Text style={styles.desc}>{trip.description}</Text>
          <Text style={styles.dateText}>{trip.startDate} bis {trip.endDate}</Text>
        </GlassPanel>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  topControls: {
    position: 'absolute', top: 50, right: 20, left: 20,
    flexDirection: 'row', justifyContent: 'flex-end', gap: 10, zIndex: 10
  },
  controlBtn: {
    backgroundColor: 'rgba(30,30,30,0.9)', paddingHorizontal: 16, paddingVertical: 10, 
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  controlBtnText: { color: 'white', fontWeight: 'bold' },
  overlay: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    padding: 24, borderRadius: 24, zIndex: 10, overflow: 'hidden'
  },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  overlayTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  glass: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  glassFallback: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ff8a00', marginBottom: 4 },
  dateText: { color: '#ff8a00', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  desc: { color: 'white', fontSize: 16, lineHeight: 22 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', padding: 12, 
    borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.05)' },
  confirmBtn: { backgroundColor: '#ff8a00' },
  btnText: { color: 'white', fontWeight: 'bold' }
});
