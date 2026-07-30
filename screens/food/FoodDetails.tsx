// FoodDetails.tsx
import React, { useEffect, useState } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { getAllProducts, toggleSaveStatus, get_product_id } from "~/store";
import { LargeText, NormalText, PageView, Touchable } from "~/components/generic";
import { error, i18n, log, t } from "~/utility/utility";
import { Card, Divider, useTheme } from "react-native-paper";
import FoodIcon, { foodToUrl } from "~/screens/food/FoodIcon";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MainStackParamList } from "~/navigators/main_navigator";

// Defining prop for navigation
export type FoodDetailsScreenProps = StackScreenProps<MainStackParamList, "FoodDetails">;

// Responsive constants based on screen width
const { width } = Dimensions.get("window");
const baseFontSize = width > 400 ? 18 : 16;
const basePadding = width > 400 ? 24 : 16;

// Function to format recall inititiationDate
function recall_data_parse_initiation_date(recall_initiation_date: string | undefined) {
  if (!recall_initiation_date) return "Unknown Date.";
  try {
    const date = new Date(
      Number(recall_initiation_date.substring(0, 4)),
      Number(recall_initiation_date.substring(4, 6)) - 1,
      Number(recall_initiation_date.substring(6, 8))
    );
    const formatter = new Intl.DateTimeFormat(i18n.locale);
    return formatter.format(date);
  } catch {
    const fallback = new Intl.DateTimeFormat("en-US");
    return fallback.format(new Date());
  }
}

export default function FoodDetails({ route }: FoodDetailsScreenProps) {
  // Defining constants and States
  const { Pinfo: item, recallData } = route.params;
  const [isRecalled] = useState(recallData.length > 0);
  const [isSaved, setIsSaved] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isIngredientsExpanded, setIsIngredientsExpanded] = useState(false);

  // Theme-based styling
  const theme = useTheme();
  const isDarkTheme = theme.dark;
  const primaryTextColor = isDarkTheme ? "#B6E8FF" : "#024B6D";
  const elementTextColor = isDarkTheme ? "#024B6D" : "#B6E8FF";
  const elementSecondaryColor = isDarkTheme ? "#000000" : "#FFFFFF";
  const secondaryTextColor = isDarkTheme ? "#FFFFFF" : "#000000";

  // Check if Product saved locally
  useEffect(() => {
    log("Checking saved status");
    getAllProducts(undefined, { type: "food", status: null }, 1, true)
      .then((data) => {
        const thisId = get_product_id(item, "food");
        setIsSaved(data.some((d) => (d as any).id === thisId));
      })
      .catch(error);
  }, []);

  // Toggle Save/Unsave for Product
  function toggleSaved() {
    toggleSaveStatus(isSaved, "food", item)
      .then((success) => {
        if (!success) throw new Error("Failed to update save status");
        setIsSaved(!isSaved);
      })
      .catch(error);
  }

  // Format and truncate description to display
  const recallDesc = recallData[0]?.product_description ?? "";
  const truncatedDesc = recallDesc.length > 100 ? recallDesc.slice(0, 100) + "..." : recallDesc;
  // Parse ingredients
  const ingredients = (item.ingredient_text as string).split(/,\s*(?![^\[]*\])/g);
  const INGREDIENTS_PREVIEW_COUNT = 5;
  const ingredientsToShow = isIngredientsExpanded ? ingredients : ingredients.slice(0, INGREDIENTS_PREVIEW_COUNT);
  // Define order for Displaying sections
  const recallSections = isRecalled
    ? [
      { title: t("fooddetails_initiationdate"), content: recall_data_parse_initiation_date(recallData[0]?.recall_initiation_date) },
      { title: t("fooddetails_reasonrecall"), content: recallData[0]?.reason_for_recall ?? "" },
      { title: t("fooddetails_classification"), content: recallData[0]?.classification ?? "" },
      { title: t("fooddetails_distributionlocations"), content: recallData[0]?.distribution_pattern ?? "" },
    ]
    : [];

  return (
    <PageView style={styles.page} contentContainerStyle={{ ...styles.pageContent, paddingBottom: basePadding * 0.2 }}>
      {/* Floating Save/Unsave button */}
      <Touchable onPress={toggleSaved} style={styles.saveIcon}>
        <MaterialCommunityIcons
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={baseFontSize * 2}
          color={theme.colors.primary}
        />
      </Touchable>

      {/* Header Section with Image and Name */}
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          <View style={styles.imageScale}>
            <FoodIcon url={foodToUrl(item.primary_image.image_path)} />
          </View>
        </View>
        <View style={styles.nameContainer}>
          <LargeText style={[styles.productName, { color: primaryTextColor }]}>{item.name}</LargeText>
          <NormalText style={[styles.brandName, { color: secondaryTextColor }]}>{item.brand.name}</NormalText>
        </View>
      </View>

      {/* Recall Status */}
      <View
        style={[styles.statusCard, {
          backgroundColor: isRecalled ? theme.colors.errorContainer : theme.colors.primaryContainer,
        }]}
      >
        <LargeText
          style={{
            fontWeight: "bold",
            fontSize: isRecalled ? baseFontSize * 1.6 : baseFontSize * 1.4,
            color: isRecalled ? theme.colors.onErrorContainer : theme.colors.onPrimaryContainer,
          }}
        >
          {(isRecalled ? t("detailsrecalled") : t("detailsnotrecalled")).toUpperCase()}
        </LargeText>
      </View>

      {/* Product Info Card */}
      <Card style={[styles.infoCard, { backgroundColor: primaryTextColor }]}>
        {/* Recalled Section if present */}
        {recallSections.map((section, i) => (
          <View key={i}>
            <View style={styles.sectionWrapper}>
              <LargeText style={[styles.sectionTitle, { color: elementTextColor }]}>{section.title}</LargeText>
              <NormalText style={[styles.sectionText, { color: elementTextColor }]}>{section.content}</NormalText>
            </View>
            {i < recallSections.length - 1 && <Divider style={{ backgroundColor: elementSecondaryColor }} />}
          </View>
        ))}

        {/* Display Product Description when Recalled */}
        {isRecalled && (
          <>
            <Divider style={{ backgroundColor: elementSecondaryColor }} />
            <View style={styles.sectionWrapper}>
              <LargeText style={[styles.sectionTitle, { color: elementTextColor }]}>{t("fooddetails_description")}</LargeText>
              <NormalText style={[styles.sectionText, { color: elementTextColor }]}>
                {isDescriptionExpanded ? recallDesc : truncatedDesc}
              </NormalText>
              {recallDesc.length > 100 && (
                <Touchable onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                  <NormalText style={[styles.toggleText, { color: elementSecondaryColor }]}>
                    {isDescriptionExpanded ? "Show Less" : "Show More"}
                  </NormalText>
                </Touchable>
              )}
            </View>
          </>
        )}

        <Divider style={{ backgroundColor: elementSecondaryColor }} />

        {/* Ingredients info (shown always) */}
        <View style={styles.sectionWrapper}>
          <LargeText style={[styles.sectionTitle, { color: elementTextColor }]}>{t("fooddetails_ingredients")}</LargeText>
          {ingredientsToShow.map((ing, idx) => (
            <NormalText key={idx} style={[styles.bulletText, { color: elementTextColor }]}>• {ing}</NormalText>
          ))}
          {ingredients.length > INGREDIENTS_PREVIEW_COUNT && (
            <Touchable onPress={() => setIsIngredientsExpanded(!isIngredientsExpanded)}>
              <NormalText style={[styles.toggleText, { color: elementSecondaryColor }]}>
                {isIngredientsExpanded ? "Show Less" : "Show More"}
              </NormalText>
            </Touchable>
          )}
        </View>
      </Card>
    </PageView>
  );
}

// Styles
const styles = StyleSheet.create({
  page: { flex: 1 },
  pageContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: basePadding * 0.2,
  },
  saveIcon: {
    position: "absolute",
    top: basePadding,
    left: basePadding,
    zIndex: 10,
    padding: basePadding * 0.5,
  },
  header: { marginTop: basePadding * 3, alignItems: "center" },
  imageContainer: {
    width: basePadding * 3.2,
    height: basePadding * 3.2,
    justifyContent: "center",
    alignItems: "center",
  },
  imageScale: { transform: [{ scale: 2 }] },
  nameContainer: { marginTop: basePadding * 0.3, alignItems: "center" },
  productName: { fontWeight: "bold", fontSize: baseFontSize * 1.2, paddingTop: basePadding * 3 },
  brandName: { fontSize: baseFontSize },
  statusCard: {
    alignItems: "center",
    borderRadius: 12,
    padding: basePadding * 0.5,
    marginTop: basePadding,
    marginBottom: basePadding * 0.4,
  },
  infoCard: {
    borderRadius: 12,
    marginTop: basePadding,
    marginBottom: basePadding * 0.5,
    width: "100%",
  },
  sectionWrapper: {
    paddingVertical: basePadding * 1,
    paddingHorizontal: basePadding * 0.75,
  },
  sectionTitle: {
    fontWeight: "bold"
  },
  sectionText: {
    marginTop: basePadding * 0.3,
  },
  bulletText: {
    marginTop: basePadding * 0.3,
  },
  toggleText: {
    marginTop: basePadding * 0.3,
  },
});