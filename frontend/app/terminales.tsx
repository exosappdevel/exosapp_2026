import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import ApiService from '../services/ApiServices';

interface Terminal {
  id_terminal: string;
  nombre: string;
  descripcion: string;
}

export default function TerminalesScreen() {
  const router = useRouter();
  const { user, theme, t, appConfig } = useApp();
  
  const [terminales, setTerminales] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.init(appConfig);
    loadTerminales();
  }, []);

  const loadTerminales = async () => {
    try {
      const response = await ApiService.get_terminales_list(user.id_usuario, user.id_almacen);
      if (Array.isArray(response)) {
        setTerminales(response);
      }
    } catch (e) {
      console.log('Error loading terminales:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminalPress = (terminal: Terminal) => {
    router.push({
      pathname: '/pickeo',
      params: { 
        id_terminal: terminal.id_terminal, 
        terminal_nombre: terminal.nombre 
      }
    });
  };

  const renderTerminal = ({ item }: { item: Terminal }) => (
    <TouchableOpacity
      style={[styles.terminalItem, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => handleTerminalPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.accent + '20' }]}>
        <MaterialCommunityIcons name="desktop-tower-monitor" size={32} color={theme.accent} />
      </View>
      <View style={styles.terminalInfo}>
        <Text style={[styles.terminalName, { color: theme.text }]}>{item.nombre}</Text>
        <Text style={[styles.terminalDesc, { color: theme.textSub }]}>{item.descripcion}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSub} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('screens.terminales')}</Text>
        <MaterialCommunityIcons name="desktop-tower-monitor"  size={24} color={theme.accent} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSub }]}>{t('terminales.loading')}</Text>
        </View>
      ) : terminales.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="desktop-tower-monitor" size={60} color={theme.textSub} />
          <Text style={[styles.emptyText, { color: theme.textSub }]}>{t('terminales.noTerminals')}</Text>
        </View>
      ) : (
        <FlatList
          data={terminales}
          renderItem={renderTerminal}
          keyExtractor={(item) => item.id_terminal}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <MaterialCommunityIcons name="warehouse" size={24} color={theme.accent} />
        <Text style={[styles.footerText, { color: theme.text }]}>
          {user.almacen_nombre || user.almacen_codigo || 'Sin almacén'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
  },
  listContent: {
    padding: 15,
  },
  terminalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  terminalInfo: {
    flex: 1,
    marginLeft: 15,
  },
  terminalName: {
    fontSize: 16,
    fontWeight: '600',
  },
  terminalDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
});