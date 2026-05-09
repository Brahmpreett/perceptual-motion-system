import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Text, View } from 'react-native';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function Joystick({
  label,
  helper,
  size = 132,
  disabled = false,
  sensitivity = 1,
  onMove,
  onEnd,
}) {
  const radius = size / 2;
  const knobSize = Math.round(size * 0.38);
  const maxOffset = radius - knobSize / 2 - 8;
  const [active, setActive] = useState(false);
  const knob = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: () => setActive(true),
        onPanResponderMove: (_, gesture) => {
          const dx = clamp(gesture.dx, -maxOffset, maxOffset);
          const dy = clamp(gesture.dy, -maxOffset, maxOffset);
          const x = clamp((dx / maxOffset) * sensitivity, -1, 1);
          const y = clamp((dy / maxOffset) * sensitivity, -1, 1);

          knob.setValue({ x: dx, y: dy });
          onMove?.({ x, y });
        },
        onPanResponderRelease: () => {
          setActive(false);
          Animated.spring(knob, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
            tension: 90,
          }).start();
          onEnd?.();
        },
        onPanResponderTerminate: () => {
          setActive(false);
          knob.setValue({ x: 0, y: 0 });
          onEnd?.();
        },
      }),
    [disabled, knob, maxOffset, onEnd, onMove, sensitivity]
  );

  return (
    <View className="items-center">
      <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </Text>
      <View
        className={`items-center justify-center border ${
          disabled ? 'border-slate-800 bg-slate-950 opacity-50' : 'border-cyan-500/30 bg-axis-panel'
        }`}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          shadowColor: active ? '#22d3ee' : '#020617',
          shadowOpacity: active ? 0.35 : 0.2,
          shadowRadius: active ? 18 : 10,
          elevation: active ? 8 : 3,
        }}
        {...panResponder.panHandlers}
      >
        <View className="absolute h-px w-4/5 bg-slate-700/60" />
        <View className="absolute h-4/5 w-px bg-slate-700/60" />
        <Animated.View
          className={`${active ? 'bg-cyan-300' : 'bg-slate-200'} border border-white/30`}
          style={{
            width: knobSize,
            height: knobSize,
            borderRadius: knobSize / 2,
            transform: knob.getTranslateTransform(),
          }}
        />
      </View>
      <Text className="mt-2 text-center text-xs text-slate-500">{helper}</Text>
    </View>
  );
}
