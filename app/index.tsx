import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.timing(taglineAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(buttonAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Soft bg blobs */}
      <View style={styles.bgAccentTop} />
      <View style={styles.bgAccentBottom} />

      {/* ── Brand ── */}
      <Animated.View style={[styles.brandArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.logoMark}>
          <View style={styles.logoInner} />
        </View>
        <Text style={styles.brandName}>MallOffers</Text>
        <Animated.Text style={[styles.tagline, { opacity: taglineAnim }]}>
          Premium deals, curated for you.
        </Animated.Text>
      </Animated.View>

      {/* ── Illustration ── */}
      <Animated.View style={[styles.illustrationArea, { opacity: fadeAnim }]}>
        <View style={styles.illustrationCard}>
          <View style={styles.illustrationShimmer} />
          <View style={styles.illustrationRow}>
            <View style={[styles.illustrationPill, { width: 80 }]} />
            <View style={[styles.illustrationPill, { width: 56, backgroundColor: Colors.text }]} />
          </View>
          <View>
            <View style={[styles.illustrationPill, { width: 140, height: 28, borderRadius: 6 }]} />
          </View>
          <View style={styles.illustrationRow}>
            <View style={[styles.illustrationPill, { width: 64 }]} />
            <View style={[styles.illustrationPill, { width: 96 }]} />
          </View>
        </View>

        {/* Floating badge */}
        <View style={styles.floatingBadge}>
          <Text style={styles.floatingBadgeStar}>✦</Text>
          <Text style={styles.floatingBadgeText}>500+ Deals Today</Text>
        </View>
      </Animated.View>

      {/* ── Actions ── */}
      <Animated.View style={[styles.actionsArea, { opacity: buttonAnim }]}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(auth)/login')} activeOpacity={0.88}>
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/(auth)/register')} activeOpacity={0.88}>
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleButton} onPress={() => console.log('Google login')} activeOpacity={0.88}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={() => router.push('/(tabs)')} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>Explore without signing in</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  bgAccentTop: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: Colors.gray50, opacity: 0.8,
  },
  bgAccentBottom: {
    position: 'absolute', bottom: -80, left: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: Colors.gray100, opacity: 0.6,
  },

  // Brand
  brandArea: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  logoMark: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: Colors.text,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  logoInner: { width: 22, height: 22, borderRadius: 6, borderWidth: 2.5, borderColor: Colors.white },
  brandName: { fontSize: 28, fontWeight: '700', color: Colors.text, letterSpacing: -0.8, marginBottom: 8 },
  tagline: { fontSize: 15, color: Colors.textSecondary, letterSpacing: 0.1 },

  // Illustration
  illustrationArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  illustrationCard: {
    width: '100%', backgroundColor: Colors.gray50,
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: Colors.border, gap: 14,
  },
  illustrationShimmer: { width: '60%', height: 12, borderRadius: 6, backgroundColor: Colors.gray200 },
  illustrationRow: { flexDirection: 'row', gap: 10 },
  illustrationPill: { height: 14, borderRadius: 7, backgroundColor: Colors.gray200 },
  floatingBadge: {
    position: 'absolute', bottom: -16, right: 32,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.text,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  floatingBadgeStar: { fontSize: 10, color: Colors.warning },
  floatingBadgeText: { fontSize: 12, color: Colors.white, fontWeight: '600', letterSpacing: 0.2 },

  // Actions
  actionsArea: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 36, gap: 12 },
  primaryButton: { backgroundColor: Colors.text, paddingVertical: 17, borderRadius: 14, alignItems: 'center' },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  secondaryButton: {
    backgroundColor: Colors.white, paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.text,
  },
  secondaryButtonText: { color: Colors.text, fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.textTertiary },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white, paddingVertical: 16, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  googleIcon: { fontSize: 16, fontWeight: '700', color: Colors.info },
  googleButtonText: { color: Colors.text, fontSize: 15, fontWeight: '500' },
  skipButton: { alignItems: 'center', paddingVertical: 10 },
  skipButtonText: {
    color: Colors.textTertiary, fontSize: 14,
    textDecorationLine: 'underline', textDecorationColor: Colors.gray300,
  },
});