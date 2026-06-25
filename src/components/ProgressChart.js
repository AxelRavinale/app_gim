import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '../theme/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export function LineProgressChart({ data, title, unit = 'kg', color, height = 180 }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const lineColor = color || colors.primary;

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;
    return {
      labels: data.map(d => d.label),
      datasets: [{ data: data.map(d => d.value), color: (opacity = 1) => hexToRgba(lineColor, opacity), strokeWidth: 2.5 }],
    };
  }, [data, lineColor]);

  if (!chartData || data.length < 2) {
    return (
      <View style={s.chartWrapper}>
        {title ? <Text style={s.chartTitle}>{title}</Text> : null}
        <View style={s.emptyChart}>
          <Text style={s.emptyChartIcon}>📊</Text>
          <Text style={s.emptyChartText}>Necesitás al menos 2 registros para ver el gráfico</Text>
        </View>
      </View>
    );
  }

  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  const diff = maxVal - minVal;
  const diffColor = diff > 0 ? colors.success : diff === 0 ? colors.textSecondary : colors.danger;

  return (
    <View style={s.chartWrapper}>
      <View style={s.chartHeader}>
        {title ? <Text style={s.chartTitle}>{title}</Text> : <View />}
        <View style={s.chartSummary}>
          <Text style={[s.chartDiff, { color: diffColor }]}>{diff > 0 ? '+' : ''}{diff} {unit}</Text>
          <Text style={s.chartDiffLabel}>progreso</Text>
        </View>
      </View>
      <LineChart data={chartData} width={SCREEN_WIDTH - 64} height={height} chartConfig={getChartConfig(lineColor, colors)} bezier style={s.chart} withInnerLines withOuterLines={false} withVerticalLines={false} withHorizontalLines formatYLabel={val => `${Math.round(parseFloat(val))}${unit}`} decorator={() => null} />
      <View style={s.minMaxRow}>
        <View style={[s.minMaxChip, { backgroundColor: colors.dangerLight }]}><Text style={[s.minMaxValue, { color: colors.danger }]}>{minVal} {unit}</Text><Text style={s.minMaxLabel}>Mínimo</Text></View>
        <View style={[s.minMaxChip, { backgroundColor: colors.successLight }]}><Text style={[s.minMaxValue, { color: colors.success }]}>{maxVal} {unit}</Text><Text style={s.minMaxLabel}>Máximo</Text></View>
        <View style={[s.minMaxChip, { backgroundColor: colors.primaryLight }]}><Text style={[s.minMaxValue, { color: colors.primary }]}>{data.length}</Text><Text style={s.minMaxLabel}>Sesiones</Text></View>
      </View>
    </View>
  );
}

export function AttendanceBarChart({ completedData, skippedData, labels, title }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const chartData = useMemo(() => {
    if (!completedData || completedData.length === 0) return null;
    return { labels, datasets: [{ data: completedData }] };
  }, [completedData, labels]);

  if (!chartData) {
    return (
      <View style={s.chartWrapper}>
        <Text style={s.chartTitle}>{title}</Text>
        <View style={s.emptyChart}><Text style={s.emptyChartIcon}>📊</Text><Text style={s.emptyChartText}>Sin datos todavía</Text></View>
      </View>
    );
  }

  return (
    <View style={s.chartWrapper}>
      <View style={s.chartHeader}><Text style={s.chartTitle}>{title}</Text></View>
      <View style={s.legend}>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: colors.success }]} /><Text style={s.legendText}>Completados</Text></View>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: colors.danger }]} /><Text style={s.legendText}>Faltados</Text></View>
      </View>
      <BarChart data={chartData} width={SCREEN_WIDTH - 64} height={160} chartConfig={getChartConfig(colors.success, colors)} style={s.chart} showValuesOnTopOfBars withInnerLines={false} fromZero />
      <View style={s.minMaxRow}>
        <View style={[s.minMaxChip, { backgroundColor: colors.successLight }]}><Text style={[s.minMaxValue, { color: colors.success }]}>{completedData.reduce((a, b) => a + b, 0)}</Text><Text style={s.minMaxLabel}>Completados</Text></View>
        <View style={[s.minMaxChip, { backgroundColor: colors.dangerLight }]}><Text style={[s.minMaxValue, { color: colors.danger }]}>{(skippedData || []).reduce((a, b) => a + b, 0)}</Text><Text style={s.minMaxLabel}>Faltados</Text></View>
      </View>
    </View>
  );
}

function getChartConfig(lineColor, colors) {
  return {
    backgroundColor: colors.card, backgroundGradientFrom: colors.card, backgroundGradientTo: colors.card,
    decimalPlaces: 0, color: (opacity = 1) => hexToRgba(lineColor, opacity),
    labelColor: () => colors.textSecondary, style: { borderRadius: 12 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: lineColor },
    propsForBackgroundLines: { stroke: colors.border, strokeDasharray: '4', strokeWidth: 0.5 },
    propsForLabels: { fontSize: 9 },
  };
}

function hexToRgba(hex, opacity) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(26, 111, 191, ${opacity})`;
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})`;
}

export function prepareChartData(sessions, trackingType, filterCount, filterPeriod) {
  if (!sessions || sessions.length === 0) return [];
  let sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (filterPeriod !== 'all') {
    const now = new Date();
    const months = filterPeriod === '1m' ? 1 : 3;
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
    sorted = sorted.filter(s => new Date(s.date) >= cutoff);
  }
  if (filterCount !== 'all') sorted = sorted.slice(-parseInt(filterCount));
  return sorted.map(s => {
    const date = new Date(s.date);
    return { date: s.date, value: trackingType === 'time' ? (s.duration || 0) : (s.maxWeightInSession || 0), label: `${date.getDate()}/${date.getMonth() + 1}` };
  }).filter(d => d.value > 0);
}

const makeStyles = (colors) => StyleSheet.create({
  chartWrapper: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  chartSummary: { alignItems: 'flex-end' },
  chartDiff: { fontSize: 18, fontWeight: '800' },
  chartDiffLabel: { fontSize: 10, color: colors.textSecondary },
  chart: { borderRadius: 12, marginLeft: -16 },
  minMaxRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  minMaxChip: { flex: 1, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 4, alignItems: 'center' },
  minMaxValue: { fontSize: 14, fontWeight: '700' },
  minMaxLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 1 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: colors.textSecondary },
  emptyChart: { height: 120, justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: colors.background, borderRadius: 12 },
  emptyChartIcon: { fontSize: 32 },
  emptyChartText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
});