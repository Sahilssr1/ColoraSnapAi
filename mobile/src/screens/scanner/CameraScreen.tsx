import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { apiClient } from '../../api/client';
import { useAppDispatch } from '../../redux/hooks';
import { setCurrentScan } from '../../redux/slices/scannerSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

export const CameraScreen: React.FC<Props> = ({ navigation, route }) => {
  const mealType = route.params?.mealType || 'LUNCH';
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef<any>(null);
  const dispatch = useAppDispatch();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionSubtitle}>
          Calora AI uses your camera to instantly recognize meals, calculate macros, and scan barcodes.
        </Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.grantButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const processImageUri = async (uri: string) => {
    try {
      setScanning(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const formData = new FormData();
      formData.append('image', {
        uri,
        name: 'meal.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await apiClient.post('/scan/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const scanResult = response.data.data;
        dispatch(setCurrentScan(scanResult));
        navigation.replace('FoodResult', {
          scanResult,
          mealType,
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to analyze food. Please try again.';
      Alert.alert('Scan Failed', msg);
    } finally {
      setScanning(false);
    }
  };

  const handleCapture = async () => {
    if (cameraRef.current && !scanning) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (photo?.uri) {
          await processImageUri(photo.uri);
        }
      } catch (err) {
        Alert.alert('Camera Error', 'Could not capture photo.');
      }
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        await processImageUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Gallery Error', 'Could not pick image from gallery.');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFillObject} ref={cameraRef}>
        <SafeAreaView style={styles.overlay}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.titleBadge}>
              <Text style={styles.titleText}>AI Food Scanner</Text>
            </View>

            <TouchableOpacity
              style={styles.barcodeSwitch}
              onPress={() => navigation.replace('Barcode', { mealType })}
            >
              <Text style={styles.barcodeSwitchText}>Barcode</Text>
            </TouchableOpacity>
          </View>

          {/* Viewfinder Target Frame */}
          <View style={styles.viewfinderContainer}>
            <View style={styles.targetFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {scanning && (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color="#FF5E3A" />
                  <Text style={styles.scanningText}>Analyzing Nutrition with AI...</Text>
                </View>
              )}
            </View>
            <Text style={styles.hintText}>Point camera at your plate or food item</Text>
          </View>

          {/* Bottom Control Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={handlePickFromGallery}
              disabled={scanning}
            >
              <Text style={styles.galleryIcon}>🖼️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shutterButton}
              onPress={handleCapture}
              disabled={scanning}
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => navigation.navigate('Search', { mealType })}
              disabled={scanning}
            >
              <Text style={styles.searchIcon}>🔍</Text>
            </TouchableOpacity>
          </View>
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
  barcodeSwitch: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  barcodeSwitchText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    width: 270,
    height: 270,
    borderRadius: 24,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#FF5E3A',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanningOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  scanningText: {
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
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 30,
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryIcon: {
    fontSize: 22,
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FF5E3A',
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 22,
  },
});
