import { StyleSheet, Text, View } from 'react-native';

import { formatQualityLabel, getQualityBadgeColors } from '@/src/utils/qualityBadge';

interface QualityBadgeProps {
  quality: string;
}

export function QualityBadge({ quality }: QualityBadgeProps) {
  const colors = getQualityBadgeColors(quality);
  return (
    <View style={[styles.badge, { backgroundColor: colors.backgroundColor }]}>
      <Text style={[styles.label, { color: colors.color }]}>{formatQualityLabel(quality)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
