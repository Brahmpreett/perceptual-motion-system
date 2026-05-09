import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function SegmentedControl({ label, options, value, onChange }) {
  return (
    <View>
      {label ? <Text className="mb-3 text-sm font-semibold text-slate-200">{label}</Text> : null}
      <View className="flex-row overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              className={`flex-1 px-3 py-3 ${selected ? 'bg-cyan-400' : 'bg-transparent'}`}
              activeOpacity={0.85}
              onPress={() => onChange(option.value)}
            >
              <Text
                className={`text-center text-sm font-bold ${
                  selected ? 'text-slate-950' : 'text-slate-400'
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
