/**
 * HomeScreenButton – stylized button for home screen navigation and actions.
 * Renders an icon and label with press feedback and shadow. Used for main menu actions.
 *
 * Props:
 *  - icon: ReactNode (icon component)
 *  - label: string
 *  - onPress: () => void
 *  - style?: object
 *  - ...props: any
 *
 * @module HomeScreenButton
 * @author Sabata79
 * @since 2025-09-18
 */
import { Pressable, Text, View } from 'react-native';
import styles from '../styles/HomeScreenButtonStyles';


const HomeScreenButton = ({ icon, label, onPress, style, ...props }) => (
  <View style={{ width: '100%', alignItems: 'center', marginBottom: 15 }}>
    <View style={styles.shadowLayer} />
    <Pressable
      style={({ pressed }) => [styles.button, style, pressed && styles.buttonPressed]}
      onPress={onPress}
      {...props}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  </View>
);

export default HomeScreenButton;
