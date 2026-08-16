import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

type Tab = 'home' | 'chat' | 'cart' | 'lists' | 'profile';

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'chat', label: 'Chat' },
  { id: 'cart', label: 'Cart' },
  { id: 'lists', label: 'Lists' },
  { id: 'profile', label: 'Profile' },
];

export default function BottomNav({
  active = 'home',
  onSelect,
}: {
  active?: Tab;
  onSelect?: (tab: Tab) => void;
}) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
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
    bottom: 20,
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
  tab: { minWidth: 50, alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '600' },
  labelActive: { color: colors.brand },
  labelInactive: { color: colors.ink40 },
});
