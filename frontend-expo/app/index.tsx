import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import apiClient, { setToken, getToken } from '../api/apiClient';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    const token = await getToken();
    if (token) {
      router.replace('/dashboard');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!username || !password) return alert('Bitte ausfüllen');
    try {
      setLoading(true);
      const res = await apiClient.post(`/auth/login`, { username, password });
      await setToken(res.data.token);
      router.replace('/dashboard');
    } catch (e) {
      alert('Falscher Benutzername oder Passwort!');
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#ff8a00" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.glassPanel}>
        <Text style={styles.title}>Wegmarken</Text>
        <Text style={styles.subtitle}>Bitte melde dich an</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Benutzername"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Passwort"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={handleLogin}>
          <Text style={styles.btnText}>Login</Text>
        </TouchableOpacity>

        <Link href="/register" asChild>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>Noch kein Account? Registrieren</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 20 },
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
  btn: { width: '100%', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryBtn: { backgroundColor: '#e52e71' },
  btnText: { color: 'white', fontWeight: '600' },
  linkBtn: { marginTop: 24 },
  linkText: { color: '#ff8a00', fontWeight: 'bold' }
});
