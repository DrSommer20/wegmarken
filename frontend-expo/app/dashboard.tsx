import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient, { clearToken } from '../api/apiClient';
import DatePickerField from '../components/DatePicker';

export default function Dashboard() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // State for creating a new trip in the modal
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripType, setTripType] = useState<'NORMAL' | 'ROADTRIP'>('NORMAL');

  useEffect(() => {
    // Initial load of all user trips
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await apiClient.get('/trips');
      setTrips(res.data);
    } catch (e) {
      console.error("Oops, couldn't fetch trips:", e);
      Alert.alert('Fehler', 'Reisen konnten nicht geladen werden');
    }
  };

  const handleLogout = async () => {
    await clearToken();
    router.replace('/');
  };

  const resetModal = () => {
    // Clean up the modal fields after saving or canceling
    setModalVisible(false);
    setNewName('');
    setNewDesc('');
    setStartDate('');
    setEndDate('');
    setTripType('NORMAL');
  };

  const createTrip = async () => {
    if (!newName) return Alert.alert('Fehler', 'Bitte gib einen Namen an');
    
    try {
      const res = await apiClient.post('/trips', { 
        name: newName, 
        description: newDesc,
        startDate: startDate || null,
        endDate: endDate || null,
        tripType
      });
      setTrips([...trips, res.data]);
      resetModal();
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Trip konnte nicht erstellt werden');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/trip/${item.id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.tripType === 'ROADTRIP' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🚗 Roadtrip</Text>
          </View>
        )}
      </View>
      {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
      {(item.startDate || item.endDate) && (
        <Text style={styles.cardDate}>
          {item.startDate || '?'} → {item.endDate || '?'}
        </Text>
      )}
      <Text style={styles.stopCount}>{item.stops?.length || 0} Stops</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.btnText}>+ Neue Reise</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/settings')}>
          <Text style={styles.btnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={trips}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Noch keine Reisen angelegt</Text>
            <Text style={styles.emptySubtext}>Drücke "+ Neue Reise" um zu starten</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={resetModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Neue Reise planen</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Name der Reise"
                placeholderTextColor="#888"
                value={newName}
                onChangeText={setNewName}
                autoCapitalize="sentences"
              />
              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                placeholder="Beschreibung (optional)"
                placeholderTextColor="#888"
                value={newDesc}
                onChangeText={setNewDesc}
                multiline
              />

              {/* Trip Type Toggle */}
              <Text style={styles.label}>Art der Reise</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity 
                  style={[styles.typeBtn, tripType === 'NORMAL' && styles.typeBtnActive]}
                  onPress={() => setTripType('NORMAL')}
                >
                  <Text style={[styles.typeBtnText, tripType === 'NORMAL' && styles.typeBtnTextActive]}>
                    📍 Normal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, tripType === 'ROADTRIP' && styles.typeBtnActive]}
                  onPress={() => setTripType('ROADTRIP')}
                >
                  <Text style={[styles.typeBtnText, tripType === 'ROADTRIP' && styles.typeBtnTextActive]}>
                    🚗 Roadtrip
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Zeitraum</Text>
              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <DatePickerField value={startDate} onChange={setStartDate} placeholder="Startdatum" />
                </View>
                <Text style={styles.dateSep}>→</Text>
                <View style={{ flex: 1 }}>
                  <DatePickerField value={endDate} onChange={setEndDate} placeholder="Enddatum" />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={resetModal}>
                  <Text style={styles.btnText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={createTrip}>
                  <Text style={styles.btnText}>Speichern</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  list: { paddingBottom: 20 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#888', fontSize: 18 },
  emptySubtext: { color: '#555', fontSize: 14, marginTop: 8 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', flex: 1 },
  cardDesc: { color: '#aaa', marginTop: 4 },
  cardDate: { color: '#ff8a00', fontSize: 12, marginTop: 8, fontWeight: 'bold' },
  stopCount: { color: '#555', fontSize: 11, marginTop: 4 },
  badge: { backgroundColor: 'rgba(229, 46, 113, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#e52e71', fontSize: 11, fontWeight: 'bold' },
  primaryBtn: { backgroundColor: '#e52e71', padding: 12, borderRadius: 10 },
  secondaryBtn: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 12, borderRadius: 10 },
  btnText: { color: 'white', fontWeight: 'bold' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { 
    width: '100%', maxWidth: 400, backgroundColor: '#1a1a1a', 
    borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 20 },
  label: { color: '#aaa', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', padding: 14, 
    borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeBtn: { 
    flex: 1, padding: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  typeBtnActive: { backgroundColor: 'rgba(229, 46, 113, 0.15)', borderColor: '#e52e71' },
  typeBtnText: { color: '#888', fontWeight: 'bold' },
  typeBtnTextActive: { color: '#e52e71' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dateSep: { color: '#ff8a00', fontSize: 18, fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.05)' },
  confirmBtn: { backgroundColor: '#ff8a00' }
});
