
import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList
} from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const _PickerModal = ({
  visible, onClose, data, key_name = "id", onSelect, title
}: {
  visible: boolean;
  onClose: () => void;
  data: any[];
  key_name?: string;
  onSelect: (item: any) => void;
  title: string;
}) => {
  const { theme } = useApp();
  const [query, setQuery] = useState('');

  // Limpiar búsqueda al abrir
  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  const getLabel = (item: any): string => {
    if (typeof item === 'string') return item;
    return item.nombre || item.subdistribuidor || item.text || 'Sin nombre2';
  };

  const filtered = data.filter(item =>
    getLabel(item).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.pickerOverlay}>
        <View style={[styles.pickerContainer, { backgroundColor: theme.card }]}>

          {/* Header */}
          <View style={[styles.pickerHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Buscador */}
          <View style={[styles.searchContainer, { borderBottomColor: theme.border, backgroundColor: theme.inputBg }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={theme.textSub} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Buscar..."
              placeholderTextColor={theme.textSub}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoFocus={true}
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color={theme.textSub} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista filtrada */}
          <FlatList
            data={filtered}
            keyExtractor={(item, index) => {
              if (typeof item === 'string') return `str-${index}`;
              const idValue = item[key_name] ?? item.id ?? index;
              return `${key_name}-${idValue}-${index}`;
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerItem, { borderBottomColor: theme.border }]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={[styles.pickerItemText, { color: theme.text }]}>
                  {getLabel(item)}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={[styles.pickerItemText, { color: theme.textSub, textAlign: 'center', padding: 20 }]}>
                Sin resultados
              </Text>
            }
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  pickerContainer: {
    maxHeight: '50%',
    borderRadius: 30,
    marginTop: 40,
    paddingBottom: 20
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
  },
});