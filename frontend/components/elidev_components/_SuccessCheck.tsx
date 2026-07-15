import { useEffect, useRef } from "react";
import { Modal, View, StyleSheet, Animated } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const _SuccessCheck = ({
  visible, onFinish, duration = 1200
}: {
  visible: boolean;
  onFinish?: () => void;
  duration?: number;
}) => {
  const { theme } = useApp();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    scale.setValue(0);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => onFinish && onFinish());
    }, duration);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.circle,
            {
              backgroundColor: theme.card,
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <MaterialCommunityIcons name="check-circle" size={90} color="#48bb78" />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
});
