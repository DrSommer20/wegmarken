import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Platform, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient, { clearToken } from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage tiers (placeholder for subscription model)
// Travel-themed storage tiers
const STORAGE_TIERS: any = {
  BACKPACKER: { name: 'Backpacker', color: '#888' },
  EXPLORER: { name: 'Explorer', color: '#ff8a00' },
  GLOBETROTTER: { name: 'Globetrotter', color: '#e52e71' },
};

export default function SettingsScreen() {
  const router = useRouter();
  
  // User info
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  // Preferences
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  
  // Password
  const [showPwChange, setShowPwChange] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // Storage and Subscription
  const [currentTier, setCurrentTier] = useState(STORAGE_TIERS.BACKPACKER);
  const [usedMB, setUsedMB] = useState(0.0);
  const [maxMB, setMaxMB] = useState(500.0);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const saveMapType = async (type: 'standard' | 'satellite' | 'hybrid') => {
    setMapType(type);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('mapType', type);
      } else {
        await AsyncStorage.setItem('mapType', type);
      }
      await apiClient.put('/auth/preferences', { mapType: type });
    } catch (e) { /* ignore */ }
  };

  const fetchUserInfo = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      setUsername(res.data.username || '');
      setEmail(res.data.email || '');
      
      // Update local storage so the map knows our preference immediately
      if (res.data.mapPreference) {
        setMapType(res.data.mapPreference as any);
        if (Platform.OS === 'web') localStorage.setItem('mapType', res.data.mapPreference);
        else AsyncStorage.setItem('mapType', res.data.mapPreference);
      }

      // Check the new nested subscription object we built in the backend
      const sub = res.data.subscription;
      if (sub) {
        setUsedMB(sub.usedStorageMb || 0);
        setMaxMB(sub.maxStorageMb || 500);
        
        // Try to match the backend tier to our local UI tiers
        const tierKey = sub.tier as string;
        if (STORAGE_TIERS[tierKey]) {
          setCurrentTier(STORAGE_TIERS[tierKey]);
        }
      }
    } catch (e) {
      // Don't crash the UI if the backend is down, just fall back to defaults
      console.warn("Couldn't fetch user info, maybe offline?", e);
    }
  };

  const changePassword = async () => {
    if (!oldPw || !newPw) return Alert.alert('Fehler', 'Bitte alle Felder ausfüllen');
    if (newPw !== confirmPw) return Alert.alert('Fehler', 'Neue Passwörter stimmen nicht überein');
    if (newPw.length < 6) return Alert.alert('Fehler', 'Passwort muss mindestens 6 Zeichen lang sein');
    
    try {
      await apiClient.put('/auth/password', { oldPassword: oldPw, newPassword: newPw });
      Alert.alert('Erfolg', 'Passwort wurde geändert');
      setShowPwChange(false);
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Passwort konnte nicht geändert werden';
      Alert.alert('Fehler', msg);
    }
  };

  const handleLogout = async () => {
    await clearToken();
    router.replace('/');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Konto löschen',
      'Bist du sicher? Alle Reisen und Bilder werden unwiderruflich gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Endgültig löschen', style: 'destructive', onPress: async () => {
          try {
            await apiClient.delete('/auth/account');
            await clearToken();
            router.replace('/');
          } catch (e) {
            Alert.alert('Fehler', 'Konto konnte nicht gelöscht werden');
          }
        }},
      ]
    );
  };

  const storagePercent = maxMB === Infinity ? 0 : Math.min((usedMB / maxMB) * 100, 100);

  const MapTypeButton = ({ type, label, icon }: { type: 'standard' | 'satellite' | 'hybrid', label: string, icon: string }) => (
    <TouchableOpacity 
      style={[styles.mapTypeBtn, mapType === type && styles.mapTypeBtnActive]}
      onPress={() => saveMapType(type)}
    >
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={[styles.mapTypeLabel, mapType === type && styles.mapTypeLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Profil</Text>
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.email}>{email || 'Keine E-Mail hinterlegt'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Storage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💾 Speicherplatz</Text>
        <View style={styles.card}>
          <View style={styles.storageHeader}>
            <Text style={styles.storageUsed}>{usedMB.toFixed(1)} MB</Text>
            <View style={[styles.tierBadge, { backgroundColor: currentTier.color + '25' }]}>
              <Text style={[styles.tierText, { color: currentTier.color }]}>{currentTier.name}</Text>
            </View>
          </View>
          <Text style={styles.storageMax}>
            von {maxMB === Infinity ? '∞' : `${(maxMB / 1000).toFixed(1)} GB`}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { 
              width: `${storagePercent}%`, 
              backgroundColor: storagePercent > 80 ? '#e52e71' : '#ff8a00' 
            }]} />
          </View>
          <TouchableOpacity style={styles.upgradeBtn}>
            <Text style={styles.upgradeBtnText}>⬆️ Abo upgraden</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗺️ Kartenansicht</Text>
        <View style={styles.card}>
          <View style={styles.mapTypeRow}>
            <MapTypeButton type="standard" label="Standard" icon="🗺️" />
            <MapTypeButton type="satellite" label="Satellit" icon="🛰️" />
            <MapTypeButton type="hybrid" label="Hybrid" icon="🌐" />
          </View>
        </View>
      </View>

      {/* Password Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Sicherheit</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowPwChange(!showPwChange)}>
            <Text style={styles.menuItemText}>Passwort ändern</Text>
            <Text style={styles.menuItemArrow}>{showPwChange ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          
          {showPwChange && (
            <View style={styles.pwForm}>
              <TextInput
                style={styles.input}
                placeholder="Aktuelles Passwort"
                placeholderTextColor="#666"
                secureTextEntry
                value={oldPw}
                onChangeText={setOldPw}
              />
              <TextInput
                style={styles.input}
                placeholder="Neues Passwort"
                placeholderTextColor="#666"
                secureTextEntry
                value={newPw}
                onChangeText={setNewPw}
              />
              <TextInput
                style={styles.input}
                placeholder="Passwort bestätigen"
                placeholderTextColor="#666"
                secureTextEntry
                value={confirmPw}
                onChangeText={setConfirmPw}
              />
              <TouchableOpacity style={styles.actionBtn} onPress={changePassword}>
                <Text style={styles.actionBtnText}>Passwort ändern</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Social Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Social</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Freundschaftssystem wird bald verfügbar!')}>
            <Text style={styles.menuItemText}>Freunde verwalten</Text>
            <Text style={styles.menuItemArrow}>▶</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Freundschaftsanfragen werden bald verfügbar!')}>
            <Text style={styles.menuItemText}>Freundschaftsanfragen</Text>
            <View style={styles.requestBadge}>
              <Text style={styles.requestBadgeText}>0</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Geteilte Reisen werden bald verfügbar!')}>
            <Text style={styles.menuItemText}>Geteilte Reisen</Text>
            <Text style={styles.menuItemArrow}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ App</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>Expo (React Native)</Text>
          </View>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>🚪 Abmelden</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Text style={styles.deleteBtnText}>🗑️ Konto löschen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  section: { marginHorizontal: 20, marginTop: 24 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  card: {
    backgroundColor: '#1e1e1e', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'
  },

  // Profile
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#ff8a00', alignItems: 'center', justifyContent: 'center'
  },
  avatarText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  username: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  email: { color: '#666', fontSize: 13, marginTop: 2 },

  // Storage
  storageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storageUsed: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  storageMax: { color: '#666', fontSize: 12, marginTop: 2 },
  tierBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  tierText: { fontSize: 12, fontWeight: 'bold' },
  progressBar: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 14, overflow: 'hidden'
  },
  progressFill: { height: '100%', borderRadius: 3 },
  upgradeBtn: {
    marginTop: 14, backgroundColor: 'rgba(255,138,0,0.1)',
    paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,138,0,0.2)'
  },
  upgradeBtnText: { color: '#ff8a00', fontWeight: 'bold', fontSize: 13 },

  // Map Type
  mapTypeRow: { flexDirection: 'row', gap: 10 },
  mapTypeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'
  },
  mapTypeBtnActive: {
    backgroundColor: 'rgba(255,138,0,0.12)', borderColor: '#ff8a00'
  },
  mapTypeLabel: { color: '#888', fontSize: 12, marginTop: 6, fontWeight: '600' },
  mapTypeLabelActive: { color: '#ff8a00' },

  // Menu Items
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)'
  },
  menuItemText: { color: 'white', fontSize: 15 },
  menuItemArrow: { color: '#555', fontSize: 12 },
  requestBadge: {
    backgroundColor: 'rgba(229,46,113,0.2)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10
  },
  requestBadgeText: { color: '#e52e71', fontSize: 12, fontWeight: 'bold' },

  // Password
  pwForm: { marginTop: 12 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', padding: 12,
    borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
  },
  actionBtn: {
    backgroundColor: '#ff8a00', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4
  },
  actionBtnText: { color: 'white', fontWeight: 'bold' },

  // Info
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)'
  },
  infoLabel: { color: '#888', fontSize: 14 },
  infoValue: { color: 'white', fontSize: 14 },

  // Danger Zone
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10
  },
  logoutBtnText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  deleteBtn: {
    backgroundColor: 'rgba(229,46,113,0.08)', padding: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(229,46,113,0.2)'
  },
  deleteBtnText: { color: '#e52e71', fontSize: 15, fontWeight: 'bold' },
});
