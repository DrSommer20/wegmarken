import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, TextInput, ScrollView, KeyboardAvoidingView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import apiClient from '../../api/apiClient';
import { writeNfcTag } from '../../services/nfcService';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import MapComponent from '../../components/MapComponent';
import DatePickerField from '../../components/DatePicker';

// GlassPanel OUTSIDE the main component so React doesn't unmount/remount it on every state change
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

export default function TripScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  
  // UI State
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [selectedStop, setSelectedStop] = useState<any>(null);
  const [tempMarker, setTempMarker] = useState<{ latitude: number, longitude: number } | null>(null);
  const [showStopList, setShowStopList] = useState(false);
  
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

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (mode === 'edit') {
      setTempMarker({ latitude: lat, longitude: lng });
      setSelectedStop(null);
    }
  }, [mode]);

  const saveStop = async () => {
    if (!tempMarker || !stopName) return Alert.alert('Fehler', 'Bitte Name und Position angeben');
    
    const nextOrder = (trip?.stops?.length || 0);
    
    try {
      await apiClient.post(`/trips/${id}/stops`, {
        name: stopName,
        description: stopDesc,
        stopDate: stopDate || null,
        latitude: tempMarker.latitude,
        longitude: tempMarker.longitude,
        sortOrder: nextOrder
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

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      Alert.alert('Upload', `${result.assets.length} Bilder werden hochgeladen...`);
      try {
        const formData = new FormData();
        
        if (Platform.OS === 'web') {
          const promises = result.assets.map(async (asset, index) => {
            const fileName = asset.fileName || `image-${index}.jpg`;
            const res = await fetch(asset.uri);
            const blob = await res.blob();
            formData.append('files', blob, fileName);
          });
          await Promise.all(promises);
        } else {
          result.assets.forEach((asset, index) => {
            const fileName = asset.fileName || `image-${index}.jpg`;
            const fileType = asset.mimeType || 'image/jpeg';
            formData.append('files', {
              uri: asset.uri,
              name: fileName,
              type: fileType,
            } as any);
          });
        }

        console.log('Uploading to:', `${apiClient.defaults.baseURL}/trips/${id}/bulk-images`);
        
        const response = await apiClient.post(`/trips/${id}/bulk-images`, formData, {
          headers: Platform.OS !== 'web' ? { 'Content-Type': 'multipart/form-data' } : {},
          timeout: 120000, // 2 min timeout for large uploads
        });
        
        console.log('Upload response:', response.status);
        Alert.alert('Erfolg', 'Bilder hochgeladen und verarbeitet!');
        fetchTrip();
      } catch (e: any) {
        console.error('Upload Error:', e?.response?.status, e?.response?.data, e?.message);
        const statusInfo = e?.response?.status ? ` (Status: ${e.response.status})` : '';
        Alert.alert('Fehler', `Upload fehlgeschlagen${statusInfo}: ${e?.message}`);
      }
    }
  };

  // Get sorted stops for display
  const getSortedStops = () => {
    if (!trip?.stops) return [];
    const stops = [...trip.stops];
    if (trip.tripType === 'ROADTRIP') {
      // For roadtrips: sort by sortOrder first, then by date
      stops.sort((a: any, b: any) => {
        if (a.sortOrder !== null && b.sortOrder !== null && a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        if (a.stopDate && b.stopDate) return a.stopDate.localeCompare(b.stopDate);
        return 0;
      });
    }
    return stops;
  };

  const moveStop = async (index: number, direction: 'up' | 'down') => {
    const sorted = getSortedStops();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    
    // Swap sortOrder values
    const stopA = sorted[index];
    const stopB = sorted[targetIndex];
    
    try {
      await apiClient.put(`/trips/${id}/stops/${stopA.id}`, { ...stopA, sortOrder: targetIndex });
      await apiClient.put(`/trips/${id}/stops/${stopB.id}`, { ...stopB, sortOrder: index });
      fetchTrip();
    } catch (e) {
      console.error(e);
    }
  };

  if (!trip) return <View style={styles.center}><Text style={{ color: 'white' }}>Lade...</Text></View>;

  const sortedStops = getSortedStops();
  const isRoadtrip = trip.tripType === 'ROADTRIP';

  return (
    <View style={styles.container}>
      <MapComponent 
        stops={sortedStops} 
        onMapClick={handleMapClick}
        tempMarker={tempMarker}
        isEditMode={mode === 'edit'}
        onMarkerDragEnd={async (stopId, lat, lng) => {
          const stop = trip.stops.find((s: any) => s.id === stopId);
          if (stop) {
            try {
              await apiClient.put(`/trips/${id}/stops/${stopId}`, {
                ...stop,
                latitude: lat,
                longitude: lng
              });
              fetchTrip();
            } catch(e) {
              Alert.alert('Fehler', 'Stop-Position konnte nicht gespeichert werden');
            }
          }
        }}
        onMarkerClick={(stop) => {
          if (mode === 'view') {
            setSelectedStop(stop);
            setTempMarker(null);
            setShowStopList(false);
          }
        }}
      />
      
      {/* Top Buttons */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.controlBtn} onPress={pickImages}>
          <Text style={styles.controlBtnText}>📸 Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => {
          setShowStopList(!showStopList);
          setSelectedStop(null);
          setTempMarker(null);
        }}>
          <Text style={styles.controlBtnText}>📋 Stops</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => {
          setMode(mode === 'view' ? 'edit' : 'view');
          setShowStopList(false);
          setSelectedStop(null);
          setTempMarker(null);
        }}>
          <Text style={styles.controlBtnText}>{mode === 'view' ? '✏️ Bearbeiten' : '👁️ Ansicht'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleNfc}>
          <Text style={styles.controlBtnText}>🧲</Text>
        </TouchableOpacity>
      </View>

      {/* Stop List Panel */}
      {showStopList && (
        <GlassPanel style={styles.stopListOverlay}>
          <View style={styles.overlayHeader}>
            <Text style={styles.overlayTitle}>
              {isRoadtrip ? '🚗 Route' : '📍 Stops'} ({sortedStops.length})
            </Text>
            <TouchableOpacity onPress={() => setShowStopList(false)}>
              <Text style={{color: 'white', fontSize: 20}}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            {sortedStops.map((stop: any, index: number) => (
              <View key={stop.id} style={styles.stopListItem}>
                <View style={styles.stopListLeft}>
                  {isRoadtrip && (
                    <View style={styles.stopNumber}>
                      <Text style={styles.stopNumberText}>{index + 1}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stopListName}>{stop.name}</Text>
                    {stop.stopDate && <Text style={styles.stopListDate}>{stop.stopDate}</Text>}
                  </View>
                </View>
                {isRoadtrip && mode === 'edit' && (
                  <View style={styles.sortButtons}>
                    <TouchableOpacity 
                      style={[styles.sortBtn, index === 0 && styles.sortBtnDisabled]}
                      onPress={() => moveStop(index, 'up')}
                      disabled={index === 0}
                    >
                      <Text style={styles.sortBtnText}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.sortBtn, index === sortedStops.length - 1 && styles.sortBtnDisabled]}
                      onPress={() => moveStop(index, 'down')}
                      disabled={index === sortedStops.length - 1}
                    >
                      <Text style={styles.sortBtnText}>▼</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
            {sortedStops.length === 0 && (
              <Text style={{ color: '#555', textAlign: 'center', marginTop: 20 }}>Noch keine Stops</Text>
            )}
          </ScrollView>
        </GlassPanel>
      )}

      {/* Selected Stop Details (View Mode) */}
      {mode === 'view' && selectedStop && !showStopList && (
        <GlassPanel style={styles.overlay}>
          <View style={styles.overlayHeader}>
            <Text style={styles.title}>{selectedStop.name}</Text>
            <TouchableOpacity onPress={() => setSelectedStop(null)}>
              <Text style={{color: 'white', fontSize: 20}}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.dateText}>{selectedStop.stopDate || 'Kein Datum'}</Text>
          <Text style={styles.desc}>{selectedStop.description || 'Keine Beschreibung vorhanden.'}</Text>
          
          {/* Bilder anzeigen */}
          {(() => {
            const stopImages = trip?.images?.filter((img: any) => img.stop?.id === selectedStop.id) || [];
            if (stopImages.length > 0) {
              return (
                <ScrollView horizontal style={styles.imageScroll} showsHorizontalScrollIndicator={false}>
                  {stopImages.map((img: any) => (
                    <Image key={img.id} source={{ uri: img.url }} style={styles.stopImage} />
                  ))}
                </ScrollView>
              );
            }
            return null;
          })()}
        </GlassPanel>
      )}

      {/* Add Stop Form (Edit Mode) */}
      {mode === 'edit' && tempMarker && !showStopList && (
        <KeyboardAvoidingView 
          style={styles.formWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <GlassPanel style={styles.overlayForm}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.overlayTitle}>Neuen Stopp hinzufügen</Text>
              <TextInput
                style={styles.input}
                placeholder="Name des Stopps"
                placeholderTextColor="#888"
                value={stopName}
                onChangeText={setStopName}
                autoCapitalize="sentences"
              />
              <TextInput
                style={[styles.input, { minHeight: 50, textAlignVertical: 'top' }]}
                placeholder="Beschreibung (optional)"
                placeholderTextColor="#888"
                value={stopDesc}
                onChangeText={setStopDesc}
                multiline
              />
              <DatePickerField value={stopDate} onChange={setStopDate} placeholder="Datum wählen" />
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setTempMarker(null)}>
                  <Text style={styles.btnText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={saveStop}>
                  <Text style={styles.btnText}>Speichern</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </GlassPanel>
        </KeyboardAvoidingView>
      )}

      {/* Default Overlay (when nothing selected) */}
      {!selectedStop && !tempMarker && !showStopList && (
        <GlassPanel style={styles.overlay}>
          <View style={styles.overlayHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{trip.name}</Text>
              {isRoadtrip && (
                <View style={[styles.badge, { alignSelf: 'flex-start', marginTop: 4 }]}>
                  <Text style={styles.badgeText}>🚗 Roadtrip</Text>
                </View>
              )}
            </View>
          </View>
          {trip.description ? <Text style={styles.desc}>{trip.description}</Text> : null}
          {(trip.startDate || trip.endDate) && (
            <Text style={styles.dateText}>{trip.startDate} → {trip.endDate}</Text>
          )}
          <Text style={styles.stopCount}>{sortedStops.length} Stops</Text>
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
    flexDirection: 'row', justifyContent: 'flex-end', gap: 8, zIndex: 10
  },
  controlBtn: {
    backgroundColor: 'rgba(30,30,30,0.9)', paddingHorizontal: 14, paddingVertical: 10, 
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  controlBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  overlay: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    padding: 20, borderRadius: 20, zIndex: 10, overflow: 'hidden'
  },
  stopListOverlay: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    padding: 20, borderRadius: 20, zIndex: 10, overflow: 'hidden'
  },
  formWrapper: {
    position: 'absolute', bottom: 30, left: 20, right: 20, zIndex: 10,
  },
  overlayForm: {
    padding: 20, borderRadius: 20, overflow: 'hidden'
  },
  overlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  overlayTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  glass: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  glassFallback: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ff8a00', marginBottom: 4 },
  dateText: { color: '#ff8a00', fontSize: 12, fontWeight: 'bold', marginTop: 6 },
  desc: { color: 'white', fontSize: 15, lineHeight: 22, marginTop: 4 },
  stopCount: { color: '#555', fontSize: 11, marginTop: 6 },
  badge: { backgroundColor: 'rgba(229, 46, 113, 0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { color: '#e52e71', fontSize: 11, fontWeight: 'bold' },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', padding: 12, 
    borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.05)' },
  confirmBtn: { backgroundColor: '#ff8a00' },
  btnText: { color: 'white', fontWeight: 'bold' },

  // Stop List
  stopListItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, marginBottom: 8
  },
  stopListLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stopNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#e52e71',
    alignItems: 'center', justifyContent: 'center', marginRight: 10
  },
  stopNumberText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  stopListName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  stopListDate: { color: '#ff8a00', fontSize: 11 },
  sortButtons: { flexDirection: 'row', gap: 4 },
  sortBtn: { 
    backgroundColor: 'rgba(255,255,255,0.1)', width: 28, height: 28, 
    borderRadius: 6, alignItems: 'center', justifyContent: 'center' 
  },
  sortBtnDisabled: { opacity: 0.3 },
  sortBtnText: { color: 'white', fontSize: 12 },
  
  // Images
  imageScroll: { marginTop: 15, flexDirection: 'row' },
  stopImage: { width: 80, height: 80, borderRadius: 10, marginRight: 10, backgroundColor: '#333' }
});
