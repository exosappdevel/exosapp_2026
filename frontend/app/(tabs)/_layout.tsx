import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // <- oculta la barra nativa
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="terminales" />
      <Tabs.Screen name="pickeo" />
      <Tabs.Screen name="cirugias_programar" />
      <Tabs.Screen name="cirugias_buscar" />
    </Tabs>
  );
}