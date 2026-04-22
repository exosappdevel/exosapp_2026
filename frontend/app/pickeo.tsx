import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useApp } from "../context/AppContext";
import ApiService from "../services/ApiServices";
import { calcularPrioridad } from "../utils/PickeoUtils";
import { _Background, _Footer, _Footer_custom, hexToRGBA } from "@/components/elidev_components";

interface Producto {
  id: string;
  descripcion: string;
  referencia: string;
  marca: string;
  fabricante: string;
  cantidad_solicitada: number;
  cantidad_recolectada: number;
  prioridad: number;
  color: string;
  faltante: number;
}

export default function PickeoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, theme, t, appConfig } = useApp();
  const inputRef = useRef<TextInput>(null);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mostrarCompletos, setMostrarCompletos] = useState(true);
  const [sortBy, setSortBy] = useState<"prioridad" | "referencia">("prioridad");
  const [modalCant, setModalCant] = useState({
    visible: false,
    item: null as Producto | null,
    cantidad: "1",
    esResta: false,
  });

  const id_terminal = params.id_terminal as string;
  const terminal_nombre = params.terminal_nombre as string;
  const STORAGE_KEY = `@pickeo_storage_term_${id_terminal}`;

  useEffect(() => {
    ApiService.init(appConfig);
    inicializarDatos(true);
  }, [id_terminal]);

  useEffect(() => {
    if (modalCant.visible) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (Platform.OS === 'web') {
            (inputRef.current as any).setSelectionRange?.(0, modalCant.cantidad.length);
          }
        }
      }, 150);
    }
  }, [modalCant.visible]);

  const inicializarDatos = async (sync_server: boolean) => {
    try {
      setLoading(true);
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      let listaLocal: Producto[] = savedData ? JSON.parse(savedData) : [];

      let listaWS: any[] = [];
      if (sync_server) {
        const response = await ApiService.get_pickeo_list(user.id_usuario, id_terminal);
        if (Array.isArray(response.data)) {
          listaWS = response.data;
        } else if (response && typeof response === "object" && !response.result) {
          listaWS = [response];
        }
      }

      const listaFinal = listaWS.map((pWS: any) => {
        const id = pWS.id || pWS.id_producto || `p-${Math.random()}`;
        const localMatch = listaLocal.find((l) => (l.id || (l as any).id_producto) === id);

        const recolectada = localMatch
          ? localMatch.cantidad_recolectada
          : parseInt(pWS.cantidad_recolectada || 0);
        const solicitada = parseInt(pWS.cantidad_solicitada || 0);

        return {
          ...pWS,
          id,
          cantidad_recolectada: recolectada,
          cantidad_solicitada: solicitada,
          ...calcularPrioridad(solicitada, recolectada),
        };
      });

      setProductos(listaFinal);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listaFinal));
    } catch (e) {
      console.error("Error inicializando lista:", e);
      const errorMsg = t('common.loadError');
      Platform.OS === "web" ? alert(errorMsg) : Alert.alert(t('common.error'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const aplicarPick = async (item: Producto | null, cantStr: string, esResta: boolean) => {
    if (!item) return;
    const valor = parseInt(cantStr) || 0;
    const nuevaLista = productos.map((p) => {
      if (p.id === item.id) {
        const nuevaReco = esResta
          ? Math.max(0, p.cantidad_recolectada - valor)
          : p.cantidad_recolectada + valor;
        return {
          ...p,
          cantidad_recolectada: nuevaReco,
          ...calcularPrioridad(p.cantidad_solicitada, nuevaReco),
        };
      }
      return p;
    });
    setProductos(nuevaLista);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaLista));
    setModalCant({ visible: false, item: null, cantidad: "1", esResta: false });
  };

  const handleCheckOut = async () => {
    const confirmarEnvio = async () => {
      try {
        setIsSubmitting(true);
        const response = await ApiService.pickeo_checkout(user.id_usuario, id_terminal, productos);
        setIsSubmitting(false);

        const mensaje = response?.result_text || "Error desconocido";
        const esExito = response?.result === "ok";

        if (Platform.OS === "web") {
          alert(esExito ? `${t('common.success')}: ${mensaje}` : `${t('common.notice')}: ${mensaje}`);
          if (esExito) {
            await AsyncStorage.removeItem(STORAGE_KEY);
            inicializarDatos(false);
          }
        } else {
          Alert.alert(esExito ? t('common.success') : t('common.notice'), mensaje, [
            { text: "OK", onPress: () => esExito && inicializarDatos(false) },
          ]);
        }
      } catch (e) {
        setIsSubmitting(false);
        const errorMsg = t('common.connectionError');
        Platform.OS === "web" ? alert(errorMsg) : Alert.alert(t('common.error'), errorMsg);
      }
    };

    if (Platform.OS === "web") {
      if (confirm(t('pickeo.checkoutConfirm'))) confirmarEnvio();
    } else {
      Alert.alert("Check Out", t('pickeo.checkoutConfirm'), [
        { text: "No" },
        { text: "Sí", onPress: confirmarEnvio },
      ]);
    }
  };

  const listaRender = productos
    .filter((p) => mostrarCompletos || p.faltante > 0)
    .sort((a, b) => {
      if (sortBy === "prioridad") return a.prioridad - b.prioridad;
      return (a.referencia || "").localeCompare(b.referencia || "");
    });

  return (
    <SafeAreaView style={[styles.container]}>
      <_Background id_almacen={user?.id_almacen}>
        
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: hexToRGBA(theme.card, 0.5) }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {user.almacen_codigo} - {terminal_nombre}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => inicializarDatos(true)} style={styles.headerBtn}>
              <MaterialCommunityIcons name="refresh" size={24} color={theme.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSortBy(sortBy === "prioridad" ? "referencia" : "prioridad")}
            >
              <MaterialCommunityIcons
                name={sortBy === "prioridad" ? "sort-numeric-ascending" : "sort-alphabetical-ascending"}
                size={24}
                color={theme.accent}
              />
            </TouchableOpacity>
          </View>
          
        </View>
        

        {loading ? (
          <ActivityIndicator size="large" color={theme.accent} style={{ flex: 1 }} />
        ) : (
          <FlatList
            data={listaRender}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.itemRow,
                  { backgroundColor: hexToRGBA(theme.card, 0.85), borderColor: theme.border },
                ]}
              >
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    onPress={() => aplicarPick(item, "1", false)}
                    style={styles.btnQuick}
                  >
                    <MaterialCommunityIcons name="flash" size={24} color={item.color} />
                  </TouchableOpacity>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.textMain, { color: theme.text }]} numberOfLines={2}>
                    {item.descripcion}
                  </Text>
                  <Text style={styles.textSub}>{item.referencia}</Text>
                  <Text style={[styles.textStatus, { color: item.color }]}>
                    {item.cantidad_recolectada} / {item.cantidad_solicitada}
                  </Text>
                </View>
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[styles.btnAction, { backgroundColor: item.color }]}
                    onPress={() => setModalCant({ visible: true, item, cantidad: "1", esResta: false })}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnAction, { backgroundColor: item.color, marginLeft: 8 }]}
                    onPress={() => setModalCant({ visible: true, item, cantidad: "1", esResta: true })}
                  >
                    <MaterialCommunityIcons name="minus" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        
        

        <Modal
          visible={modalCant.visible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalCant({ ...modalCant, visible: false })}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {t('pickeo.adjustQuantity')}
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: theme.bg,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                ref={inputRef}
                keyboardType="numeric"
                value={modalCant.cantidad}
                onChangeText={(t) => setModalCant({ ...modalCant, cantidad: t })}
                selectTextOnFocus={true}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setModalCant({ ...modalCant, visible: false })}>
                  <Text style={{ color: theme.textSub, marginRight: 25 }}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btnConfirm,
                    { backgroundColor: modalCant.item?.color || theme.accent },
                  ]}
                  onPress={() => aplicarPick(modalCant.item, modalCant.cantidad, modalCant.esResta)}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    {t('common.accept')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <_Footer Show_Almacen={false}>
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: "#4a5568" }]}
            onPress={() => setMostrarCompletos(!mostrarCompletos)}
          >
            <Text style={styles.footerBtnText}>
              {mostrarCompletos ? t('pickeo.hideComplete') : t('pickeo.showAll')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: "#48bb78" }]}
            onPress={handleCheckOut}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.checkoutContent}>
                <MaterialCommunityIcons name="cart-variant" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.footerBtnText}>{t('pickeo.checkout')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </_Footer>
        

      </_Background>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,
    marginBottom: Platform.OS === 'ios' ? -15 : -10
   },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    marginRight: 15,
  },
  listContent: {
    padding: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  itemInfo: { flex: 1 },
  textMain: {
    fontWeight: "bold", fontSize: 14, textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  textSub: {
    fontSize: 12, color: "#888", marginTop: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  textStatus: {
    fontSize: 13, fontWeight: "bold", marginTop: 4, textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionsContainer: { flexDirection: "row", alignItems: "center" },
  btnAction: { padding: 8, borderRadius: 8 },
  btnQuick: { padding: 8, marginRight: 5 },
  footer: {
    flexDirection: "row",
    padding: 5,
    borderTopWidth: 0,
  },
  footerBtn: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: "center",
    width:160
  },
  footerBtnText: {
    color: "white", fontWeight: "bold", fontSize: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  checkoutContent: {
    flexDirection: "row",
    alignItems: "center"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { width: "85%", padding: 25, borderRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  modalInput: {
    padding: 15,
    borderRadius: 10,
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  btnConfirm: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },

});