
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { apiClient } from '../../api/client';
import { Colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Barcode'>;

export const BarcodeScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const mealType = route.params?.mealType || 'LUNCH';
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('Searching Open Food Facts...');
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);

  // Auto-request permission on mount
  useEffect(() => {
    if (!permission) {
      requestPermission();
    } else if (!permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // Open-source Open Food Facts direct client lookup
  const fetchOpenFoodFactsDirect = async (rawBarcode: string) => {
    const clean = rawBarcode.trim();
    const barcodeVariants = [
      clean,
      clean.length === 12 ? '0' + clean : null,
      clean.length === 13 && clean.startsWith('0') ? clean.slice(1) : null,
    ].filter(Boolean) as string[];

    for (const b of barcodeVariants) {
      const endpoints = [
        `https://world.openfoodfacts.org/api/v2/product/${b}.json`,
        `https://world.openfoodfacts.org/api/v0/product/${b}.json`,
      ];

      for (const url of endpoints) {
        try {
          const res = await axios.get(url, {
            timeout: 6000,
            headers: { 'User-Agent': 'SnapCaloraAI-Android - Version 1.0.7' },
          });

          if (res.data?.status === 1 && res.data?.product) {
            const product = res.data.product;
            const nutriments = product.nutriments || {};
            const calories =
              nutriments['energy-kcal_100g'] ??
              nutriments['energy-kcal'] ??
              (nutriments['energy_100g'] ? nutriments['energy_100g'] / 4.184 : 0);

            return {
              id: `off_${b}`,
              name: product.product_name || product.generic_name || 'Packaged Food Item',
              brand: product.brands || product.brand_owner || 'Open Food Facts',
              barcode: b,
              image: product.image_front_url || product.image_url || null,
              servingSize: product.serving_quantity ? Number(product.serving_quantity) : 100,
              servingUnit: 'g',
              calories: Math.round(calories),
              protein: Number((nutriments['proteins_100g'] ?? nutriments['proteins'] ?? 0).toFixed(1)),
              carbs: Number((nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'] ?? 0).toFixed(1)),
              fat: Number((nutriments['fat_100g'] ?? nutriments['fat'] ?? 0).toFixed(1)),
              fiber: Number((nutriments['fiber_100g'] ?? nutriments['fiber'] ?? 0).toFixed(1)),
              sugar: Number((nutriments['sugars_100g'] ?? nutriments['sugars'] ?? 0).toFixed(1)),
              sodium: Math.round((nutriments['sodium_100g'] ?? 0) * 1000),
              source: 'OPEN_FOOD_FACTS' as const,
              confidenceScore: 0.99,
            };
          }
        } catch {
          // Continue to next endpoint/variant
        }
      }
    }
    return null;
  };

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Opening Barcode Scanner...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionSubtitle}>
          Camera access is needed to scan packaged food barcodes.
        </Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.grantButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    const barcode = result.data;
    if (isScanning || barcode === lastScannedBarcode) return;

    try {
      setIsScanning(true);
      setScanStatus('Scanning product barcode...');
      setLastScannedBarcode(barcode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      let foundFood = null;

      // 1. First attempt: backend lookup (with 5-second timeout)
      try {
        const response = await apiClient.post(
          '/scan/barcode',
          { barcode },
          { timeout: 5000 }
        );
        if (response.data.success && response.data.data?.food) {
          foundFood = response.data.data.food;
        }
      } catch {
        // Backend sleeping or cold start: fall through to direct Open Food Facts
      }

      // 2. Direct fallback: query Open Food Facts (Open Source Global Food Database)
      if (!foundFood) {
        setScanStatus('Checking Open Food Facts database...');
        foundFood = await fetchOpenFoodFactsDirect(barcode);
      }

      if (foundFood) {
        navigation.replace('FoodDetail', {
          food: foundFood,
          mealType,
        });
        return;
      }

      Alert.alert(
        'Product Not Found',
        `No food entry found for barcode ${barcode} in the Open Food Facts database. You can take a photo of the food or search by name.`,
        [
          {
            text: 'Take Photo Instead',
            onPress: () => navigation.replace('Camera', { mealType }),
          },
          {
            text: 'Scan Again',
            onPress: () => {
              setLastScannedBarcode(null);
              setIsScanning(false);
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Scan Error',
        err.response?.data?.message || 'Could not look up barcode.',
        [
          {
            text: 'Retry',
            onPress: () => {
              setLastScannedBarcode(null);
              setIsScanning(false);
            },
          },
        ]
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={isScanning ? undefined : handleBarcodeScanned}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {/* Top Bar with Safe Insets */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 14 : 8) }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.titleBadge}>
            <Text style={styles.titleText}>Barcode Scanner (OpenFoodFacts)</Text>
          </View>

          <TouchableOpacity
            style={styles.aiPhotoSwitch}
            onPress={() => navigation.replace('Camera', { mealType })}
            activeOpacity={0.8}
          >
            <Text style={styles.aiPhotoSwitchText}>AI Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Viewfinder Target */}
        <View style={styles.viewfinderContainer} pointerEvents="none">
          <View style={styles.targetFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Laser Line */}
            <View style={styles.laserLine} />

            {isScanning && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={styles.loadingText}>{scanStatus}</Text>
              </View>
            )}
          </View>
          <Text style={styles.hintText}>Align food barcode inside the frame</Text>
        </View>

        {/* Bottom Manual Search Shortcut */}
        <View style={styles.bottomBar} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.manualSearchBtn}
            onPress={() => navigation.navigate('Search', { mealType })}
            activeOpacity={0.85}
          >
            <Text style={styles.manualSearchText}>🔍 Enter Barcode or Food Manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#090A0F',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  permissionSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  grantButton: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginBottom: 12,
  },
  grantButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  titleBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  aiPhotoSwitch: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderColor: '#22C55E',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  aiPhotoSwitchText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    width: 290,
    height: 190,
    borderRadius: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#22C55E',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 14,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 14,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 14,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 14,
  },
  laserLine: {
    width: 260,
    height: 2,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  manualSearchBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  manualSearchText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
