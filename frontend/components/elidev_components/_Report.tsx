import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ViewStyle, Image, LayoutChangeEvent, ScrollView as RNScrollView, useWindowDimensions, PanResponder } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { hexToRGBA } from './_Functions'
import { _ZoomableView } from "./_ZoomableView";
import { _Background } from "./_Background";

export const _Report = ({ children, showShare = true }: { children: any, showShare?: boolean }) => {
    const { theme } = useApp(); // Traemos el hook si se requiere aquí

    // AGREGADO: return explícito para que JSX lo reconozca como un componente válido
    return (
        <_ZoomableView showShare={showShare} shareButtonStyle={styles.shareButton}>
            <View style={[styles.detalleContainer, { backgroundColor: theme.card }]}>
                {children}
            </View>
        </_ZoomableView>
    );
}


export const _DetalleLinea = ({ label, value, label_style, value_style }: { label: string, value: any, label_style?: any, value_style?: any }) => {
    const { theme } = useApp();
    return (
        <View style={styles.rowDetalle}>
            <Text style={[styles.labelDetalle, { color: theme.textSub }, label_style]}>{label}:</Text>
            <Text style={[styles.valueDetalle, { color: theme.accent }, value_style]}>{value || '---'}</Text>
        </View>
    );
};

export const _DetalleMultiLinea = ({ label, value, label_style, value_style }: { label: string, value: any, label_style?: any, value_style?: any }) => {
    const { theme } = useApp();
    const lineas = value && typeof value === 'string'
        ? value.split('\n').filter(linea => linea.trim() !== '')
        : [];

    return (
        <View style={styles.rowDetalleMulti}>
            <Text style={[styles.labelDetalleMulti, { color: theme.textSub }, label_style]}>{label}:</Text>
            <View style={{ width: '100%', marginTop: 4 }}>
                {lineas.length > 0 ? (
                    lineas.map((linea, index) => (
                        <Text key={index} style={[styles.valueDetalleMulti, { color: theme.accent }, value_style]}>
                            {linea}
                        </Text>
                    ))
                ) : (
                    <Text style={[styles.valueDetalleMulti, { color: theme.accent }, value_style]}>
                        ---
                    </Text>
                )}
            </View>
        </View>
    );
};

// Campos del detalle de una cirugía. Extraído aparte de _Show_Cirugia_Report
// para poder reusarlo tanto en el modal (cirugias_programar.tsx) como en la
// vista de página completa (cirugia_detalle_view, abierta desde cirugias_buscar.tsx).
export const _CirugiaReportFields = ({ item, showShare = true }: { item?: any, showShare?: boolean }) => {
    if (!item) return null;
    return (
        <_Report showShare={showShare}>
            <_DetalleLinea label="Codigo" value={item.codigo} />
            <_DetalleLinea label="Estatus" value={item.estatus_text} />
            <_DetalleLinea label="Vendedor" value={item.vendedor} />
            <_DetalleLinea label="Técnico 1" value={item.tecnico} />
            <_DetalleLinea label="Técnico 2" value={item.tecnico2} />
            <_DetalleLinea label="Tiempo de Surtido" value={item.tiempo_surtido} />
            <_DetalleLinea label="Tiempo de Entrega a Técnico" value={item.tiempo_entrega_tecnico} />
            <_DetalleLinea label="Fecha de Programación" value={item.fecha_programacion} />
            <_DetalleLinea label="Fecha de Reprogramación" value={item.fecha_reprogramacion} />
            <_DetalleLinea label="Fecha de Cirugía" value={item.fecha_cirugia} />
            <_DetalleLinea label="Subdistribuidor" value={item.subdistribuidor} />
            <_DetalleLinea label="Médico" value={item.medico} />
            <_DetalleLinea label="Hospital" value={item.hospital} />
            <_DetalleLinea label="Municipio" value={`${item.municipio || ''}, ${item.estado || ''}`} />

            <View style={styles.divisor} />

            <_DetalleMultiLinea label="Material" value={item.minialmacen} />
            <_DetalleMultiLinea label="Equipo Poder" value={item.ep} />
            <_DetalleMultiLinea label="Adicionales" value={item.adicionales} />
            <_DetalleMultiLinea label="Consumibles" value={item.consumibles} />
            <_DetalleLinea label="Solicita Estéril" value={item.esteril} />

            <View style={styles.divisor} />

            <_DetalleMultiLinea label="Notas" value={item.notas} />
            <_DetalleLinea label="Remisión" value={item.remision} />
            <_DetalleLinea
                label="Última Modificación"
                value={`${item.last_update || ''} / ${item.last_updater || ''}`}
            />
        </_Report>
    );
};

export interface iMaterialSurtidoItem {
    nombre?: string;
    cantidad?: string;
    codigo_2?: string;
    referencia?: string;
    lote?: string;
    fecha_cad?: string;
}

// Grupo de primer nivel de "material_surtido" (un set/caja/categoría con sus
// piezas en "data"). Ver cirugia_detalle_material_surtido_data en el backend.
export interface iMaterialSurtidoGroup {
    id?: string;
    nombre?: string;
    data?: iMaterialSurtidoItem[];
}

// Lista de material surtido de una cirugía (nodo "material_surtido" de get_cirugia_report),
// agrupada por set/caja en un acordeón: las listas completas pueden ser muy
// grandes (decenas de piezas por set), así que cada grupo empieza colapsado.
export const _MaterialSurtidoList = ({ groups }: { groups?: iMaterialSurtidoGroup[] }) => {
    const { theme } = useApp();
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    if (!groups || groups.length === 0) {
        return (
            <_Report showShare={false}>
                <Text style={[styles.emptyText, { color: theme.textSub }]}>
                    No hay material surtido registrado.
                </Text>
            </_Report>
        );
    }

    const toggleGroup = (index: number) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index); else next.add(index);
            return next;
        });
    };

    return (
        <_Report showShare={false}>
            {groups.map((group, gIndex) => {
                const items = group.data || [];
                const isOpen = expanded.has(gIndex);
                return (
                    <View key={gIndex}>
                        <TouchableOpacity
                            style={[styles.materialGroupHeader, { borderColor: theme.border }]}
                            onPress={() => toggleGroup(gIndex)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.materialGroupTitle, { color: theme.text }]}>
                                {group.nombre || '---'}
                            </Text>
                            <View style={styles.materialGroupHeaderRight}>
                                <Text style={[styles.materialGroupCount, { color: theme.textSub }]}>{items.length}</Text>
                                <MaterialCommunityIcons
                                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={theme.accent}
                                />
                            </View>
                        </TouchableOpacity>
                        {isOpen && items.map((mat, index) => (
                            <View key={index} style={styles.materialItemRow}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={[styles.materialReferencia, { color: theme.accent }]}>{mat.referencia || '---'}</Text>
                                    <View style={{ flexDirection: 'row', marginTop: 5 }}>
                                        <Text style={[styles.materialCantidad, { color: theme.text }]}>Cant. </Text>
                                        <Text style={[styles.materialCantidad, { color: theme.accent }]}> {mat.cantidad || '---'}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.materialNombre, { color: theme.text }]}>{mat.nombre || '---'}</Text>
                                {index < items.length - 1 && <View style={[styles.divisor, { backgroundColor: theme.textSub }]} />}
                            </View>
                        ))}
                        {gIndex < groups.length - 1 && <View style={[styles.divisorGroup, { backgroundColor: theme.border }]} />}
                    </View>
                );
            })}
        </_Report>
    );
};

export interface _FotosCarouselProps {
    photos?: string[];
    // Identificadores únicos por foto (mismo orden/longitud que "photos").
    // Se usan como key de React y para identificar la foto en onDelete. Si
    // no se pasa, se usa el índice como antes.
    keys?: (string | number)[];
    // Controla si la selección (checkbox por foto) está habilitada. Default
    // true para no alterar el uso ya existente (cirugia_detalle_view); en
    // reporte_piezas_danadas, donde no aplica seleccionar, se pasa false.
    allowSelect?: boolean;
    // Selección controlada por el padre (cirugia_detalle_view), que es quien
    // sabe qué fotos compartir cuando se presiona el botón de compartir.
    selected?: Set<number>;
    onToggleSelect?: (index: number) => void;
    // Si es true, muestra un botón de eliminar arriba a la derecha de cada
    // foto; al presionarlo llama onDelete con el identificador (de "keys",
    // o el índice si no se pasaron keys) de esa foto. Default false.
    showDelete?: boolean;
    onDelete?: (key: string | number) => void;
    // Tamaño explícito opcional: cuando se especifica, se usa directamente en
    // vez de medir el contenedor con onLayout. Necesario para usar este
    // carrusel dentro de un <Modal>, donde onLayout/ResizeObserver no se
    // dispara de forma confiable en RN Web (contenido montado en un portal).
    width?: number;
    height?: number;
}

// Carrusel de fotos de una cirugía. Recibe URLs ya completas (ver getServerFileUrl
// en _Functions.tsx, ya que las fotos se guardan relativas a la raíz del sitio,
// no a /webservice). Pensado para vivir en un contenedor con flex:1 (no dentro
// de un ScrollView vertical), así puede usar toda la altura disponible en vez
// de quedar forzado a un cuadro cuadrado angosto.
export const _FotosCarousel = ({
    photos, keys, allowSelect = true, selected, onToggleSelect, showDelete = false, onDelete,
    width: fixedWidth, height: fixedHeight
}: _FotosCarouselProps) => {
    const { theme } = useApp();
    const [activeIndex, setActiveIndex] = useState(0);
    // Se mide el tamaño real del contenedor (ancho Y alto) en vez de un tope fijo
    // de 500px de ancho y una altura cuadrada que dejaban la vista de fotos más
    // angosta y más corta que las otras vistas. Si el padre ya especificó
    // width/height (ver _FotosCarouselProps), se usan esos y no se mide nada.
    const [measuredSize, setMeasuredSize] = useState({ width: 0, height: 0 });
    const hasFixedSize = !!(fixedWidth && fixedHeight);
    const size = hasFixedSize ? { width: fixedWidth, height: fixedHeight } : measuredSize;
    const scrollRef = useRef<ScrollView>(null);
    const counterHeight = 30;
    const imageHeight = Math.max(0, size.height - counterHeight);

    // Estado de descarga por foto: mientras no esté 'loaded' se muestra un gif
    // de carga; si tarda demasiado o falla, un botón de refresh fuerza un
    // nuevo intento (bust de cache vía query param + remount con "key").
    const [photoStatus, setPhotoStatus] = useState<Record<number, 'loading' | 'loaded' | 'error'>>({});
    const [retryTick, setRetryTick] = useState<Record<number, number>>({});
    const getPhotoStatus = (index: number) => photoStatus[index] || 'loading';
    const getPhotoUri = (uri: string, index: number) => {
        const tick = retryTick[index];
        return tick ? `${uri}${uri.includes('?') ? '&' : '?'}_retry=${tick}` : uri;
    };
    const retryPhoto = (index: number) => {
        setPhotoStatus(prev => ({ ...prev, [index]: 'loading' }));
        setRetryTick(prev => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
    };

    if (!photos || photos.length === 0) {
        return (
            <_Report>
                <Text style={[styles.emptyText, { color: theme.textSub }]}>
                    No hay fotos registradas.
                </Text>
            </_Report>
        );
    }

    const onLayout = (e: LayoutChangeEvent) => {
        if (hasFixedSize) return;
        const { width, height } = e.nativeEvent.layout;
        if (width && height && (Math.abs(width - measuredSize.width) > 1 || Math.abs(height - measuredSize.height) > 1)) {
            setMeasuredSize({ width, height });
        }
    };

    const onScroll = (e: any) => {
        if (!size.width) return;
        const index = Math.round(e.nativeEvent.contentOffset.x / size.width);
        setActiveIndex(index);
    };

    const goTo = (index: number) => {
        if (index < 0 || index >= photos.length || !size.width) return;
        scrollRef.current?.scrollTo({ x: index * size.width, animated: true });
        setActiveIndex(index);
    };

    return (
        // El ScrollView de react-native-gesture-handler necesita un GestureHandlerRootView
        // ancestro en nativo (en web no lo exige, por eso solo fallaba en iOS/Android).
        // _CirugiaReportFields/_MaterialSurtidoList lo obtienen gratis vía _Report -> _ZoomableView;
        // este carrusel no pasa por ahí, así que se agrega aquí directamente.
        <GestureHandlerRootView style={{ flex: 1, width: '100%' }}>
            <View
                style={[styles.fotosContainer, { backgroundColor: theme.card }]}
                onLayout={onLayout}
            >
                {size.width > 0 && (
                    <View style={{ width: '100%', height: imageHeight }}>
                        <ScrollView
                            ref={scrollRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={onScroll}
                            scrollEventThrottle={16}
                            style={{ width: size.width, height: imageHeight }}
                        >
                            {photos.map((uri, index) => {
                                const photoKey = keys?.[index] ?? index;
                                return (
                                    <View key={photoKey} style={{ width: size.width, height: imageHeight, position: 'relative' }}>
                                        <_ZoomableView showShare={false}>
                                            <Image
                                                key={retryTick[index] || 0}
                                                source={{ uri: getPhotoUri(uri, index) }}
                                                style={{ width: '100%', height: imageHeight }}
                                                resizeMode="contain"
                                                onLoad={() => setPhotoStatus(prev => ({ ...prev, [index]: 'loaded' }))}
                                                onError={() => setPhotoStatus(prev => ({ ...prev, [index]: 'error' }))}
                                            />
                                        </_ZoomableView>

                                        {getPhotoStatus(index) !== 'loaded' && (
                                            <View style={styles.fotoLoadingOverlay}>
                                                {getPhotoStatus(index) === 'loading' ? (
                                                    <Image
                                                        source={require('../../assets/images/loading_blue_circle.gif')}
                                                        style={styles.fotoLoadingGif}
                                                        resizeMode="contain"
                                                    />
                                                ) : (
                                                    <MaterialCommunityIcons name="image-broken-variant" size={40} color="#fff" />
                                                )}
                                                <TouchableOpacity style={styles.fotoRetryButton} onPress={() => retryPhoto(index)}>
                                                    <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
                                                    <Text style={styles.fotoRetryText}>Reintentar</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        {allowSelect && onToggleSelect && (
                                            <TouchableOpacity
                                                style={[
                                                    styles.fotoCheckbox,
                                                    { backgroundColor: selected?.has(index) ? theme.accent : hexToRGBA('#000000', 0.45) }
                                                ]}
                                                onPress={() => onToggleSelect(index)}
                                            >
                                                <MaterialCommunityIcons
                                                    name={selected?.has(index) ? 'check-circle' : 'checkbox-blank-circle-outline'}
                                                    size={22}
                                                    color="#fff"
                                                />
                                            </TouchableOpacity>
                                        )}

                                        {showDelete && (
                                            <TouchableOpacity
                                                style={styles.fotoDeleteButton}
                                                onPress={() => onDelete?.(photoKey)}
                                            >
                                                <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>

                        {activeIndex > 0 && (
                            <TouchableOpacity
                                style={[styles.fotoNavBtn, { left: 8, top: imageHeight / 2 - 20 }]}
                                onPress={() => goTo(activeIndex - 1)}
                            >
                                <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
                            </TouchableOpacity>
                        )}
                        {activeIndex < photos.length - 1 && (
                            <TouchableOpacity
                                style={[styles.fotoNavBtn, { right: 8, top: imageHeight / 2 - 20 }]}
                                onPress={() => goTo(activeIndex + 1)}
                            >
                                <MaterialCommunityIcons name="chevron-right" size={28} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                <Text style={[styles.fotoCounter, { color: theme.textSub }]}>
                    {activeIndex + 1} / {photos.length}
                </Text>
            </View>
        </GestureHandlerRootView>
    );
};

export interface _Show_Cirugia_ReportProps {
    visible: boolean;
    titulo: string;
    icon?: string;
    colorIcon?: string;
    onClose: () => void;
    item?: any
}

export const _Show_Cirugia_Report = ({ visible, titulo, onClose, item }: _Show_Cirugia_ReportProps) => {
    const { theme } = useApp();

    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            {/* GestureHandlerRootView dentro del Modal para que los gestos funcionen */}
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: hexToRGBA('#000000', 0.7) }]} />
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingVertical: 30
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity
                                style={[styles.btnCerrar, { backgroundColor: theme.accent }]}
                                onPress={onClose}
                            >
                                <MaterialCommunityIcons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                            <Text style={[styles.titulo, { color: theme.text }]}>{titulo}</Text>
                            <View style={{ width: 36 }} />
                        </View>
                        <_CirugiaReportFields item={item} />
                    </View>

                </ScrollView>
            </GestureHandlerRootView>
        </Modal>
    );
};

export interface _Show_Generic_ReportProps {
    visible: boolean;
    titulo: string;
    icon?: string;
    colorIcon?: string;
    onClose: () => void;
    item?: any;
    items_fields?: any;
    children?: React.ReactNode;
    style_content?: ViewStyle;
    showShare?:boolean;
}
export const _Show_Generic_Report = ({ visible, titulo, onClose, item, items_fields, children, style_content, showShare=true }: _Show_Generic_ReportProps) => {
    const { theme } = useApp();
    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            {/* GestureHandlerRootView dentro del Modal para que los gestos funcionen */}
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: hexToRGBA('#000000', 0.7) }]} />
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingVertical: 30
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity
                                style={[styles.btnCerrar, { backgroundColor: theme.accent }]}
                                onPress={onClose}
                            >
                                <MaterialCommunityIcons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                            <Text style={[styles.titulo, { color: theme.text }]}>{titulo}</Text>
                            <View style={{ width: 36 }} />
                        </View>
                        {item ? (
                            <_Report showShare={showShare}>
                                {items_fields?.map((field: any, index: number) => {
                                    return field.tipo_linea === "linea" ? (
                                        <_DetalleLinea
                                            key={index}
                                            label={field.label}
                                            value={field.value}
                                        />
                                    ) : (
                                        <_DetalleMultiLinea
                                            key={index}
                                            label={field.label}
                                            value={field.value}
                                        />
                                    );
                                })}
                                {children}
                            </_Report>

                        ) : ""}

                    </View>
                </ScrollView>
            </GestureHandlerRootView>
        </Modal>
    );
};

// ---------------------------------------------------------------------------
// Detalle de reportes en PANTALLA COMPLETA con paginado horizontal.
//
// Cada reporte es una "página" de un ScrollView horizontal con pagingEnabled:
// el swipe lo resuelve el propio scroll nativo (iOS/Android), sin depender de
// un PanResponder/gesto que compita con el scroll vertical del detalle (así
// fallaba el swipe en dispositivos reales).
//
// Las páginas se colocan en orden INVERSO (el reporte siguiente queda a la
// izquierda) para que deslizar hacia la DERECHA muestre el SIGUIENTE reporte y
// hacia la IZQUIERDA el ANTERIOR. En la barra inferior: flecha izquierda =
// anterior, flecha derecha = siguiente, e icono de swipe al centro.
// ---------------------------------------------------------------------------
export interface _ReportPagerPage {
    key: string | number;
    items_fields?: any[];
    children?: React.ReactNode;
}
export interface _Show_Report_PagerProps {
    visible: boolean;
    titulo: string;
    pages: _ReportPagerPage[];
    index: number;
    onIndexChange: (index: number) => void;
    onClose: () => void;
    showShare?: boolean;
    // Se monta dentro del propio Modal (p.ej. otro <Modal> como el carrusel de
    // fotos): en iOS un <Modal> hermano no se presenta mientras este está abierto.
    overlay?: React.ReactNode;
}
export const _Show_Report_Pager = ({ visible, titulo, pages, index, onIndexChange, onClose, showShare = false, overlay }: _Show_Report_PagerProps) => {
    const { theme, user } = useApp();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const pagerRef = useRef<RNScrollView>(null);
    // Posición (en pantalla) en la que está actualmente el pager; -1 = aún sin posicionar.
    const currentPos = useRef(-1);
    // Posición destino mientras corre un scroll programático (flechas): se
    // ignoran los eventos de scroll intermedios para no revertir el índice.
    const programmaticTarget = useRef<number | null>(null);
    const programmaticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const n = pages.length;
    const posDe = (i: number) => n - 1 - i;

    useEffect(() => {
        if (!visible) { currentPos.current = -1; programmaticTarget.current = null; return; }
        if (n === 0) return;
        const pos = n - 1 - index;
        if (currentPos.current === pos) return;
        const animated = currentPos.current !== -1;
        // Se espera un instante: al abrir, el Modal/ScrollView todavía se está
        // montando. currentPos se actualiza DENTRO del timeout: si el efecto se
        // reinicia antes (y cancela este) el siguiente intento no se salta.
        const id = setTimeout(() => {
            if (animated) {
                programmaticTarget.current = pos;
                if (programmaticTimer.current) clearTimeout(programmaticTimer.current);
                // Respaldo: si nunca se alcanza el destino, se vuelve a escuchar al usuario.
                programmaticTimer.current = setTimeout(() => { programmaticTarget.current = null; }, 1200);
            }
            pagerRef.current?.scrollTo({ x: pos * width, animated });
            currentPos.current = pos;
        }, animated ? 0 : 50);
        return () => clearTimeout(id);
    }, [visible, index, n, width]);

    useEffect(() => () => { if (programmaticTimer.current) clearTimeout(programmaticTimer.current); }, []);

    // El usuario terminó de deslizar (o el scroll quedó asentado en una página).
    const commitPos = (x: number, requireSettled: boolean) => {
        const pos = Math.max(0, Math.min(n - 1, Math.round(x / width)));
        // En web solo hay onScroll (sin "momentum end"): se considera asentado
        // cuando el offset cae justo en el borde de una página.
        if (requireSettled && Math.abs(x - pos * width) > 2) return;
        if (programmaticTarget.current !== null) {
            // Scroll programático en curso: solo cuenta al llegar a su destino.
            if (pos !== programmaticTarget.current) return;
            programmaticTarget.current = null;
        }
        if (pos === currentPos.current) return;
        currentPos.current = pos;
        const nuevo = posDe(pos);
        if (nuevo !== index) onIndexChange(nuevo);
    };

    const hayAnterior = index > 0;
    const haySiguiente = index < n - 1;

    // Swipe sobre el encabezado y la barra inferior (donde está el icono de
    // swipe). Esas zonas son hermanas del scroll horizontal, no hijas, así que
    // arrastrar ahí no movía las páginas. Aquí no hay ningún scroll con el que
    // competir, por eso un PanResponder simple sí es confiable. Mismo sentido
    // que el paginado: derecha = siguiente, izquierda = anterior.
    const navRef = useRef({ index, n, onIndexChange });
    navRef.current = { index, n, onIndexChange };
    const barSwipe = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) =>
                Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
            onPanResponderRelease: (_, g) => {
                const { index: i, n: total, onIndexChange: cambiar } = navRef.current;
                if (g.dx > 60 && i < total - 1) cambiar(i + 1);
                else if (g.dx < -60 && i > 0) cambiar(i - 1);
            },
        })
    ).current;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <_Background id_almacen={user?.id_almacen}>
                    {/* Encabezado */}
                    <View style={[styles.pagerHeader, { paddingTop: insets.top + 8, borderBottomColor: theme.border }]} {...barSwipe.panHandlers}>
                        <TouchableOpacity style={[styles.btnCerrar, { backgroundColor: theme.accent }]} onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={20} color="#fff" />
                        </TouchableOpacity>
                        <Text style={[styles.pagerTitulo, { color: theme.iconTextColor }]} numberOfLines={1}>{titulo}</Text>
                        <Text style={[styles.pagerContador, { color: theme.iconTextColor }]}>{n > 0 ? `${index + 1} / ${n}` : ''}</Text>
                    </View>

                    {/* Páginas (una por reporte) */}
                    <RNScrollView
                        ref={pagerRef}
                        horizontal
                        pagingEnabled
                        style={{ flex: 1 }}
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => commitPos(e.nativeEvent.contentOffset.x, false)}
                        onScroll={(e) => commitPos(e.nativeEvent.contentOffset.x, true)}
                        scrollEventThrottle={16}
                        contentOffset={{ x: posDe(index) * width, y: 0 }}
                    >
                        {pages.map((_, pos) => {
                            const i = n - 1 - pos;
                            const page = pages[i];
                            // Solo se monta el contenido de la página actual y las cercanas.
                            const cerca = Math.abs(i - index) <= 2;
                            return (
                                <View key={page.key} style={{ width }}>
                                    {cerca && (
                                        <ScrollView
                                            style={{ flex: 1 }}
                                            contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 12, paddingBottom: 20 }}
                                            showsVerticalScrollIndicator={false}
                                            keyboardShouldPersistTaps="handled"
                                            nestedScrollEnabled
                                        >
                                            <_Report showShare={showShare}>
                                                {page.items_fields?.map((field: any, k: number) =>
                                                    field.tipo_linea === "linea" ? (
                                                        <_DetalleLinea key={k} label={field.label} value={field.value} />
                                                    ) : (
                                                        <_DetalleMultiLinea key={k} label={field.label} value={field.value} />
                                                    )
                                                )}
                                                {page.children}
                                            </_Report>
                                        </ScrollView>
                                    )}
                                </View>
                            );
                        })}
                    </RNScrollView>

                    {/* Barra inferior: anterior | icono de swipe | siguiente */}
                    <View style={[styles.pagerBottom, { paddingBottom: insets.bottom + 8, borderTopColor: theme.border, backgroundColor: hexToRGBA(theme.card, 0.85) }]} {...barSwipe.panHandlers}>
                        <TouchableOpacity
                            style={[styles.pagerArrow, { backgroundColor: theme.accent, opacity: hayAnterior ? 1 : 0.3 }]}
                            disabled={!hayAnterior}
                            onPress={() => onIndexChange(index -1)}
                        >
                            <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
                        </TouchableOpacity>
                        {n > 1 && (
                            <MaterialCommunityIcons name="gesture-swipe-horizontal" size={30} color={theme.accent} />
                        )}
                        <TouchableOpacity
                            style={[styles.pagerArrow, { backgroundColor: theme.accent, opacity: haySiguiente ? 1 : 0.3 }]}
                            disabled={!haySiguiente}
                            onPress={() => onIndexChange(index + 1)}
                        >
                            <MaterialCommunityIcons name="chevron-right" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </_Background>
                {overlay}
            </GestureHandlerRootView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    detalleContainer: {
        paddingVertical: 15,
        paddingHorizontal: 10,
        width: '100%',
        marginBottom: 30
    },
    fotosContainer: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    fotoLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        zIndex: 10,
    },
    fotoLoadingGif: {
        width: 90,
        height: 90,
    },
    fotoRetryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    fotoRetryText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    materialNombre: {
        fontSize: 14,
        fontWeight: 'normal',
    },
    materialReferencia: {
        fontSize: 14,
        marginTop: 3,
        fontWeight: 'bold',
    },
    materialCantidad: {
        fontSize: 12,
        fontWeight: 'normal',
    },
    materialGroupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    materialGroupHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    materialGroupTitle: {
        flex: 1,
        fontSize: 13,
        fontWeight: 'bold',
        paddingRight: 8,
    },
    materialGroupCount: {
        fontSize: 12,
    },
    materialItemRow: {
        paddingLeft: 10,
        paddingTop: 8,
    },
    divisorGroup: {
        height: 1,
        marginVertical: 4,
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 20,
        fontSize: 13,
    },
    fotoCounter: {
        fontSize: 12,
        paddingVertical: 8,
        marginBottom:8,
        paddingBottom:3,
        marginLeft:20,        
    },
    fotoCheckbox: {
        position: 'absolute',
        top: 10,
        left: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    fotoDeleteButton: {
        position: 'absolute',
        top: 0,
        right: 20,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: hexToRGBA('#e53e3e', 0.85),
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    fotoNavBtn: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    rowDetalle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(100,100,100,0.05)',
        width: '100%',
    },
    labelDetalle: {
        fontSize: 12,
        fontWeight: '600',
        width: '45%',
    },
    valueDetalle: {
        fontSize: 12,
        width: '50%',
        textAlign: 'right',
    },
    rowDetalleMulti: {

        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(100,100,100,0.05)',
        width: '100%',
    },
    labelDetalleMulti: {
        fontSize: 12,
        fontWeight: '600',
        width: '45%',
    },
    valueDetalleMulti: {
        fontSize: 12,
        textAlign: 'left',
        width: '100%',
    },
    shareButton: {
        position: 'absolute',
        top: -40,
        right: 20,
    },
    divisor: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 8,
    },
    modalContent: {
        width: "100%",
        borderRadius: 30,
        padding: 5,
        alignItems: "center",
        borderWidth: 1,
    },
    titulo: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 15,
        textAlign: "center",
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    pagerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    pagerTitulo: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginHorizontal: 10,
    },
    pagerContador: {
        minWidth: 36,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'right',
    },
    pagerBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 8,
        borderTopWidth: 1,
    },
    pagerArrow: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
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
});