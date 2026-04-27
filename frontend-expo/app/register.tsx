import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import apiClient, { setToken } from '../api/apiClient';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleRegister = async () => {
    if (!username || !password) return alert('Bitte alle Felder ausfüllen');
    if (password !== passwordConfirm) return alert('Passwörter stimmen nicht überein');

    try {
      setLoading(true);
      const res = await apiClient.post(`/auth/register`, { username, password });
      await setToken(res.data.token);
      router.replace('/dashboard');
    } catch (e) {
      alert('Fehler bei der Registrierung! Möglicherweise existiert der Nutzername bereits.');
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#ff8a00" /></View>;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.glassPanel}>
          <Text style={styles.title}>Registrieren</Text>
          <Text style={styles.subtitle}>Erstelle einen neuen Account</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Benutzername"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Passwort"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Passwort wiederholen"
              placeholderTextColor="#888"
              secureTextEntry={!showPasswordConfirm}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}>
              <Text style={styles.eyeText}>{showPasswordConfirm ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={handleRegister}>
            <Text style={styles.btnText}>Account erstellen</Text>
          </TouchableOpacity>

          <Link href="/" asChild>
            <TouchableOpacity style={styles.linkBtn}>
              <Text style={styles.linkText}>Zurück zum Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  glassPanel: {
    width: '100%', maxWidth: 400, padding: 24, borderRadius: 24,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    alignItems: 'center'
  },
  title: { fontSize: 32, fontWeight: '800', color: '#ff8a00', marginBottom: 8 },
  subtitle: { color: 'white', marginBottom: 24 },
  input: {
    width: '100%', padding: 14, borderRadius: 12, marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white',
    borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1
  },
  passwordContainer: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1,
    borderRadius: 12, marginBottom: 16
  },
  passwordInput: {
    flex: 1, padding: 14, color: 'white'
  },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 14 },
  eyeText: { fontSize: 18 },
  btn: { width: '100%', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtn: { backgroundColor: '#e52e71' },
  btnText: { color: 'white', fontWeight: '600' },
  linkBtn: { marginTop: 24 },
  linkText: { color: '#ff8a00', fontWeight: 'bold' }
});
