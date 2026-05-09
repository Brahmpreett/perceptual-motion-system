import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Text, View } from 'react-native';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function snap(value, step) {
  return Math.round(value / step) * step;
}

export default function AxisSlider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.1,
  disabled = false,
  formatValue = (nextValue) => nextValue.toFixed(1),
  onChange,
}) {
  const [trackWidth, setTrackWidth] = useState(1);
  const startValue = useRef(value);
  const percent = ((value - min) / (max - min)) * 100;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: () => {
          startValue.current = value;
        },
        onPanResponderMove: (_, gesture) => {
          const delta = (gesture.dx / trackWidth) * (max - min);
          const nextValue = clamp(snap(startValue.current + delta, step), min, max);
          onChange?.(Number(nextValue.toFixed(2)));
        },
      }),
    [disabled, max, min, onChange, step, trackWidth, value]
  );

  return (
    <View className={disabled ? 'opacity-50' : ''}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-slate-200">{label}</Text>
        <Text className="text-sm font-bold text-cyan-300">{formatValue(value)}</Text>
      </View>
      <View
        className="h-7 justify-center"
        onLayout={(event) => setTrackWidth(Math.max(1, event.nativeEvent.layout.width))}
        {...panResponder.panHandlers}
      >
        <View className="h-2 overflow-hidden rounded-full bg-slate-800">
          <View className="h-2 rounded-full bg-cyan-400" style={{ width: `${percent}%` }} />
        </View>
        <View
          className="absolute h-6 w-6 rounded-full border-2 border-axis-bg bg-white"
          style={{ left: `${percent}%`, marginLeft: -12 }}
        />
      </View>
    </View>
  );
}
