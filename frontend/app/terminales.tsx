import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator, 
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import ApiService from '../services/ApiServices';
import { _Header, _Footer, _Background, hexToRGBA } from '@/components/elidev_components';
import { Background } from '@react-navigation/elements';

interface Terminal {
  id_terminal: string;
  nombre: string;
  descripcion: string;
}

export default function TerminalesScreen() {
  const router = useRouter();
  const { user, theme, t, appConfig } = useApp();
  const pageConfig = {
    name: t("screens.terminales"),
    icon: "desktop-tower-monitor",
    previous: "home",
    show_user: true,
    show_menu: true
  };

  const [terminales, setTerminales] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.init(appConfig);
    loadTerminales();
  }, []);

  const loadTerminales = async () => {
    try {
      const response = await ApiService.get_terminales_list(user.id_usuario, user.id_almacen);
      if (Array.isArray(response.data)) {
        setTerminales(response.data);
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
      style={[styles.terminalItem, { backgroundColor: hexToRGBA(theme.card, 0.7), borderColor: hexToRGBA(theme.border, 0.5) }]}
      onPress={() => handleTerminalPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: hexToRGBA(theme.accent, 0.4) }]}>
        <MaterialCommunityIcons name="desktop-tower-monitor" size={32} color={hexToRGBA(theme.accent, 1)} />
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
      <_Background id_almacen={user?.id_almacen}>
        <_Header page_info={pageConfig} />

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.textSub }]}>{t('terminales.loading')}</Text>
          </View>
        ) : terminales.length === 0 ? (
          <View style={[styles.emptyContainer, {backgroundColor:hexToRGBA(theme.card,0.0)}]}>
            <MaterialCommunityIcons name="desktop-tower-monitor" size={60} color={theme.card} />
            <Text style={[styles.emptyText, { color: theme.card }]}>{t('terminales.noTerminals')}</Text>
          </View>
        ) : (
          <FlatList
            data={terminales}
            renderItem={renderTerminal}
            keyExtractor={(item) => item.id_terminal}
            contentContainerStyle={styles.listContent}
          />
        )}
        <_Footer />
      </_Background>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: Platform.OS === 'ios' ? -15 : -10
  },
  terminalInfo: {
    flex: 1,
    marginLeft: 15,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  terminalName: {
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  terminalDesc: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '800',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
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
});