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
