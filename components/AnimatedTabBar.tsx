import { View, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [dimensions, setDimensions] = useState({ height: 70, width: 350 });
  const buttonWidth = dimensions.width / state.routes.length;
  
  const tabPositionX = useSharedValue(0);

  useEffect(() => {
    // Set initial position based on initial active tab
    tabPositionX.value = withSpring(buttonWidth * state.index, { 
      damping: 14, 
      stiffness: 120 
    });
  }, [state.index, buttonWidth]);

  const onTabbarLayout = (e: LayoutChangeEvent) => {
    setDimensions({
      height: e.nativeEvent.layout.height,
      width: e.nativeEvent.layout.width,
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabPositionX.value }],
    };
  });

  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={70} tint="light" style={styles.blurView} onLayout={onTabbarLayout}>
        <Animated.View 
          style={[
            animatedStyle, 
            { 
              position: 'absolute', 
              backgroundColor: 'rgba(99, 102, 241, 0.12)', // Indigo active backdrop
              borderRadius: 24,
              marginHorizontal: 12,
              height: dimensions.height - 24,
              width: buttonWidth - 24,
              top: 12,
            }
          ]} 
        />
        <View style={styles.tabItemsContainer}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              // Trigger fluid glide animation for background pill
              tabPositionX.value = withSpring(buttonWidth * index, { 
                damping: 14, 
                stiffness: 120 
              });

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TabItem 
                key={route.key} 
                route={route} 
                options={options} 
                isFocused={isFocused} 
                onPress={onPress} 
                onLongPress={onLongPress} 
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

// Extracted TabItem to isolate its own internal scale animation hooks
function TabItem({ route, options, isFocused, onPress, onLongPress }: any) {
  const scale = useSharedValue(isFocused ? 1.15 : 1);
  
  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.15 : 1, { damping: 12, stiffness: 200 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  let iconName = 'home-outline';
  if (route.name === 'index') iconName = isFocused ? 'home' : 'home-outline';
  if (route.name === 'quiz') iconName = isFocused ? 'help-circle' : 'help-circle-outline';
  if (route.name === 'study') iconName = isFocused ? 'book' : 'book-outline';
  if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.8}
    >
      <Animated.View style={animatedIconStyle}>
        <Ionicons 
          name={iconName as any} 
          size={isFocused ? 26 : 24} 
          color={isFocused ? '#6366F1' : '#94A3B8'} 
        />
      </Animated.View>
      {isFocused && (
        <Animated.Text style={styles.activeTextLabel}>
          {options.title !== undefined ? options.title : route.name}
        </Animated.Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    height: 75,
    borderRadius: 35, // Floating pill
    shadowColor: '#6366F1', // Indigo glow shadow
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: 'transparent',
  },
  blurView: {
    flex: 1,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.65)', // High white-frost baseline tint
  },
  tabItemsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTextLabel: {
    color: '#6366F1', 
    fontSize: 10, 
    fontWeight: '700', 
    marginTop: 4,
  }
});
