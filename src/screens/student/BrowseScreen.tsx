import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { productService } from '../../services/productService';
import { Product } from '../../types';

interface BrowseScreenProps {
  navigation: any;
}

const CATEGORIES = ['All', 'Electronics', 'Books', 'Clothing', 'Furniture', 'Sports', 'Other'];
const CONDITIONS = ['All', 'New', 'Like New', 'Good', 'Fair', 'Poor'];
const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Oldest', value: 'oldest' },
];

export const BrowseScreen: React.FC<BrowseScreenProps> = ({ navigation }) => {
  const searchInputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedSort, setSelectedSort] = useState(SORT_OPTIONS[0]);

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (selectedCondition !== 'All') {
        params.condition = selectedCondition.toUpperCase().replace(/\s+/g, '_');
      }
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      if (selectedSort.value) {
        params.sort = selectedSort.value;
      }

      const res = await productService.getProducts(params);
      setProducts(res.products || []);
    } catch (err: any) {
      setError('Failed to fetch browse results. Please pull to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedCondition, searchQuery, selectedSort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Prominent Search Bar */}
      <View style={styles.searchHeader}>
        <View style={[styles.searchCard, Shadow.sm]}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            placeholder="Search all items..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => fetchProducts()}
            returnKeyType="search"
            autoFocus={true}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Trigger Button */}
        <TouchableOpacity
          onPress={() => setSortModalVisible(true)}
          style={[styles.sortButton, Shadow.sm]}
          activeOpacity={0.8}
        >
          <Ionicons name="filter-outline" size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Category Filter Row */}
      <View style={styles.filterSection}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `cat-${item}`}
          contentContainerStyle={styles.pillsList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item)}
                style={[
                  styles.pill,
                  isSelected ? styles.pillSelected : styles.pillUnselected,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pillText,
                    isSelected ? styles.pillTextSelected : styles.pillTextUnselected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Condition Filter Row */}
      <View style={styles.conditionSection}>
        <FlatList
          data={CONDITIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `cond-${item}`}
          contentContainerStyle={styles.pillsList}
          renderItem={({ item }) => {
            const isSelected = selectedCondition === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCondition(item)}
                style={[
                  styles.subPill,
                  isSelected ? styles.subPillSelected : styles.subPillUnselected,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.subPillText,
                    isSelected ? styles.subPillTextSelected : styles.subPillTextUnselected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Results Header */}
      <View style={styles.resultsInfoRow}>
        <Text style={styles.resultsCount}>
          {products.length} {products.length === 1 ? 'result' : 'results'} found
        </Text>
        <TouchableOpacity
          onPress={() => setSortModalVisible(true)}
          style={styles.currentSortTextContainer}
        >
          <Text style={styles.currentSortLabel}>Sort: </Text>
          <Text style={styles.currentSortValue}>{selectedSort.label}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.text} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>

      {/* Results List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🔍"
              title="No matching products"
              subtitle="Try loosening your filters or searching for different keywords."
            />
          }
          renderItem={({ item }) => {
            const imageUrl = item.images?.[0];
            return (
              <TouchableOpacity
                style={[styles.productRowCard, Shadow.sm]}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('ProductDetail', { productId: item.id })
                }
              >
                {/* Left 80x80 Image */}
                <View style={styles.imageWrapper}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Ionicons name="image-outline" size={28} color={Colors.textMuted} />
                    </View>
                  )}
                </View>

                {/* Right Info */}
                <View style={styles.infoWrapper}>
                  <View style={styles.infoTopRow}>
                    <Badge label={item.condition} type="condition" />
                    <Text style={styles.categoryBadge}>{item.category}</Text>
                  </View>

                  <Text numberOfLines={2} style={styles.itemTitle}>
                    {item.title}
                  </Text>

                  {item.seller_name ? (
                    <Text numberOfLines={1} style={styles.sellerName}>
                      Sold by {item.seller_name}
                    </Text>
                  ) : null}

                  <Text style={styles.itemPrice}>
                    ₹{item.price ? item.price.toLocaleString('en-IN') : '0'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Sort Options Modal */}
      <Modal
        visible={sortModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={[styles.modalContent, Shadow.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort Products</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {SORT_OPTIONS.map((opt) => {
              const isSelected = selectedSort.value === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.sortOptionRow,
                    isSelected && styles.sortOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedSort(opt);
                    setSortModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      isSelected && styles.sortOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  searchCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  sortButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  errorBanner: {
    backgroundColor: Colors.danger,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  errorText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: '500',
    flex: 1,
  },
  filterSection: {
    marginBottom: Spacing.xs,
  },
  conditionSection: {
    marginBottom: Spacing.sm,
  },
  pillsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 999,
    marginRight: Spacing.xs,
  },
  pillSelected: {
    backgroundColor: Colors.primary,
  },
  pillUnselected: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: Colors.white,
  },
  pillTextUnselected: {
    color: Colors.secondary,
  },
  subPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  subPillSelected: {
    backgroundColor: Colors.primaryLight,
  },
  subPillUnselected: {
    backgroundColor: Colors.borderLight,
  },
  subPillText: {
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  subPillTextSelected: {
    color: Colors.white,
  },
  subPillTextUnselected: {
    color: Colors.textSecondary,
  },
  resultsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  resultsCount: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  currentSortTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentSortLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  currentSortValue: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.sm,
  },
  productRowCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.sm,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.borderLight,
  },
  infoWrapper: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  infoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  categoryBadge: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 2,
  },
  sellerName: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sortOptionSelected: {
    backgroundColor: Colors.background,
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  sortOptionText: {
    fontSize: Typography.base,
    color: Colors.text,
    fontWeight: '500',
  },
  sortOptionTextSelected: {
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default BrowseScreen;
