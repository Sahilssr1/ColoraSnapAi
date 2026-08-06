import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
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
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);

  if (!permission) {
    return <View style={styles.container} />;
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
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    const barcode = result.data;
    if (isScanning || barcode === lastScannedBarcode) return;

    try {
      setIsScanning(true);
      setLastScannedBarcode(barcode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const response = await apiClient.post('/scan/barcode', { barcode });

      if (response.data.success && response.data.data?.food) {
        navigation.replace('FoodDetail', {
          food: response.data.data.food,
          mealType,
        });
      } else {
        Alert.alert(
          'Product Not Found',
          'This barcode was not found in our global food database. Would you like to snap a picture with the AI scanner instead?',
          [
            {
              text: 'Scan Again',
              onPress: () => {
                setIsScanning(false);
                setLastScannedBarcode(null);
              },
            },
            {
              text: 'Take Photo Scan',
              onPress: () => navigation.replace('Camera', { mealType }),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Scan Error', 'Could not query barcode.');
      setIsScanning(false);
      setLastScannedBarcode(null);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128'],
        }}
        onBarcodeScanned={isScanning ? undefined : handleBarcodeScanned}
      >
        <SafeAreaView style={styles.overlay}>
          {/* Top Bar with Safe Insets */}
          <View style={[styles.topBar, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 14 : 8) }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.titleBadge}>
              <Text style={styles.titleText}>Barcode Scanner</Text>
            </View>

            <TouchableOpacity
              style={styles.aiPhotoSwitch}
              onPress={() => navigation.replace('Camera', { mealType })}
            >
              <Text style={styles.aiPhotoSwitchText}>AI Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Viewfinder Target */}
          <View style={styles.viewfinderContainer}>
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
                  <Text style={styles.loadingText}>Looking up product data...</Text>
                </View>
              )}
            </View>
            <Text style={styles.hintText}>Align barcode inside the frame</Text>
          </View>

          <View style={styles.bottomSpace} />
        </SafeAreaView>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  },
  grantButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  aiPhotoSwitch: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  aiPhotoSwitchText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    width: 290,
    height: 180,
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#38EF7D',
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
    width: '90%',
    height: 2,
    backgroundColor: '#38EF7D',
    shadowColor: '#38EF7D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 16,
    fontWeight: '500',
  },
  bottomSpace: {
    height: 60,
  },
});
