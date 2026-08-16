import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSession } from './lib/auth';
import { colors } from './lib/theme';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';

export default function App() {
  const { user, ready } = useSession();

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      {user ? <DashboardScreen user={user} /> : <LoginScreen />}
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
