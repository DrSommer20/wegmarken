import { Platform, Alert } from 'react-native';
import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';

export const writeNfcTag = async (url: string) => {
  if (Platform.OS === 'web') {
    Alert.alert('NFC Info', `Um diesen Trip zu verknüpfen, schreibe diese URL auf einen Magneten:\n\n${url}`);
    return;
  }

  try {
    const isSupported = await NfcManager.isSupported();
    if (!isSupported) {
      Alert.alert('NFC wird nicht unterstützt', 'Dein Gerät unterstützt kein NFC.');
      return;
    }

    await NfcManager.start();
    Alert.alert('NFC', 'Bitte halte dein Handy an den Magneten...');
    
    // Request technology
    await NfcManager.requestTechnology(NfcTech.Ndef);

    // Create NDEF URI message
    const bytes = Ndef.encodeMessage([
      Ndef.uriRecord(url),
    ]);

    if (bytes) {
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      Alert.alert('Erfolg', 'Trip erfolgreich auf den Magneten geschrieben!');
    }
  } catch (ex) {
    console.warn(ex);
    Alert.alert('Fehler', 'Es gab ein Problem beim Schreiben des Tags.');
  } finally {
    // Stop the NFC scanning
    NfcManager.cancelTechnologyRequest();
  }
};
