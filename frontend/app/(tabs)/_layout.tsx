import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export default function TabsLayout() {
  const { theme } = useApp();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: theme.accent, // Color del icono seleccionado
      tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border }
    }}>
      <Tabs.Screen 
        name="home" 
        initialParams={{ tabname:'favorites'}}
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" size={size} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="home" 
        initialParams={{ tabname:'favorites'}}
        options={{
          title: "Almacén",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="warehouse" size={size} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="home" 
        initialParams={{ tabname:'favorites'}}
        options={{
          title: "Cirugías",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="warehouse" size={size} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="home" 
        initialParams={{ tabname:'favorites'}}
        options={{
          title: "Logística",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="warehouse" size={size} color={color} />
          )
        }} 
      />
      <Tabs.Screen 
        name="home" 
        initialParams={{ tabname:'favorites'}}
        options={{
          title: "Calidad",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="check-decagram-outline" size={size} color={color} />
          )
        }} 
      />
    </Tabs>
  );
}