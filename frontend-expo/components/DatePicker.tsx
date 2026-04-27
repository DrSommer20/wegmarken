import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface DatePickerProps {
  value: string; // ISO date string YYYY-MM-DD or ''
  onChange: (date: string) => void;
  placeholder?: string;
}

export default function DatePickerField({ value, onChange, placeholder }: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  if (Platform.OS === 'web') {
    // Web: native HTML date input
    return (
      <View style={styles.container}>
        <input
          type="date"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(0,0,0,0.3)',
            color: value ? 'white' : '#888',
            fontSize: 14,
            fontFamily: 'inherit',
            outline: 'none',
            colorScheme: 'dark',
          }}
        />
      </View>
    );
  }

  // Native: use community date picker
  const DateTimePicker = require('@react-native-community/datetimepicker').default;

  const handleNativeChange = (_event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      const iso = selectedDate.toISOString().split('T')[0];
      onChange(iso);
    }
  };

  const displayDate = value 
    ? new Date(value).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : placeholder || 'Datum wählen';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.nativeBtn} onPress={() => setShowPicker(true)}>
        <Text style={[styles.nativeBtnText, !value && { color: '#888' }]}>
          📅 {displayDate}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleNativeChange}
          themeVariant="dark"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  nativeBtn: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nativeBtnText: { color: 'white', fontSize: 14 },
});
