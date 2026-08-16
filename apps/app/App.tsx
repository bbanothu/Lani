import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSession } from './lib/auth';
import type { Tab } from './lib/nav';
import { colors } from './lib/theme';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import CartScreen from './screens/CartScreen';
import ListsScreen from './screens/ListsScreen';
import ProfileScreen from './screens/ProfileScreen';

export default function App() {
  const { user, ready } = useSession();
  const [tab, setTab] = useState<Tab>('home');

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
        <StatusBar style="dark" />
      </View>
    );
  }

  let screen = null;
  if (!user) {
    screen = <LoginScreen />;
  } else if (tab === 'cart') {
    screen = <CartScreen onNavigate={setTab} />;
  } else if (tab === 'lists') {
    screen = <ListsScreen onNavigate={setTab} />;
  } else if (tab === 'profile') {
    screen = (
      <ProfileScreen user={user} onNavigate={setTab} onSignedOut={() => setTab('home')} />
    );
  } else {
    screen = <DashboardScreen user={user} onNavigate={setTab} />;
  }

  return (
    <>
      {screen}
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
