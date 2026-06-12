import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { AllTabs, Tabs_Allowed } from '@/context/AppmenuItems';

export default function TabsLayout() {
  const { theme } = useApp();

  const allTabs = AllTabs;  

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: theme.accent, 
      tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border}
    }}>
      {allTabs.map((tab: any, index: number) => {   
        const esconderTab = tab.id !== "favorites" && (!tab.data || tab.data.length === 0);
        return ( 
          <Tabs.Screen 
            key={tab.id=="favorites"?"home":tab.id || index} 
            name={tab.id=="favorites"?"home":tab.id}
            options={{
              title: tab.title,             
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name={tab.icon} size={size} color={color} />                
              ),
              href: esconderTab ? null : undefined
            }} 
          />
        );
      })}     
    </Tabs>
  );
}