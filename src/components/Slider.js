import React from 'react';
import { View, Text } from 'react-native';
import { Slider as ExpoSlider } from 'expo-slider';

const Slider = ({
  label,
  value,
  onValueChange,
  min = 0,
  max = 1,
  step = 0.01,
  style = {},
  labelStyle = {},
  valueStyle = {},
  sliderStyle = {},
  ...props
}) => {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }, style]}>
      {label && (
        <Text style={[{ minWidth: 80, marginRight: 8 }, labelStyle]}>{label}</Text>
      )}
      <ExpoSlider
        style={[{ flex: 1, height: 32, marginHorizontal: 8 }, sliderStyle]}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#FFD600"
        maximumTrackTintColor="#888"
        thumbTintColor="#FFD600"
        {...props}
      />
      <Text style={[{ minWidth: 40, marginLeft: 8, textAlign: 'right' }, valueStyle]}>
        {Math.round(value * 100)}%
      </Text>
    </View>
  );
};

export default Slider;
