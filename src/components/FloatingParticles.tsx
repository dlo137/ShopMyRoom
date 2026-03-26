import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * W,
  y: Math.random() * H,
  size: 4 + Math.random() * 6,
  duration: 3000 + Math.random() * 4000,
  delay: Math.random() * 2000,
}));

function Particle({ x, y, size, duration, delay }: typeof PARTICLES[0]) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.4, duration: duration / 2, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: duration / 2, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(translateY, { toValue: -20, duration: duration, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        s.particle,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

export default function FloatingParticles() {
  return (
    <View style={s.container} pointerEvents="none">
      {PARTICLES.map((p) => (
        <Particle key={p.id} {...p} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#6366f1',
  },
});
