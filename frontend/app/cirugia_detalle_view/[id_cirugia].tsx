import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import ApiService from '@/services/ApiServices';
import { _Background, hexToRGBA, _CirugiaReportFields, _MaterialSurtidoList, _FotosCarousel, getServerFileUrl } from '../../components/elidev_components';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import * as ScreenOrientation from 'expo-screen-orientation';
import ViewShot, { captureRef } from 'react-native-view-shot';
// react-native-share no tiene implementación web (falla con "getEnforcing" solo
// al importarlo, aunque nunca se llame). Se carga con require() dentro de la
// función que lo usa, para que ni siquiera se evalúe en la build de web.

type VistaDetalle = 'detalle' | 'material' | 'fotos';

export default function Cirugia_Detalle_ViewScreen() {
  const { user, theme, t, appConfig } = useApp();
  const { id_cirugia } = useLocalSearchParams<{ id_cirugia: string }>();
  const titulo = 'Detalle de la cirugia';
  const [vista, setVista] = useState<VistaDetalle>('detalle');

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [error, setError] = useState('');

  // Selección de fotos para compartir (solo aplica en la vista "fotos").
  const [selectedFotos, setSelectedFotos] = useState<Set<number>>(new Set());

  // Captura de pantalla del formCard, usada solo para compartir la vista "detalle" como imagen.
  const reportShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    let isMounted = true;

    const loadReport = async () => {
      if (!id_cirugia) return;
      setLoading(true);
      setError('');
      try {
        const response = await ApiService.get_cirugia_report(id_cirugia);
        if (!isMounted) return;
        if (response?.result === 'ok') {
          setItem(response.data);
        } else {
          setError(response?.result_text || t('common.error'));
        }
      } catch {
        if (isMounted) setError(t('common.error'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadReport();
    return () => { isMounted = false; };
  }, [id_cirugia]);

  // Limpia la selección de fotos al cambiar de vista o de cirugía.
  useEffect(() => {
    setSelectedFotos(new Set());
  }, [vista, id_cirugia]);

  // La app está bloqueada a portrait por default (ver app/_layout.tsx). Aquí se
  // desbloquea la rotación únicamente mientras se está viendo la pestaña de
  // fotos, y se vuelve a bloquear a portrait al salir de esa vista o de la
  // pantalla, para no afectar al resto de la app.
  useEffect(() => {
    if (Platform.OS === 'web') return;

    if (vista === 'fotos') {
      ScreenOrientation.unlockAsync();
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }

    return () => {
      if (vista === 'fotos') {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    };
  }, [vista]);

  // estatus 2 = SURTIDA (ver comentario "Status: 0-cancelada 1-programada
  // 2-surtida ..." en cirugias_buscar.tsx). No se compara contra estatus_text
  // porque el backend lo devuelve mal escrito.
  const isSurtida = String(item?.estatus) === '2';
  const fotoUrls: string[] = (item?.fotos || []).map((f: any) => getServerFileUrl(appConfig.url, f.foto));

  const toggleFotoSelect = (index: number) => {
    setSelectedFotos(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  // Comparte la vista "detalle" como imagen (captura del formCard completo,
  // incluyendo lo que esté fuera del viewport dentro del ScrollView).
  const shareDetalleImage = async () => {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Error', 'Compartir archivos no está disponible en este dispositivo.');
      return;
    }
    const uri = await captureRef(reportShotRef, { format: 'png', quality: 1.0 });
    await Sharing.shareAsync(uri, { dialogTitle: 'Compartir detalle', mimeType: 'image/png' });
  };

  // Comparte la vista "material" como el PDF de entrega generado por el
  // webservice (evita capturar la lista completa, que puede ser muy larga).
  const shareMaterialPdf = async () => {
    const siteRoot = getServerFileUrl(appConfig.url, '');
    const response = await ApiService.imprimir_pdf_entregar(String(id_cirugia), siteRoot, '0');
    if (response?.result !== 'ok' || !response?.filepath) {
      Alert.alert('Error', response?.result_text || 'No se pudo generar el PDF.');
      return;
    }
    const downloaded = await File.downloadFileAsync(response.filepath, Paths.cache);
    await Sharing.shareAsync(downloaded.uri, { dialogTitle: 'Compartir PDF', mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  };

  // Descarga las fotos seleccionadas y las comparte todas juntas en un solo
  // share sheet (expo-sharing solo soporta un archivo a la vez; react-native-share
  // sí soporta varios vía la opción "urls").
  const shareSelectedFotos = async () => {
    if (selectedFotos.size === 0) {
      Alert.alert('Selecciona fotos', 'Toca el círculo sobre una o varias fotos para seleccionarlas antes de compartir.');
      return;
    }

    const indices = Array.from(selectedFotos).sort((a, b) => a - b);
    const localUris: string[] = [];
    for (const index of indices) {
      const remoteUrl = fotoUrls[index];
      if (!remoteUrl) continue;
      const downloaded = await File.downloadFileAsync(remoteUrl, Paths.cache);
      localUris.push(downloaded.uri);
    }

    if (localUris.length === 0) {
      Alert.alert('Error', 'No se pudieron preparar las fotos seleccionadas.');
      return;
    }

    if (localUris.length === 1) {
      await Sharing.shareAsync(localUris[0], { dialogTitle: 'Compartir foto' });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- import estático rompe el bundle web (ver comentario arriba)
      const RNShare = require('react-native-share').default;
      await RNShare.open({ urls: localUris, title: 'Compartir fotos' });
    }
  };

  const handleShare = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Compartir', 'La función de compartir no está soportada en entorno Web nativo.');
      return;
    }

    try {
      if (vista === 'fotos') {
        await shareSelectedFotos();
      } else if (vista === 'material') {
        await shareMaterialPdf();
      } else {
        await shareDetalleImage();
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      Alert.alert('Error', 'No se pudo compartir.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <_Background id_almacen={user?.id_almacen}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={[styles.btnCerrar, { backgroundColor: theme.accent }]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.titulo, { color: theme.text }]}>{titulo}</Text>
          <View style={{ width: 36 }} />
          <TouchableOpacity
            style={[
              styles.shareButton,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="share-variant" size={22} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={{ color: theme.text }}>{error}</Text>
          </View>
        ) : vista === 'fotos' ? (
          // Fuera del ScrollView vertical: usa flex:1 para aprovechar toda la
          // altura disponible en vez de quedar recortado como cuando vivía
          // dentro del formCard/ScrollView (igual que detalle/material).
          <View style={styles.fotosWrapper}>
            <_FotosCarousel photos={fotoUrls} selected={selectedFotos} onToggleSelect={toggleFotoSelect} />
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.formCard, { backgroundColor: hexToRGBA(theme.card, 1) }]}>
              {vista === 'material' ? (
                <_MaterialSurtidoList groups={item?.material_surtido} />
              ) : (
                <ViewShot ref={reportShotRef} options={{ format: 'png', quality: 1.0 }} style={{ width: '100%' }}>
                  <_CirugiaReportFields item={item} showShare={false} />
                </ViewShot>
              )}
            </View>
          </ScrollView>
        )}

        {!loading && !error && isSurtida && (
          <View style={[styles.vistaTabs, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.vistaTabButton, vista === 'detalle' && { backgroundColor: theme.accent }]}
              onPress={() => setVista('detalle')}
            >
              <MaterialCommunityIcons name="text-box-outline" size={18} color={vista === 'detalle' ? '#fff' : theme.accent} />
              <Text style={[styles.vistaTabText, { color: vista === 'detalle' ? '#fff' : theme.accent }]}>Ver detalle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.vistaTabButton, vista === 'material' && { backgroundColor: theme.accent }]}
              onPress={() => setVista('material')}
            >
              <MaterialCommunityIcons name="package-variant-closed" size={18} color={vista === 'material' ? '#fff' : theme.accent} />
              <Text style={[styles.vistaTabText, { color: vista === 'material' ? '#fff' : theme.accent }]}>Material surtido</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.vistaTabButton, vista === 'fotos' && { backgroundColor: theme.accent }]}
              onPress={() => setVista('fotos')}
            >
              <MaterialCommunityIcons name="image-multiple-outline" size={18} color={vista === 'fotos' ? '#fff' : theme.accent} />
              <Text style={[styles.vistaTabText, { color: vista === 'fotos' ? '#fff' : theme.accent }]}>Ver fotos</Text>
            </TouchableOpacity>
          </View>
        )}
      </_Background>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 3,
  },
  fotosWrapper: {
    flex: 1,
    padding: 3,
  },
  formCard: {
    borderRadius: 0,
    padding: 0,
    borderWidth: 0,
    marginBottom: 40,
  },
  centered: {
    flex: 1,
    paddingVertical: 60,
    alignItems: 'center',
  },
  vistaTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  vistaTabButton: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 14,
    marginHorizontal: 3,
  },
  vistaTabText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: hexToRGBA('#FFFFFF', 1),
  },
  btnCerrar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    textAlign: "center",
  },
  shareButton: {
    position: 'absolute',
    top: 15,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
