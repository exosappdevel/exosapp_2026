import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal, Linking, useWindowDimensions,
    Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import ApiService from '../../services/ApiServices';
// Se importa de cada archivo (no del barrel "."): este componente también se
// re-exporta desde index.ts y importar de ahí cerraría un ciclo de requires.
import { _Header } from './_Header';
import { _Background } from './_Background';
import { _Footer, _footer_baseHeight } from './_Footer';
import { _Show_Report_Pager, _FotosCarousel, _DetalleLinea, _DetalleMultiLinea } from './_Report';
import { getServerFileUrl, hexToRGBA } from './_Functions';

// Pantalla compartida de "Paquetería por enviar" (modo 'enviar') y "Paquetería
// por recibir" (modo 'recibir'). Lista las paqueterías; al tocar una se abre el
// detalle a pantalla completa (productos + información de tránsito + fotos) y
// ahí se puede deslizar / usar las flechas para pasar a la anterior/siguiente
// de la lista.

type Modo = 'enviar' | 'recibir';

interface DetalleState {
    loading: boolean;
    error?: string;
    productos: any[];
    transito: { guia: string; comentarios: string; precio: string; fotos: string[] } | null;
}

// El parser XML devuelve [] / "" / objeto según haya 0, 1 o varios hijos.
const toArray = (v: any): any[] => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') return Object.values(v);
    return [];
};

// "2026-10-08 14:51:10" -> "08/10/2026 14:51"
const formatKardex = (k: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(k || '');
    return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : (k || '---');
};

const formatPrecio = (p: any) => {
    const n = parseFloat(p);
    return isFinite(n) ? `$ ${n.toFixed(2)}` : '---';
};

export const _PaqueteriaScreen = ({ modo }: { modo: Modo }) => {
    const { user, theme, t, appConfig } = useApp();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const esEnviar = modo === 'enviar';

    const pageConfig = {
        name: t(esEnviar ? 'screens.paqueteria_por_enviar' : 'screens.paqueteria_por_recibir'),
        icon: esEnviar ? 'truck-delivery' : 'package-variant-closed',
        previous: 'home',
        show_user: true,
        show_menu: true,
        show_in_recent: true,
        path: esEnviar ? '/paqueteria_por_enviar' : '/paqueteria_por_recibir',
    };

    const margin_height = 50;
    const _ClientHeight = height - 130 - margin_height;
    // _Footer flota (position:absolute) sobre el ScrollView: espacio extra al
    // final para poder desplazar los últimos elementos por encima del footer.
    const FOOTER_EXTRA = 56; // alto extra del footer: botón + filtro en dos filas
    const footerClearance = _footer_baseHeight(false, FOOTER_EXTRA) + insets.bottom + 20;
    const carouselWidth = Math.round(width * 0.95);
    const carouselHeight = Math.round(height * 0.8);

    const [lista, setLista] = useState<any[]>([]);
    // Filtro de texto en vivo (footer) sobre la lista ya cargada.
    const [filtroTexto, setFiltroTexto] = useState('');
    // Minúsculas y sin acentos, para que "Torreon" encuentre "TORREÓN".
    const normalizar = (v: any) =>
        String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const textoFiltro = normalizar(filtroTexto.trim());
    const listaFiltrada: any[] = textoFiltro === ''
        ? lista
        : lista.filter((it: any) =>
            [it.codigo, it.origen, it.destino, it.username, it.guia, it.comentarios, it.kardex, formatKardex(it.kardex)]
                .some((campo) => normalizar(campo).includes(textoFiltro))
        );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Detalle a pantalla completa: índice del elemento abierto (null = cerrado).
    const [detalleIndex, setDetalleIndex] = useState<number | null>(null);
    const [detalles, setDetalles] = useState<Record<string, DetalleState>>({});
    const detallesRef = useRef<Record<string, DetalleState>>({});
    const enVuelo = useRef<Set<string>>(new Set());

    const [showCarousel, setShowCarousel] = useState(false);
    const [fotosCarousel, setFotosCarousel] = useState<string[]>([]);

    // Formulario "Confirmar envío" (solo modo 'enviar', paquetería sin tránsito).
    const [envioItem, setEnvioItem] = useState<any | null>(null);
    const [envioGuia, setEnvioGuia] = useState('');
    const [envioPrecio, setEnvioPrecio] = useState('0');
    const [envioComentarios, setEnvioComentarios] = useState('');
    const [envioFotos, setEnvioFotos] = useState<{ uri: string; name: string; type: string }[]>([]);
    const [envioError, setEnvioError] = useState('');
    const [envioPreguntando, setEnvioPreguntando] = useState(false);
    const [envioEnviando, setEnvioEnviando] = useState(false);

    const setDetalle = (id: string, valor: DetalleState) => {
        detallesRef.current = { ...detallesRef.current, [id]: valor };
        setDetalles(detallesRef.current);
    };

    const cargarLista = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = esEnviar
                ? await ApiService.paqueteria_por_enviar(user?.id_usuario || '', user?.id_almacen || '')
                : await ApiService.paqueteria_por_recibir(user?.id_usuario || '', user?.id_almacen || '');
            if (res?.result === 'ok') {
                setLista(toArray(res.data));
                // La lista cambió: los detalles en caché ya pueden estar desactualizados.
                detallesRef.current = {};
                setDetalles({});
            } else {
                setLista([]);
                setError(res?.result_text || t('paqueteria.load_error'));
            }
        } catch {
            setLista([]);
            setError(t('paqueteria.load_error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        ApiService.init(appConfig);
        cargarLista();
    }, []);

    // Productos (paqueteria_detalle) + tránsito y fotos (paqueteria_transito_detalle)
    // de una paquetería. Se piden solo cuando se abre su detalle (y el de las
    // vecinas, para que el swipe sea inmediato) y se guardan en caché.
    const cargarDetalle = async (item: any, forzar = false) => {
        const id = String(item.id_paqueteria);
        if (enVuelo.current.has(id)) return;
        const previo = detallesRef.current[id];
        if (!forzar && previo && !previo.error) return;

        enVuelo.current.add(id);
        setDetalle(id, { loading: true, productos: [], transito: null });
        try {
            // En "por enviar", existe_transito = 0 significa que aún no hay datos de tránsito.
            const sinTransito = esEnviar && Number(item.existe_transito) === 0;
            const [det, tr] = await Promise.all([
                ApiService.paqueteria_detalle(id),
                sinTransito ? Promise.resolve(null) : ApiService.paqueteria_transito_detalle(id),
            ]);
            if (det?.result !== 'ok') {
                setDetalle(id, { loading: false, error: det?.result_text || t('paqueteria.load_error'), productos: [], transito: null });
                return;
            }
            setDetalle(id, {
                loading: false,
                productos: toArray(det.data),
                transito: tr && tr.result === 'ok'
                    ? {
                        guia: tr.guia || '',
                        comentarios: tr.comentarios || '',
                        precio: tr.precio || '',
                        fotos: toArray(tr.fotos),
                    }
                    : null,
            });
        } catch {
            setDetalle(id, { loading: false, error: t('paqueteria.load_error'), productos: [], transito: null });
        } finally {
            enVuelo.current.delete(id);
        }
    };

    useEffect(() => {
        if (detalleIndex === null) return;
        [detalleIndex, detalleIndex + 1, detalleIndex - 1].forEach((i) => {
            if (listaFiltrada[i]) cargarDetalle(listaFiltrada[i]);
        });
    }, [detalleIndex, lista, filtroTexto]);

    const abrirCarrusel = (fotos: string[]) => {
        setFotosCarousel(fotos.map((f) => getServerFileUrl(appConfig.url, f)));
        setShowCarousel(true);
    };

    // ---------- Confirmar envío ----------

    const abrirFormEnvio = (item: any) => {
        setEnvioGuia('');
        setEnvioPrecio('0');
        setEnvioComentarios('');
        setEnvioFotos([]);
        setEnvioError('');
        setEnvioPreguntando(false);
        setEnvioItem(item);
    };

    // "Descartar envío": cierra el formulario sin guardar nada.
    const descartarEnvio = () => {
        if (envioEnviando) return;
        setEnvioItem(null);
        setEnvioPreguntando(false);
    };

    const agregarFotoEnvio = async (origen: 'camara' | 'galeria') => {
        try {
            setEnvioError('');
            let result;
            if (origen === 'camara') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') { setEnvioError(t('paqueteria.camara_denegada')); return; }
                result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') { setEnvioError(t('paqueteria.galeria_denegada')); return; }
                result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
            }
            if (result.canceled) return;
            const asset = result.assets[0];
            setEnvioFotos((prev) => [...prev, {
                uri: asset.uri,
                name: asset.fileName || asset.uri.split('/').pop() || 'foto.jpg',
                type: asset.mimeType || 'image/jpeg',
            }]);
        } catch {
            setEnvioError(t('common.connectionError'));
        }
    };

    // Valida y pregunta antes de confirmar (el envío ya no se puede modificar).
    const pedirConfirmacionEnvio = () => {
        const precio = parseFloat(envioPrecio.replace(',', '.'));
        if (envioGuia.trim() === '') { setEnvioError(t('paqueteria.form_guia_requerida')); return; }
        if (!isFinite(precio)) { setEnvioError(t('paqueteria.form_precio_invalido')); return; }
        setEnvioError('');
        setEnvioPreguntando(true);
    };

    const confirmarEnvio = async () => {
        if (!envioItem || envioEnviando) return;
        const item = envioItem;
        const id = String(item.id_paqueteria);
        const precio = parseFloat(envioPrecio.replace(',', '.'));
        setEnvioEnviando(true);
        setEnvioPreguntando(false);
        setEnvioError('');
        try {
            const res = await ApiService.paqueteria_confirmar_envio(
                user?.id_usuario || '', id, envioGuia.trim(), String(precio), envioComentarios.trim()
            );
            if (res?.result !== 'ok') {
                setEnvioError(res?.result_text || t('paqueteria.confirm_envio_error'));
                return;
            }
            // Desde aquí el envío ya quedó registrado: las fotos que fallen se reportan aparte.
            let fallidas = 0;
            for (const foto of envioFotos) {
                try {
                    const url = await ApiService.uploadFileDirect('paqueteria', 'paq', foto);
                    const r = url ? await ApiService.paqueteria_foto_envio_add(user?.id_usuario || '', id, url) : null;
                    if (r?.result !== 'ok') fallidas++;
                } catch {
                    fallidas++;
                }
            }
            const actualizado = { ...item, existe_transito: 1 };
            setLista((prev) => prev.map((it) => String(it.id_paqueteria) === id ? actualizado : it));
            setEnvioItem(null);
            cargarDetalle(actualizado, true);
            if (fallidas > 0) {
                setErrorEnvioParcial(t('paqueteria.fotos_parcial').replace('{n}', String(fallidas)));
            }
        } catch {
            setEnvioError(t('common.connectionError'));
        } finally {
            setEnvioEnviando(false);
        }
    };

    // Aviso (fuera del formulario, ya cerrado) cuando el envío se confirmó pero alguna foto no subió.
    const [errorEnvioParcial, setErrorEnvioParcial] = useState('');

    const nombreArchivo = (ruta: string) => (ruta || '').split('/').pop() || ruta;

    // ---------- Detalle ----------

    const camposDetalle = (item: any) => {
        const campos: any[] = [
            { label: t('paqueteria.f_codigo'), value: item.codigo, tipo_linea: 'multi_linea' },
            { label: t('paqueteria.f_origen'), value: item.origen, tipo_linea: 'multi_linea' },
            { label: t('paqueteria.f_destino'), value: item.destino, tipo_linea: 'multi_linea' },
            { label: t('paqueteria.f_total'), value: String(item.total ?? ''), tipo_linea: 'linea' },
            { label: t('paqueteria.f_registro'), value: formatKardex(item.kardex), tipo_linea: 'linea' },
            { label: t('paqueteria.f_usuario'), value: item.username, tipo_linea: 'linea' },
        ];
        if (!esEnviar) {
            campos.push({ label: t('paqueteria.chip_faltante'), value: Number(item.existe_faltante) > 0 ? 'Sí' : 'No', tipo_linea: 'linea' });
        }
        return campos;
    };

    const tituloSeccion = (texto: string) => (
        <Text style={[styles.seccionTitulo, { color: theme.text, borderBottomColor: theme.border }]}>{texto}</Text>
    );

    const renderFilaArchivo = (key: string, icono: string, texto: string, onPress: () => void) => (
        <TouchableOpacity key={key} style={styles.archivoFila} onPress={onPress}>
            <MaterialCommunityIcons name={icono as any} size={20} color={theme.accent} />
            <Text style={{ color: theme.text, flex: 1 }} numberOfLines={1}>{texto}</Text>
        </TouchableOpacity>
    );

    const renderDetalle = (item: any) => {
        const id = String(item.id_paqueteria);
        const d = detalles[id];
        const cargando = !d || d.loading;
        const pdfs = toArray(item.pdfs);

        return (
            <View style={{ marginTop: 10 }}>
                {/* Tránsito + fotos */}
                {tituloSeccion(t('paqueteria.transito_title'))}
                {cargando ? (
                    <ActivityIndicator color={theme.accent} style={{ marginVertical: 12 }} />
                ) : d.error ? (
                    <View style={{ alignItems: 'center', marginVertical: 8 }}>
                        <Text style={{ color: '#e53e3e', textAlign: 'center' }}>{d.error}</Text>
                        <TouchableOpacity style={[styles.btnReintentar, { backgroundColor: theme.accent }]} onPress={() => cargarDetalle(item, true)}>
                            <Text style={styles.btnReintentarTexto}>{t('paqueteria.retry')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : d.transito ? (
                    <View>
                        <_DetalleLinea label={t('paqueteria.f_guia')} value={d.transito.guia} />
                        <_DetalleLinea label={t('paqueteria.f_precio')} value={formatPrecio(d.transito.precio)} />
                        <_DetalleMultiLinea label={t('paqueteria.f_comentarios')} value={d.transito.comentarios} />
                        <Text style={[styles.subTitulo, { color: theme.textSub }]}>{t('paqueteria.fotos_title')}:</Text>
                        {d.transito.fotos.length === 0 ? (
                            <Text style={{ color: theme.textSub, fontSize: 13 }}>{t('paqueteria.sin_fotos')}</Text>
                        ) : (
                            // Tocar el icono o el nombre de cualquier foto abre el carrusel.
                            d.transito.fotos.map((f: string, i: number) =>
                                renderFilaArchivo('foto_' + i, 'image', nombreArchivo(f), () => abrirCarrusel(d.transito!.fotos))
                            )
                        )}
                    </View>
                ) : esEnviar && Number(item.existe_transito) === 0 ? (
                    // Sin datos de tránsito: el envío está pendiente de confirmar.
                    <View style={{ alignItems: 'center', marginVertical: 6 }}>
                        <Text style={{ color: theme.textSub, fontSize: 13, textAlign: 'center' }}>{t('paqueteria.pendiente_confirmar')}</Text>
                        <TouchableOpacity style={[styles.btnConfirmar, { backgroundColor: '#38a169' }]} onPress={() => abrirFormEnvio(item)}>
                            <MaterialCommunityIcons name="truck-fast" size={20} color="#fff" />
                            <Text style={styles.btnConfirmarTexto}>{t('paqueteria.confirmar_envio')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={{ color: theme.textSub, fontSize: 13 }}>{t('paqueteria.sin_transito')}</Text>
                )}

                {/* PDFs del traspaso (solo vienen en "por recibir") */}
                {pdfs.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                        {tituloSeccion(t('paqueteria.pdfs_title'))}
                        {pdfs.map((p: string, i: number) =>
                            renderFilaArchivo('pdf_' + i, 'file-pdf-box', nombreArchivo(p),
                                () => Linking.openURL(encodeURI(getServerFileUrl(appConfig.url, p))))
                        )}
                    </View>
                )}

                {/* Productos */}
                <View style={{ marginTop: 12 }}>
                    {tituloSeccion(`${t('paqueteria.productos_title')}${d && !d.loading && !d.error ? ` (${d.productos.length})` : ''}`)}
                    {cargando ? (
                        <ActivityIndicator color={theme.accent} style={{ marginVertical: 12 }} />
                    ) : d.error ? null : d.productos.length === 0 ? (
                        <Text style={{ color: theme.textSub, fontSize: 13 }}>{t('paqueteria.sin_productos')}</Text>
                    ) : (
                        d.productos.map((p: any, i: number) => (
                            <View key={'prod_' + i} style={[styles.productoCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                <View style={[styles.cantidadBadge, { backgroundColor: theme.accent }]}>
                                    <Text style={styles.cantidadTexto}>{p.cantidad}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 13 }}>{p.nombre}</Text>
                                    <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 2 }}>
                                        {t('paqueteria.f_referencia')} {p.referencia}  ·  {t('paqueteria.f_lote')} {p.lote || '---'}
                                    </Text>
                                    <Text style={{ color: theme.textSub, fontSize: 12 }}>
                                        {t('paqueteria.f_carpeta')} {p.codecarpeta}  ·  {t('paqueteria.f_caducidad')} {p.fecha_cad || '---'}
                                    </Text>
                                    {!!p.codigo && <Text style={{ color: theme.textSub, fontSize: 11 }}>{p.codigo}</Text>}
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </View>
        );
    };

    // Carrusel de fotos: se pasa como "overlay" del detalle para que quede anidado
    // en su Modal (en iOS un <Modal> hermano no se presenta mientras el otro está abierto).
    const renderCarrusel = () => !showCarousel ? null : (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowCarousel(false)}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.carouselOverlay}>
                    <View style={[styles.carouselContainer, { backgroundColor: theme.card, width: carouselWidth, height: carouselHeight }]}>
                        <View style={[styles.carouselHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.carouselTitle, { color: theme.text }]}>{t('paqueteria.fotos_title')}</Text>
                            <TouchableOpacity onPress={() => setShowCarousel(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ width: carouselWidth, height: carouselHeight - 49 }}>
                            <_FotosCarousel
                                photos={fotosCarousel}
                                allowSelect={false}
                                width={carouselWidth}
                                height={carouselHeight - 49}
                            />
                        </View>
                    </View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );

    // Formulario de confirmación de envío: también va como "overlay" del detalle
    // (Modal anidado). La pregunta de confirmación es un panel dentro del mismo
    // Modal porque Alert.alert no funciona en web.
    const renderFormEnvio = () => !envioItem ? null : (
        <Modal visible transparent animationType="fade" onRequestClose={descartarEnvio}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.carouselOverlay}>
                    <View style={[styles.formContainer, { backgroundColor: theme.card, borderColor: theme.border, width: Math.min(width * 0.95, 520), maxHeight: height * 0.9 }]}>
                        <View style={[styles.carouselHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.carouselTitle, { color: theme.text }]} numberOfLines={1}>
                                {t('paqueteria.form_envio_title')} · {envioItem.codigo}
                            </Text>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 12 }} keyboardShouldPersistTaps="handled">
                            <Text style={[styles.formLabel, { color: theme.textSub }]}>{t('paqueteria.form_guia')}</Text>
                            <TextInput
                                style={[styles.formInput, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
                                value={envioGuia}
                                onChangeText={setEnvioGuia}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                editable={!envioEnviando}
                            />
                            <Text style={[styles.formLabel, { color: theme.textSub }]}>{t('paqueteria.form_precio')}</Text>
                            <TextInput
                                style={[styles.formInput, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border }]}
                                value={envioPrecio}
                                onChangeText={setEnvioPrecio}
                                keyboardType="decimal-pad"
                                placeholder="0.00"
                                placeholderTextColor={theme.textSub}
                                editable={!envioEnviando}
                            />
                            <Text style={[styles.formLabel, { color: theme.textSub }]}>{t('paqueteria.form_comentarios')}</Text>
                            <TextInput
                                style={[styles.formInput, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border, height: 80, textAlignVertical: 'top', paddingTop: 8 }]}
                                value={envioComentarios}
                                onChangeText={setEnvioComentarios}
                                multiline
                                editable={!envioEnviando}
                            />

                            <Text style={[styles.formLabel, { color: theme.textSub }]}>{t('paqueteria.form_fotos')} ({envioFotos.length})</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity style={[styles.btnFoto, { borderColor: theme.accent }]} onPress={() => agregarFotoEnvio('camara')} disabled={envioEnviando}>
                                    <MaterialCommunityIcons name="camera" size={18} color={theme.accent} />
                                    <Text style={{ color: theme.accent, marginLeft: 6 }}>{t('paqueteria.form_camara')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.btnFoto, { borderColor: theme.accent }]} onPress={() => agregarFotoEnvio('galeria')} disabled={envioEnviando}>
                                    <MaterialCommunityIcons name="image-multiple" size={18} color={theme.accent} />
                                    <Text style={{ color: theme.accent, marginLeft: 6 }}>{t('paqueteria.form_galeria')}</Text>
                                </TouchableOpacity>
                            </View>
                            {envioFotos.length === 0 ? (
                                <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 8 }}>{t('paqueteria.form_sin_fotos')}</Text>
                            ) : (
                                <View style={styles.fotosGrid}>
                                    {envioFotos.map((f, i) => (
                                        <View key={f.uri + i} style={styles.fotoThumbWrap}>
                                            <Image source={{ uri: f.uri }} style={styles.fotoThumb} />
                                            {!envioEnviando && (
                                                <TouchableOpacity
                                                    style={styles.fotoQuitar}
                                                    onPress={() => setEnvioFotos((prev) => prev.filter((_, j) => j !== i))}
                                                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                                >
                                                    <MaterialCommunityIcons name="close" size={14} color="#fff" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                            {!!envioError && <Text style={{ color: '#e53e3e', marginTop: 10 }}>{envioError}</Text>}
                        </ScrollView>

                        <View style={[styles.formBotones, { borderTopColor: theme.border }]}>
                            <TouchableOpacity style={[styles.formBtn, { backgroundColor: '#718096' }]} onPress={descartarEnvio} disabled={envioEnviando}>
                                <Text style={styles.btnConfirmarTexto}>{t('paqueteria.descartar_envio')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.formBtn, { backgroundColor: '#38a169' }]} onPress={pedirConfirmacionEnvio} disabled={envioEnviando}>
                                {envioEnviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnConfirmarTexto}>{t('paqueteria.confirmar_envio')}</Text>}
                            </TouchableOpacity>
                        </View>

                        {envioPreguntando && (
                            <View style={styles.preguntaOverlay}>
                                <View style={[styles.preguntaBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                    <Text style={{ color: theme.text, textAlign: 'center', fontSize: 15 }}>{t('paqueteria.confirm_envio_msg')}</Text>
                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                                        <TouchableOpacity style={[styles.formBtn, { backgroundColor: '#718096' }]} onPress={() => setEnvioPreguntando(false)}>
                                            <Text style={styles.btnConfirmarTexto}>{t('common.no')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.formBtn, { backgroundColor: '#38a169' }]} onPress={confirmarEnvio}>
                                            <Text style={styles.btnConfirmarTexto}>{t('common.yes')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    // Aviso de fotos que no subieron (el envío ya se había confirmado).
    const renderAvisoParcial = () => !errorEnvioParcial ? null : (
        <Modal visible transparent animationType="fade" onRequestClose={() => setErrorEnvioParcial('')}>
            <View style={styles.carouselOverlay}>
                <View style={[styles.preguntaBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={{ color: theme.text, textAlign: 'center', fontSize: 15 }}>{errorEnvioParcial}</Text>
                    <TouchableOpacity style={[styles.formBtn, { backgroundColor: theme.accent, marginTop: 16, alignSelf: 'stretch' }]} onPress={() => setErrorEnvioParcial('')}>
                        <Text style={styles.btnConfirmarTexto}>{t('common.accept')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const cerrarDetalle = () => {
        setShowCarousel(false);
        setDetalleIndex(null);
    };

    // ---------- Lista ----------

    const chip = (key: string, icono: string, texto: string, color: string) => (
        <View key={key} style={[styles.chip, { borderColor: color }]}>
            <MaterialCommunityIcons name={icono as any} size={12} color={color} />
            <Text style={{ color, fontSize: 11, marginLeft: 3 }}>{texto}</Text>
        </View>
    );

    const renderLista = () => {
        if (loading) return <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 30 }} />;
        if (error) {
            return (
                <View style={{ alignItems: 'center', marginTop: 30 }}>
                    <Text style={{ color: '#e53e3e', textAlign: 'center' }}>{error}</Text>
                    <TouchableOpacity style={[styles.btnReintentar, { backgroundColor: theme.accent }]} onPress={cargarLista}>
                        <Text style={styles.btnReintentarTexto}>{t('paqueteria.retry')}</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        if (lista.length === 0) {
            return (
                <Text style={{ color: theme.textSub, textAlign: 'center', marginTop: 30, fontSize: 14 }}>
                    {t(esEnviar ? 'paqueteria.empty_enviar' : 'paqueteria.empty_recibir')}
                </Text>
            );
        }
        if (listaFiltrada.length === 0) {
            return (
                <Text style={{ color: theme.textSub, textAlign: 'center', marginTop: 30, fontSize: 14 }}>
                    {t('paqueteria.filter_no_matches')}
                </Text>
            );
        }
        return listaFiltrada.map((item: any, index: number) => {
            // Cuarta línea: total de productos + chips de estado.
            const chips: React.ReactNode[] = [];
            if (esEnviar) {
                if (Number(item.existe_transito) > 0) chips.push(chip('t', 'truck-fast', t('paqueteria.chip_transito'), '#38a169'));
            } else {
                if (Number(item.existe_faltante) > 0) chips.push(chip('f', 'alert-circle-outline', t('paqueteria.chip_faltante'), '#e53e3e'));
                const nPdfs = toArray(item.pdfs).length;
                if (nPdfs > 0) chips.push(chip('p', 'file-pdf-box', String(nPdfs), theme.accent));
            }
            return (
                <TouchableOpacity
                    key={item.id_paqueteria ?? index}
                    style={[styles.card, { backgroundColor: hexToRGBA(theme.card, 1), borderColor: theme.border }]}
                    onPress={() => setDetalleIndex(index)}
                >
                    {/* 1: código */}
                    <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }} numberOfLines={1}>{item.codigo}</Text>
                    {/* 2: origen -> destino */}
                    <Text style={{ color: theme.accent, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                        {item.origen}  →  {item.destino}
                    </Text>
                    {/* 3: usuario y fecha */}
                    <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                        {item.username}  ·  {formatKardex(item.kardex)}
                    </Text>
                    {/* 4: total de productos + chips */}
                    <View style={styles.cardChips}>
                        <View style={[styles.totalBadge, { backgroundColor: theme.accent }]}>
                            <Text style={styles.totalBadgeTexto}>{item.total} {t('paqueteria.productos_count')}</Text>
                        </View>
                        {chips}
                    </View>
                </TouchableOpacity>
            );
        });
    };

    return (
        <_Background id_almacen={user?.id_almacen}>
            <SafeAreaView style={styles.container}>
                <_Header page_info={pageConfig} />

                <ScrollView
                    style={[styles.content, { maxHeight: _ClientHeight }]}
                    contentContainerStyle={{ paddingBottom: footerClearance }}
                    showsVerticalScrollIndicator={false}
                >
                    {renderLista()}
                </ScrollView>

                <_Show_Report_Pager
                    visible={detalleIndex !== null && listaFiltrada.length > 0}
                    titulo={t('paqueteria.detalle_title')}
                    pages={listaFiltrada.map((item: any, i: number) => ({
                        key: item.id_paqueteria ?? i,
                        items_fields: camposDetalle(item),
                        children: renderDetalle(item),
                    }))}
                    index={Math.max(0, Math.min(detalleIndex ?? 0, listaFiltrada.length - 1))}
                    onIndexChange={(i) => { setShowCarousel(false); setDetalleIndex(i); }}
                    onClose={cerrarDetalle}
                    swipeNatural
                    overlay={<>{renderCarrusel()}{renderFormEnvio()}{renderAvisoParcial()}</>}
                />

                <_Footer Show_Almacen={false} keyboardAware extraHeight={FOOTER_EXTRA}>
                    {/* Botón de actualizar arriba y, debajo, el filtro de texto en vivo */}
                    <View style={{ width: width - 20, alignItems: 'center' }}>
                        <TouchableOpacity
                            style={[styles.refrescarBtn, { backgroundColor: theme.accent }]}
                            onPress={cargarLista}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="refresh" size={24} color="#fff" />
                                    <Text style={styles.refrescarTexto}>{t('paqueteria.refresh')}</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={[styles.filterBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="filter-variant" size={18} color={theme.textSub} />
                            <TextInput
                                style={[styles.filterInput, { color: theme.text }]}
                                placeholder={t('paqueteria.filter_placeholder')}
                                placeholderTextColor={theme.textSub}
                                value={filtroTexto}
                                onChangeText={setFiltroTexto}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="done"
                            />
                            {filtroTexto !== '' && (
                                <TouchableOpacity onPress={() => setFiltroTexto('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <MaterialCommunityIcons name="close-circle" size={18} color={theme.textSub} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </_Footer>
            </SafeAreaView>
        </_Background>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: 8 },
    card: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
        marginBottom: 8,
    },
    cardChips: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    totalBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
    totalBadgeTexto: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    chip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
    seccionTitulo: { fontSize: 15, fontWeight: 'bold', borderBottomWidth: 1, paddingBottom: 4, marginBottom: 8 },
    subTitulo: { fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 4 },
    archivoFila: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
    productoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 8, marginBottom: 6 },
    cantidadBadge: { minWidth: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
    cantidadTexto: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    btnReintentar: { marginTop: 10, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8 },
    btnReintentarTexto: { color: '#fff', fontWeight: 'bold' },
    refrescarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
    refrescarTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    filterBox: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, height: 44, marginTop: 10 },
    filterInput: { flex: 1, marginLeft: 6, fontSize: 14, paddingVertical: 0 },
    btnConfirmar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
    btnConfirmarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    formContainer: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    formLabel: { fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 4 },
    formInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, height: 42, fontSize: 14 },
    btnFoto: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 10, paddingVertical: 8 },
    fotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    fotoThumbWrap: { width: 72, height: 72 },
    fotoThumb: { width: 72, height: 72, borderRadius: 8 },
    fotoQuitar: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#e53e3e', justifyContent: 'center', alignItems: 'center' },
    formBotones: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1 },
    formBtn: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
    preguntaOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    preguntaBox: { borderRadius: 14, borderWidth: 1, padding: 18, alignSelf: 'stretch' },
    carouselOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    carouselContainer: { borderRadius: 16, overflow: 'hidden' },
    carouselHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, height: 49 },
    carouselTitle: { fontSize: 16, fontWeight: 'bold' },
});
