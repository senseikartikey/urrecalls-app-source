import React, { JSX, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  View,
  StyleSheet,
  StatusBar,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme, Text as PaperText, TextInput, MD3Theme, ActivityIndicator } from 'react-native-paper';
import { does_saved_product_match_item, getAllProducts, toggleSaveStatus } from "~/store";
import { NormalText, Touchable } from "~/components/generic";
// Imports necessary for the Gestures and Swipes
import {
  FlatList,
  RefreshControl,
  Swipeable
} from "react-native-gesture-handler";
// Imports wrt Sifter and utilities
import {
  SifterSearch,
  get_recall_status,
  get_sifter_token,
  ProductRecallInfos,
  drug_search,
} from "~/network/network_request";
import { error, global, info, log, t } from "~/utility/utility";
// Imports for Navigation
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList } from '~/navigators/main_navigator';
// Imports for Style and Theme Variables
import mainStyles, { get_theme_color } from 'styles/main_styles';
import { MaterialCommunityIcons } from "@expo/vector-icons";
// Importing SearchScreen Component
import { SearchScreen } from '../search';
import FoodIcon, { foodToUrl } from "../food/FoodIcon";

// Type definition for screen navigation
export type ProductScreenProps = StackNavigationProp<
  MainTabParamList,
  'Search'
>;

// Device dimension constants for responsive design
const { height, width } = Dimensions.get("window");
const baseFontSize = width > 400 ? 18 : 16;
const basePadding = width > 400 ? 24 : 16;

// Adding Types for Product and Recall Info via Search
type ProductInfo = {
  id: number;
  name: string;
  upc: string;
  primary_image: { image_path: string };
  [key: string]: any;
};

type RecallData = {
  recall_number: string;
  reason_for_recall: string;
  [key: string]: any;
};

type FoodSearchResultType = {
  type: "food";
  product_info: ProductInfo;
  recall_data?: RecallData[];
};

type DrugSearchResultType = {
  type: "drug";
  recall_data: RecallData;
};
type SearchResultType = FoodSearchResultType | DrugSearchResultType;

type FlatListItemProps = {
  item: any;
  index: number;
  separators: {
    highlight: () => void;
    unhighlight: () => void;
    updateProps: (select: "leading" | "trailing", newProps: any) => void;
  };
};


// Function to define Swipeable Actions
function FlatListSwipeAction(
  theme: MD3Theme,
  isSaveAction: boolean,
  progress: Animated.AnimatedInterpolation<string | number>,
) {
  const backgroundColor = progress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [
      get_theme_color(theme, "surfaceVariant"),
      isSaveAction
        ? get_theme_color(theme, "secondaryContainer")
        : get_theme_color(theme, "errorContainer"),
      isSaveAction
        ? get_theme_color(theme, "primary")
        : get_theme_color(theme, "error"),
    ],
    extrapolate: "clamp",
  });

  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 1.2],
    extrapolate: "clamp",
  });

  const iconName = isSaveAction ? "bookmark-plus" : "bookmark-remove";
  const label = isSaveAction ? "Save" : "Unsave";

  return (
    <Animated.View style={[
      styles.swipeContainer,
      { backgroundColor: backgroundColor },
      { alignItems: isSaveAction ? "flex-start" : "flex-end", paddingHorizontal: 20 },
    ]}>
      <Animated.View style={{ transform: [{ scale }], alignItems: "center" }}>
        <MaterialCommunityIcons name={iconName} size={baseFontSize * 2} color={get_theme_color(theme, "onPrimary")} />
        <NormalText style={{ color: get_theme_color(theme, "onPrimary"), fontWeight: "bold", fontSize: baseFontSize }}>
          {label}
        </NormalText>
      </Animated.View>
    </Animated.View>
  );
}


const ProductScreen = () => {
  // Theme-based styling
  const theme = useTheme();
  const isDarkTheme = theme.dark;
  const primaryTextColor = isDarkTheme ? "#B6E8FF" : "#024B6D";
  const elementTextColor = isDarkTheme ? "#024B6D" : "#B6E8FF";
  const secondaryTextColor = isDarkTheme ? "#FFFFFF" : "#000000";

  // Navigation and focus hooks
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  // Defining State, Ref variables
  const [mode, setMode] = useState<"food" | "drug">("food");
  const [results, setResults] = useState<any[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [canPaginate, setCanPaginate] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [prevQuery, setPrevQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [flatlistUpdate, setFlatlistUpdate] = useState(false);
  const [hasToken, setHasToken] = useState(global.token != undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const searchScreenRef = useRef<any>(null);
  const swipeableRef = useRef<any[]>([]);
  const savedProducts = useRef<any[]>([]);

  // Function fetches all the saved products
  function getAllData() {
    getAllProducts(false, { type: mode, status: null }, 1, true)
      .then((data) => {
        savedProducts.current = [...data];
        setFlatlistUpdate((prev) => !prev);
        log(`Saved ${mode} products`, savedProducts.current);
      })
      .catch((e) => {
        error(e);
      });
  }

  // Function to check if Product is already saved or not
  function savedProductHasItem(item: any): boolean {
    if (!savedProducts?.current?.length) return false;
    return savedProducts.current.some(savedItem =>
      does_saved_product_match_item(savedItem, mode, item)
    ) ?? false;
  }

  // Function to Navigate to Product Details Screen
  function navigateToProductDetails(productInfo: any, recallData: any) {
    if (mode === "food") {
      if (!productInfo && !recallData) {
        log("Trying to navigate with invalid data.");
        return;
      }
      if (!recallData || recallData.length === 0) {
        log("Recall data hasn't been fetched yet, so try another fetch for just this data.");
        get_recall_status([{ name: productInfo.name, upc: productInfo.upc }])
          .then((data) => {
            if (data == undefined) throw new Error("Recall Status is undefined");
            if (data.length != 1) throw new Error("Recall data length does not match Product Info length.");

            let fetchedRecallData = Array.isArray(data[0]) ? [...data[0]] : [];
            log("Fetched recall data:", fetchedRecallData);

            navigation.navigate("FoodDetails", {
              Pinfo: productInfo,
              recallData: fetchedRecallData,
            });
          })
          .catch((e) => {
            error(e);
          });
      }
      else {
        const cleanRecallData = Array.isArray(recallData) ? recallData.filter(r => r && Object.keys(r).length > 0) : [];
        navigation.navigate("FoodDetails", { Pinfo: productInfo, recallData: cleanRecallData });
      }
    }
    else if (mode === "drug") {
      if (!recallData || recallData.length === 0) {
        log("Recall data not found. Trying to fetch recall status...");
        return;
      }
      navigation.navigate("DrugDetails", {
        recallData
      });
    }
  }

  // Function to Search for Products
  function searchForProduct(searchQuery: string, pageNumber: number) {
    if (searchQuery.trim() === "") {
      return;
    }
    if (mode === "food") {
      if (pageNumber === 1) {
        setCanPaginate(true);
      }
      get_sifter_token();
      (searchScreenRef.current as any)?.search_start();
      SifterSearch(searchQuery, "query", pageNumber)
        .then((results) => {
          return {
            Pinfos: results.Pinfo,
            Type: results.Type,
            Query: searchQuery,
          };
        })
        .then((searchResults) => {
          (searchScreenRef.current as any)?.search_end();
          log("Sifter Solutions data:", searchResults.Pinfos);

          if (searchResults.Pinfos.length === 0) {
            if (pageNumber === 1) {
              setResults([]);
              (searchScreenRef.current as any)?.search_no_results();
            } else {
              setCanPaginate(false);
            }
            return;
          }

          let originalResults: SearchResultType[] = [...results];

          // Initial raw results (without recall)
          let resultsArray: SearchResultType[] = searchResults.Pinfos.map((info: any) => ({
            product_info: info,
          }));

          // Set early if no recall fetch is needed
          if (pageNumber === 1) setResults([...resultsArray]);
          else setResults([...originalResults, ...resultsArray]);

          // Build recall fetch payload
          const recallStatuses: ProductRecallInfos[] = searchResults.Pinfos.map((info: any) => ({
            name: info.name,
            upc: info.upc,
          }));

          log("Recall status:", recallStatuses);

          get_recall_status(recallStatuses)
            .then((data) => {
              if (!data) throw new Error("Recall Status undefined!");
              if (data.length !== searchResults.Pinfos.length) {
                throw new Error("Recall Status data length does not match product length!");
              }

              // Attach recall data to each product
              for (let i = 0; i < data.length; i++) {
                resultsArray[i].recall_data = data[i] || [];
              }

              info("Sifter and FDA Results: ", resultsArray);

              // Combine current + new results
              let combinedResults: SearchResultType[] = pageNumber === 1
                ? [...resultsArray]
                : [...originalResults, ...resultsArray];

              // Sort: recalled items first
              combinedResults.sort((a, b) => {
                const aRecalled = a.recall_data && a.recall_data.length > 0;
                const bRecalled = b.recall_data && b.recall_data.length > 0;
                return (bRecalled ? 1 : 0) - (aRecalled ? 1 : 0); // descending
              });

              setResults(combinedResults);
            })
            .catch((e) => {
              error(e, "Failed to fetch recall data.");
            });
          log(searchResults);
          (searchScreenRef.current as any)?.search_success();
          setRefreshing(false);
          setIsPaginating(false);
        })
        .catch((e) => {
          (searchScreenRef.current as any)?.search_end();
          setRefreshing(false);
          setIsPaginating(false);
          error(e);
          alert("Failed to fetch product data.");
        });

    } else if (mode === "drug") {
      (searchScreenRef.current as any)?.search_start();
      drug_search(searchQuery)
        .then((drugResults) => {
          (searchScreenRef.current as any)?.search_end();
          if (drugResults.length === 0) {
            setResults([]);
            (searchScreenRef.current as any)?.search_no_results();
            log("No results found.");
            return;
          } else {
            setResults(drugResults);
            (searchScreenRef.current as any)?.search_end();
            (searchScreenRef.current as any)?.search_success();
            log(drugResults);
          }
        })
        .catch((e) => {
          (searchScreenRef.current as any)?.search_end();
          error(e);
          alert("Failed to fetch product data.");
        });
    }
  }

  // Function will trigger when user swipes left
  function onProductSwipeLeft(index: number, item: any) {
    swipeableRef.current[index]?.close();
    const isSaved = savedProductHasItem(item);
    // Swiping left should save the product
    if (!isSaved) {
      toggleSaveStatus(false, mode, item)
        .then((success) => {
          if (!success) throw new Error("Failed to update product.");
          getAllData();
        })
        .catch((e) => {
          error(e);
          getAllData();
        });
    }
    else {
      log("Product is already saved.");
    }
  }

  // Function will trigger when user swipes right
  function onProductSwipeRight(index: number, item: any) {
    swipeableRef.current[index]?.close();
    const isSaved = savedProductHasItem(item);
    // Swiping right should unsave the product
    if (isSaved) {
      toggleSaveStatus(true, mode, item)
        .then(() => getAllData())
        .catch((e) => {
          error(e);
          getAllData();
        });
    }
    else {
      log("Product is not saved.");
    }
  }


  // Function for FlatList Item
  // This function will be called for each item in the FlatList and will render the item
  function FlatListItem(props: FlatListItemProps): JSX.Element {
    const productInfo = props.item?.product_info ?? null;
    const recallData = props.item.recall_data;

    const imageUrl = mode === "food" && productInfo?.primary_image ? foodToUrl(productInfo.primary_image.image_path) : null;

    return (
      <Swipeable
      ref={(ref) => { swipeableRef.current[props.index] = ref }}
        leftThreshold={2 * basePadding}
        rightThreshold={2 * basePadding}
        overshootLeft={false}
        overshootRight={false}
        onSwipeableLeftOpen={() => onProductSwipeLeft(props.index, productInfo)}
        onSwipeableRightOpen={() => onProductSwipeRight(props.index, productInfo)}
        renderLeftActions={(progress) => FlatListSwipeAction(theme, true, progress)}
        renderRightActions={(progress) => FlatListSwipeAction(theme, false, progress)}
      >
        {/* FlatList Item View */}
        <View style={{ backgroundColor: get_theme_color(theme, "background") }}>
          <Touchable
            onPress={() => {
              if (mode === "food") {
                navigateToProductDetails(productInfo, recallData);
              } else if (mode === "drug") {
                navigateToProductDetails(null, props.item);
              }
            }}
          >
            <View style={{ flexDirection: "row", paddingVertical: 0.5 * basePadding }}>
              {/* Left Section - Icon or Image */}
              <View style={{
                flexDirection: "column",
                alignSelf: "stretch",
                justifyContent: "center",
              }}>
                {mode === "food" ? (
                  <FoodIcon url={imageUrl ?? ""} />
                ) : (
                  <MaterialCommunityIcons
                    name={"pill"}
                    color={get_theme_color(theme, "onBackground")}
                    size={baseFontSize * 3}
                    style={{
                      width: 4 * basePadding,
                      height: 4 * basePadding,
                      aspectRatio: 1,
                      borderRadius: basePadding,
                    }}
                  />
                )}
              </View>

              {/* Right Section - Text */}
              <View style={{ flex: 1, marginLeft: basePadding }}>
                {mode === "food" ? (
                  <>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                      {recallData !== undefined ? (
                        <NormalText
                          style={{
                            fontWeight: "bold",
                            color: get_theme_color(
                              theme,
                              recallData.length === 0
                                ? "onSecondaryContainer"
                                : "onErrorContainer"
                            ),
                          }}
                        >
                          {t(
                            recallData.length === 0
                              ? "notrecalled"
                              : "recalled"
                          )}
                        </NormalText>
                      ) : (
                        <ActivityIndicator size="small" />
                      )}
                    </View>
                    <NormalText numberOfLines={2} style={mainStyles.bold}>
                      {productInfo?.name ?? "Unnamed Product"}
                    </NormalText>
                  </>
                ) : (
                  <NormalText numberOfLines={2} style={mainStyles.bold}>
                    {props.item.product_description ?? "Unnamed Drug"}
                  </NormalText>
                )}
              </View>
            </View>
          </Touchable>
        </View>
      </Swipeable>
    );
  }

  // Effect to handle navigation focus
  useEffect(() => {
    if (mode === "food") {
      if (!hasToken) {
        get_sifter_token()
          .then((success) => {
            setHasToken(success);
            searchForProduct(prevQuery, 1);
          })
          .catch((e) => {
            error(e, "Failed to fetch Sifter token.");
            setHasToken(false);
          });
      }
    }
    // Prevent ActivityIndicator from showing up when mode is drug
    else if (mode === "drug") {
      setHasToken(true);
    }
    getAllData();
  }, [mode]);

  //  When focused, needs to get the latest data.
  useEffect(() => {
    if (navigation.isFocused()) {
      console.log("Screen refocused. Refreshing saved products...", savedProducts);
      getAllData();
    }
  }, [isFocused]);

  // Render ActivityIndicator if no token is available
  if (!hasToken) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={primaryTextColor} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: get_theme_color(theme, "background") }]}>

        {/* Header Section */}
        <View style={styles.pageHeading}>
          <PaperText variant="titleMedium" style={[styles.headingText, { color: secondaryTextColor }]}>
            In doubt? Search is one click away!
          </PaperText>
        </View>

        {/* Body Section */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            {/* Toggle Section */}
            <View style={styles.toggleContainer}>
              {["food", "drug"].map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    setMode(m as "food" | "drug");
                    setResults([]);
                    setPrevQuery("");
                    setSearchQuery("");
                  }}
                  style={[
                    styles.toggleButton,
                    {
                      backgroundColor: mode === m ? primaryTextColor : "transparent",
                      borderColor: primaryTextColor,
                    },
                  ]}
                >
                  <PaperText style={{ color: mode === m ? elementTextColor : primaryTextColor, fontWeight: "bold" }}>
                    {m === "food" ? "FOOD" : "DRUG"}
                  </PaperText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search Section */}
            <View style={{ width: width, flex: 1, marginTop: -10, zIndex: -1 }}>
              <SearchScreen
                // onSearchQueryChange={(text: string) => setSearchQuery(text)}
                ref={searchScreenRef}
                search_text={`What ${mode} product's got you curious?`}
                search_label={`Search Products`}
                search_try_start_callback={(searchQuery: string) => {
                  setPageNumber(1);
                  setRefreshing(true);
                  setPrevQuery(searchQuery);
                  searchForProduct(searchQuery, 1);
                }}
                // search_image={
                //   <View style={{ ...mainStyles.h_centered_container }}>
                //     <Image
                //       source={require("assets/inspi_search-prod.png")}
                //       style={{ ...search_styles.Image }}
                //     />
                //   </View>
                // }
                search_input_right={
                  <TextInput.Icon
                    icon={'close-circle'}
                    onPress={() => {
                      setResults([]);
                      setPageNumber(1);
                      setCanPaginate(true);
                      setRefreshing(false);
                      setSearchQuery("");
                      setPrevQuery("");
                    }}
                  />
                }
                data_list={results.length !== 0 && (
                  <FlatList
                    data={results}
                    extraData={[flatlistUpdate]}
                    renderItem={FlatListItem}
                    keyExtractor={(item, index) =>
                      (item.product_info?.id?.toString()) ??
                      (item.recall_data?.recall_number?.toString()) ??
                      index.toString()
                    }
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                          setRefreshing(true);
                          searchForProduct(prevQuery, 1);
                        }}
                      />
                    }
                    onEndReached={() => {
                      if (isPaginating || !canPaginate) return;
                      setIsPaginating(true);
                      searchForProduct(prevQuery, pageNumber + 1);
                      setPageNumber((prev) => prev + 1);
                    }}
                    onEndReachedThreshold={0.2}
                  />
                )}
              />
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

export default ProductScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: basePadding,
    paddingTop: basePadding * 5,
  },
  pageHeading: {
    alignItems: 'center',
    paddingTop: basePadding,
    marginBottom: basePadding,
  },
  headingText: {
    fontWeight: '600',
    fontSize: baseFontSize,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  toggleButton: {
    paddingHorizontal: basePadding,
    paddingVertical: basePadding / 2.5,
    marginHorizontal: basePadding / 4,
    borderRadius: 8,
    borderWidth: 2,
  },
  swipeContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 1.5 * basePadding,
  }
});