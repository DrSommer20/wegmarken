import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Layout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: { backgroundColor: '#121212' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ title: 'Meine Reisen', headerBackVisible: false }} />
        <Stack.Screen name="settings" options={{ title: 'Einstellungen' }} />
        <Stack.Screen name="trip/[id]" options={{ title: 'Wegmarken' }} />
      </Stack>
    </>
  );
}
