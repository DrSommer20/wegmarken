import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../api/apiClient';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function FriendsScreen() {
  const router = useRouter();
  const [friends, setFriends] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [myUsername, setMyUsername] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showMyQr, setShowMyQr] = useState(false);
  
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    fetchFriends();
    fetchMe();
  }, []);

  const fetchMe = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      setMyUsername(res.data.username);
    } catch (e) {}
  };

  const fetchFriends = async () => {
    try {
      const res = await apiClient.get('/friends');
      setFriends(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const addFriend = async (friendName: string) => {
    if (!friendName) return;
    try {
      await apiClient.post('/friends/add', { username: friendName });
      Alert.alert('Erfolg', `${friendName} wurde zu deinen Freunden hinzugefügt!`);
      setUsername('');
      setShowScanner(false);
      fetchFriends();
    } catch (e) {
      Alert.alert('Fehler', 'User konnte nicht gefunden werden');
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    // Expecting the QR code to just contain the username
    addFriend(data);
  };

  const startScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Kamera', 'Kamerazugriff wird benötigt um QR-Codes zu scannen');
        return;
      }
    }
    setShowScanner(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: 'white', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Freunde</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder="Username eingeben..."
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
        />
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.addBtn} onPress={() => addFriend(username)}>
            <Text style={styles.btnText}>Hinzufügen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qrBtn} onPress={startScanner}>
            <Text style={styles.btnText}>📷 Scan QR</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.myQrBtn} onPress={() => setShowMyQr(true)}>
        <Text style={styles.myQrText}>Mein QR-Code anzeigen</Text>
      </TouchableOpacity>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.friendCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.friendName}>{item.username}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Du hast noch keine Freunde hinzugefügt.</Text>
        }
      />

      {/* QR Scanner Modal */}
      <Modal visible={showScanner} animationType="slide">
        <View style={styles.modalContainer}>
          <CameraView 
            style={StyleSheet.absoluteFillObject} 
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
          <TouchableOpacity style={styles.closeModal} onPress={() => setShowScanner(false)}>
            <Text style={styles.closeModalText}>Abbrechen</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* My QR Modal */}
      <Modal visible={showMyQr} transparent animationType="fade">
        <View style={styles.qrOverlay}>
          <View style={styles.qrContent}>
            <Text style={styles.qrTitle}>Dein Freunde-Code</Text>
            <View style={styles.qrContainer}>
              {myUsername ? <QRCode value={myUsername} size={200} backgroundColor="white" /> : null}
            </View>
            <Text style={styles.qrUsername}>{myUsername}</Text>
            <TouchableOpacity style={styles.closeQr} onPress={() => setShowMyQr(false)}>
              <Text style={styles.closeQrText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 24 },
  backBtn: { padding: 8 },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  
  addSection: { marginBottom: 24 },
  input: { backgroundColor: '#1a1a1a', color: 'white', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  actionRow: { flexDirection: 'row', gap: 12 },
  addBtn: { flex: 1, backgroundColor: '#e52e71', padding: 14, borderRadius: 12, alignItems: 'center' },
  qrBtn: { flex: 1, backgroundColor: '#333', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  
  myQrBtn: { padding: 12, alignItems: 'center', marginBottom: 20 },
  myQrText: { color: '#ff8a00', fontWeight: 'bold' },
  
  friendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 16, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e52e71', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  friendName: { color: 'white', fontSize: 18, fontWeight: '500' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40 },
  
  modalContainer: { flex: 1, backgroundColor: 'black' },
  closeModal: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  closeModalText: { color: 'white', fontWeight: 'bold' },
  
  qrOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  qrContent: { backgroundColor: 'white', padding: 32, borderRadius: 32, alignItems: 'center' },
  qrTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#121212' },
  qrContainer: { padding: 10, backgroundColor: 'white' },
  qrUsername: { fontSize: 24, fontWeight: 'bold', marginTop: 16, color: '#e52e71' },
  closeQr: { marginTop: 24, padding: 12 },
  closeQrText: { color: '#666', fontWeight: 'bold' }
});
