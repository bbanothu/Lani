import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tab } from '../lib/nav';
import { colors } from '../lib/theme';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'cart', label: 'Cart', icon: '🛒' },
  { id: 'lists', label: 'Lists', icon: '📋' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav({
  active = 'home',
  onSelect,
}: {
  active?: Tab;
  onSelect?: (tab: Tab) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 12 }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelect?.(tab.id)}
              style={styles.tab}
              hitSlop={8}
            >
              <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
              <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    gap: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.ink08,
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  tab: { minWidth: 50, alignItems: 'center', gap: 2 },
  icon: { fontSize: 18, opacity: 0.5 },
  iconActive: { opacity: 1 },
  label: { fontSize: 11, fontWeight: '600' },
  labelActive: { color: colors.brand },
  labelInactive: { color: colors.ink40 },
});
