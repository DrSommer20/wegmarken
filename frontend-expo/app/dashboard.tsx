import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient, { clearToken } from '../api/apiClient';

export default function Dashboard() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // New Trip State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await apiClient.get('/trips');
      setTrips(res.data);
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Reisen konnten nicht geladen werden');
    }
  };

  const handleLogout = async () => {
    await clearToken();
    router.replace('/');
  };

  const createTrip = async () => {
    if (!newName) return Alert.alert('Fehler', 'Bitte gib einen Namen an');
    
    try {
      const res = await apiClient.post('/trips', { 
        name: newName, 
        description: newDesc,
        startDate: startDate || null,
        endDate: endDate || null
      });
      setTrips([...trips, res.data]);
      setModalVisible(false);
      setNewName('');
      setNewDesc('');
      setStartDate('');
      setEndDate('');
    } catch (e) {
      console.error(e);
      Alert.alert('Fehler', 'Trip konnte nicht erstellt werden');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/trip/${item.id}`)}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardDesc}>{item.description}</Text>
      {(item.startDate || item.endDate) && (
        <Text style={styles.cardDate}>
          {item.startDate || '?'} - {item.endDate || '?'}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.btnText}>+ Neue Reise</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleLogout}>
          <Text style={styles.btnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={trips}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Neue Reise planen</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Name der Reise"
              placeholderTextColor="#888"
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.input}
              placeholder="Beschreibung"
              placeholderTextColor="#888"
              value={newDesc}
              onChangeText={setNewDesc}
            />
            <TextInput
              style={styles.input}
              placeholder="Start (YYYY-MM-DD)"
              placeholderTextColor="#888"
              value={startDate}
              onChangeText={setStartDate}
            />
            <TextInput
              style={styles.input}
              placeholder="Ende (YYYY-MM-DD)"
              placeholderTextColor="#888"
              value={endDate}
              onChangeText={setEndDate}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={createTrip}>
                <Text style={styles.btnText}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  list: { paddingBottom: 20 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12
  },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  cardDesc: { color: '#aaa', marginTop: 4 },
  cardDate: { color: '#ff8a00', fontSize: 12, marginTop: 8, fontWeight: 'bold' },
  primaryBtn: { backgroundColor: '#e52e71', padding: 12, borderRadius: 10 },
  secondaryBtn: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 12, borderRadius: 10 },
  btnText: { color: 'white', fontWeight: 'bold' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { 
    width: '90%', maxWidth: 400, backgroundColor: '#1a1a1a', 
    borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 20 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', padding: 14, 
    borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.05)' },
  confirmBtn: { backgroundColor: '#ff8a00' }
});
