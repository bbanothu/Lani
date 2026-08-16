import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

export type FilterChip = { key: string; label: string; count: number };

export default function QuickFilters({
  chips,
  active,
  onToggle,
}: {
  chips: FilterChip[];
  active: Set<string>;
  onToggle: (key: string) => void;
}) {
  if (chips.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Quick filters:</Text>
      {chips.map((chip) => {
        const selected = active.has(chip.key);
        return (
          <Pressable
            key={chip.key}
            onPress={() => onToggle(chip.key)}
            style={[styles.chip, selected && styles.chipActive]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextActive]}>
              {selected ? '✓' : '+'} {chip.label}{' '}
              <Text style={styles.chipCount}>({chip.count})</Text>
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, color: colors.ink45, marginRight: 4 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: { borderColor: colors.brand, backgroundColor: 'rgba(243,105,36,0.1)' },
  chipText: { fontSize: 14, color: colors.ink70 },
  chipTextActive: { color: colors.brand, fontWeight: '600' },
  chipCount: { color: colors.ink40 },
});
