import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { productService } from '../../services/productService';
import { ProductCategory, ProductCondition } from '../../types';

interface AddEditProductScreenProps {
  route: {
    params?: {
      productId?: string;
    };
  };
  navigation: any;
}

const CATEGORIES: ProductCategory[] = [
  'Electronics',
  'Books',
  'Clothing',
  'Furniture',
  'Sports',
  'Other',
];

const CONDITIONS: { label: ProductCondition; desc: string }[] = [
  { label: 'NEW', desc: 'Brand new, unopened, in original packaging' },
  { label: 'LIKE_NEW', desc: 'Flawless condition with zero signs of wear' },
  { label: 'GOOD', desc: 'Minor scratches or normal campus wear and tear' },
  { label: 'FAIR', desc: 'Functional with noticeable signs of use' },
  { label: 'POOR', desc: 'Heavily used or needs minor repairs' },
];

export const AddEditProductScreen: React.FC<any> = ({
  route,
  navigation,
}) => {
  const productId = route?.params?.productId;
  const isEditMode = Boolean(productId);

  // Form State
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Books');
  const [condition, setCondition] = useState<ProductCondition>('GOOD');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');

  // Modals & Status
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [conditionModalVisible, setConditionModalVisible] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (productId) {
      setLoadingInitial(true);
      productService
        .getProductById(productId)
        .then((product: any) => {
          if (product) {
            setTitle(product.title || '');
            setDescription(product.description || '');
            setCategory((product.category as ProductCategory) || 'Books');
            setCondition((product.condition as ProductCondition) || 'GOOD');
            setPrice(product.price ? String(product.price) : '');
            setStock(product.stock ? String(product.stock) : '1');

            const loadedImages: string[] = [];
            if (product.images && Array.isArray(product.images)) {
              loadedImages.push(...product.images);
            } else if (product.image_url) {
              loadedImages.push(product.image_url);
            }
            setImages(loadedImages);
          }
        })
        .catch((err) => {
          Alert.alert('Error', 'Failed to load product details.');
        })
        .finally(() => setLoadingInitial(false));
    }
  }, [productId]);

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload up to 5 photos.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload product photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImages((prev) => [...prev, uri]);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Title is required';
    }
    if (!description.trim()) {
      errs.description = 'Description is required';
    }
    if (!price.trim()) {
      errs.price = 'Price is required';
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      errs.price = 'Please enter a valid price in ₹';
    }
    if (!stock.trim()) {
      errs.stock = 'Stock is required';
    } else if (isNaN(Number(stock)) || Number(stock) < 1) {
      errs.stock = 'Stock must be at least 1';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please correct the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode && productId) {
        // Edit mode: can send JSON or FormData
        const payload: any = {
          title: title.trim(),
          description: description.trim(),
          category,
          condition,
          price: parseFloat(price),
          stock: parseInt(stock, 10),
          images,
          image_url: images[0] || '',
        };
        await productService.updateProduct(productId, payload);
        Alert.alert('Success', 'Product updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        // Create mode: build FormData
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('category', category);
        formData.append('condition', condition);
        formData.append('price', String(parseFloat(price)));
        formData.append('stock', String(parseInt(stock, 10) || 1));

        // Append images
        images.forEach((uri, index) => {
          const filename = uri.split('/').pop() || `photo_${index}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formData.append('images', {
            uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
            name: filename,
            type,
          } as any);

          if (index === 0) {
            formData.append('image_url', uri);
          }
        });

        await productService.createProduct(formData);
        Alert.alert('Success', 'Product listed successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save product listing.';
      Alert.alert('Submission Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading listing details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Product' : 'Add Product'}
        </Text>

        <TouchableOpacity
          style={styles.saveHeaderBtn}
          activeOpacity={0.7}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveHeaderText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* A) PHOTOS SECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionLabel}>Photos</Text>
            <Text style={styles.sectionHelper}>
              {images.length}/5 uploaded
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosScroll}
          >
            {images.map((uri, index) => (
              <View key={index} style={styles.photoSlotFilled}>
                <Image source={{ uri }} style={styles.uploadedImage} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  activeOpacity={0.8}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close" size={14} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 5 && (
              <TouchableOpacity
                style={styles.photoSlotEmpty}
                activeOpacity={0.7}
                onPress={pickImage}
              >
                <Ionicons name="camera-outline" size={26} color={Colors.textSecondary} />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* B) BASIC INFO SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Basic Information</Text>

          {/* Title */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>
              Title <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.title ? styles.inputError : undefined]}
              placeholder="What are you selling? (e.g. Engineering Math Book)"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (errors.title) setErrors((e) => ({ ...e, title: '' }));
              }}
            />
            {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
          </View>

          {/* Description */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>
              Description <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.description ? styles.inputError : undefined]}
              placeholder="Describe your item - condition, features, reason for selling, hostel location..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={(t) => {
                setDescription(t);
                if (errors.description) setErrors((e) => ({ ...e, description: '' }));
              }}
            />
            {errors.description ? (
              <Text style={styles.errorText}>{errors.description}</Text>
            ) : null}
          </View>

          {/* Category Picker Row */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Category</Text>
            <TouchableOpacity
              style={styles.pickerRow}
              activeOpacity={0.7}
              onPress={() => setCategoryModalVisible(true)}
            >
              <Text style={styles.pickerValue}>{category}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Condition Picker Row */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Condition</Text>
            <TouchableOpacity
              style={styles.pickerRow}
              activeOpacity={0.7}
              onPress={() => setConditionModalVisible(true)}
            >
              <Text style={styles.pickerValue}>{condition.replace('_', ' ')}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* C) PRICING & INVENTORY */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Pricing & Inventory</Text>

          <View style={styles.priceRow}>
            {/* Price */}
            <View style={[styles.fieldWrap, { flex: 1.5, marginRight: Spacing.md }]}>
              <Text style={styles.fieldLabel}>
                Price (₹) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={[styles.priceInputWrapper, errors.price ? styles.inputError : undefined]}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={(t) => {
                    setPrice(t);
                    if (errors.price) setErrors((e) => ({ ...e, price: '' }));
                  }}
                />
              </View>
              {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
            </View>

            {/* Stock Quantity */}
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Stock Qty</Text>
              <TextInput
                style={[styles.input, errors.stock ? styles.inputError : undefined]}
                placeholder="1"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={stock}
                onChangeText={(t) => {
                  setStock(t);
                  if (errors.stock) setErrors((e) => ({ ...e, stock: '' }));
                }}
              />
              {errors.stock ? <Text style={styles.errorText}>{errors.stock}</Text> : null}
            </View>
          </View>
        </View>

        {/* D) SUBMIT BUTTON */}
        <TouchableOpacity
          style={styles.submitButton}
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Update Listing' : 'Save Listing'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setCategory(cat);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected && styles.modalOptionTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInnerDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Condition Selection Modal */}
      <Modal
        visible={conditionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConditionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setConditionModalVisible(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>Select Condition</Text>
              <TouchableOpacity onPress={() => setConditionModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {CONDITIONS.map((cond) => {
              const isSelected = condition === cond.label;
              return (
                <TouchableOpacity
                  key={cond.label}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setCondition(cond.label);
                    setConditionModalVisible(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {cond.label.replace('_', ' ')}
                    </Text>
                    <Text style={styles.condDescText}>{cond.desc}</Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInnerDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  saveHeaderBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  saveHeaderText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.primary,
  },
  formContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  sectionContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionHelper: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  photosScroll: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  photoSlotFilled: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.borderLight,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSlotEmpty: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  addPhotoText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  fieldWrap: {
    marginTop: Spacing.sm,
  },
  fieldLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  requiredStar: {
    color: Colors.danger,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.base,
    color: Colors.text,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 10,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: '#fef2f2',
  },
  errorText: {
    fontSize: Typography.xs,
    color: Colors.danger,
    marginTop: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  pickerValue: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  currencyPrefix: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: Typography.base,
    color: Colors.text,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalSheetTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalOptionText: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.text,
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: Colors.primary,
  },
  condDescText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
});

export default AddEditProductScreen;
