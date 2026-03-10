import React, { useContext } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppContext } from "../context/AppContext";

export default function CustomModal({ visible, titulo, mensaje, icon, colorIcon, onClose }) {
  // Extraemos el tema del contexto
  const { theme } = useContext(AppContext);

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent, 
          { backgroundColor: theme.card, borderColor: theme.border }
        ]}>
          <MaterialCommunityIcons 
            name={icon || "alert-circle-outline"} 
            size={70} 
            color={colorIcon || "#f56565"} 
          />
          <Text style={[styles.titulo, { color: theme.text }]}>{titulo}</Text>
          <Text style={[styles.mensaje, { color: theme.textSub }]}>{mensaje}</Text>

          <TouchableOpacity 
            style={[styles.btnCerrar, { backgroundColor: "#3182ce" }]} 
            onPress={onClose}
          >
            <Text style={styles.btnText}>ENTENDIDO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
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
    borderRadius: 20,
    padding: 25,
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
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});