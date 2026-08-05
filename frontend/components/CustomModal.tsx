import React from "react";
import { Dispatch, SetStateAction} from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";

export interface CustomModalProps {
  visible: boolean;
  titulo: string;
  mensaje: string;
  icon?: string;
  colorIcon?: string;
  onClose: () => void;
  buttonText?: string;
  onConfirm?: () => void;
}

export default function CustomModal({
  visible,
  titulo,
  mensaje,
  icon,
  colorIcon,
  onClose,
  buttonText,
  onConfirm
}: CustomModalProps) {
  const { theme, t } = useApp();

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent, 
          { backgroundColor: theme.card, borderColor: theme.border }
        ]}>
          <MaterialCommunityIcons 
            name={(icon as any) || "alert-circle-outline"} 
            size={70} 
            color={colorIcon || "#f56565"} 
          />
          <Text style={[styles.titulo, { color: theme.text }]}>{titulo}</Text>
          <Text style={[styles.mensaje, { color: theme.textSub }]}>{mensaje}</Text>

          <TouchableOpacity
            style={[styles.btnCerrar, { backgroundColor: theme.accent }]}
            onPress={onConfirm ?? onClose}
          >
            <Text style={styles.btnText}>{buttonText ?? t('common.understood')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
/*export const [view_soon, setView_Soon] = useState(false);
visible: boolean,
    setVisible: (value:boolean) => void,
export  function ShowSoon(visible:boolean) {
  setView_Soon(visible);
}*/
interface SoonModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>; // Esta es la declaración para el "set"
}
export const Soon_Modal = ({ visible, setVisible }: SoonModalProps) => {
  const { theme, t } = useApp();
  const modal = {
        visible: visible,
        titulo: t('common.comingSoon'),
        mensaje: t('common.featureNotAvailable'),
        icon: 'clock-outline',
        colorIcon: theme.accent,
        onClose: () => {setVisible(false)}
      };
  return CustomModal(modal);
}

interface UpdateRequiredModalProps {
  visible: boolean;
  onRestart: () => void;
}
export const UpdateRequired_Modal = ({ visible, onRestart }: UpdateRequiredModalProps) => {
  const { theme, t } = useApp();
  return CustomModal({
    visible,
    titulo: t('common.updateRequiredTitle'),
    mensaje: t('common.updateRequiredMessage'),
    icon: 'restart',
    colorIcon: theme.accent,
    buttonText: t('common.restartNow'),
    onConfirm: onRestart,
    onClose: onRestart,
  });
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    borderRadius: 40,
    padding: 35,
    alignItems: "center",
    borderWidth: 1,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    textAlign: "center",
  },
  mensaje: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 15,
    lineHeight: 22,
  },
  btnCerrar: {
    width: "100%",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});