import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import AppLoading from "expo-app-loading";
import { Swipeable } from "react-native-gesture-handler";
import { NormalText, TextButton, Touchable } from "~/components/generic";
import {
  getAllProducts,
  deleteProductByID,
  SavedItem,
  toggleSaveStatus,
  ProductType,
} from "~/store";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import styles, { em, get_theme_color } from "styles/main_styles";
import {
  Snackbar,
  useTheme,
  ActivityIndicator,
  Menu,
  Modal,
  Portal,
} from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import FoodIcon, { foodToUrl } from "../food/FoodIcon";
import Page from "~/FDAtest";
import { error, t } from "~/utility/utility";
import {
  SifterSearchByID,
  get_recall_status,
  ProductRecallInfos,
} from "~/network/network_request";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Apply DMSerifText as the default font
// Text.defaultProps = Text.defaultProps || {};
// Text.defaultProps.style = { fontFamily: "DMSerifText_400Regular" };

type Item = SavedItem & { recall_status: any[] };

const getLocalStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? "#024B6D" : "#B6E8FF",
      flex: 1,
      paddingHorizontal: em * 0.5,
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: em * 0.5,
      width: "100%",
    },
    headerText: {
      color: isDark ? "#B6E8FF" : "#024B6D",
      fontSize: 36,
      fontWeight: "bold",
      textAlign: "center",
      marginTop: em * 2,
    },
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#B6E8FF" : "#024B6D",
      borderRadius: em * 0.5,
      paddingHorizontal: em * 0.5,
      marginHorizontal: em * 0.8,
      marginVertical: em * 0.5,
      backgroundColor: "transparent",
    },
    searchInput: {
      flex: 1,
      height: 40,
      color: isDark ? "#B6E8FF" : "#024B6D",
      paddingLeft: em * 0.5,
    },
    filterIconContainer: {
      padding: em * 0.5,
    },
    productCard: {
      backgroundColor: isDark ? "#B6E8FF" : "#024B6D",
      borderWidth: 0.5,
      borderColor: isDark ? "#024B6D" : "#B6E8FF",
      borderRadius: 12,
      marginHorizontal: em * 0.3,
      marginVertical: em * 0.3,
      overflow: "hidden",
    },
    productText: {
      color: isDark ? "#024B6D" : "#B6E8FF",
      textAlign: "left",
      fontSize: 16,
    },
  });

export const SavedScreen = () => {
  const theme = useTheme();
  const isDark = theme.dark;
  const dynamicStyles = getLocalStyles(isDark);
  const navigation = useNavigation<any>();

  const [nameFilterVisible, setNameFilterVisible] = useState(false);
  const [typeFilterVisible, setTypeFilterVisible] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  const [data, setData] = useState<Item[]>([]);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [snackBarVisible, setSnackbarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isFocused = useIsFocused();
  const [rerender_list_flag, update_rerender_list_flag] = useState(false);

  useEffect(() => {
    if (isFocused) fetchData();
  }, [isFocused, nameFilter, typeFilter]);

  async function fetchData(filterByName = nameFilter, filterByType = typeFilter) {
    setIsLoading(true);
    try {
      const raw = await getAllProducts(sortDesc, null, 1, true);
      const filteredRaw = raw
        .filter((it: any) => {
          if (!filterByName) return true;
          const txt = filterByName.toLowerCase();
          return it.type === "food"
            ? it.name.toLowerCase().includes(txt)
            : it.description?.toLowerCase().includes(txt);
        })
        .filter((it: any) =>
          filterByType ? it.type.toLowerCase().includes(filterByType) : true
        );

      const built: Item[] = filteredRaw.map((it: any) => ({
        ...it,
        recall_status:
          it.type === "drug"
            ? [it.recallData ?? it]
            : [],
      }));

      const foodUps: ProductRecallInfos[] = await Promise.all(
        built
          .filter((it) => it.type === "food")
          .map(async (it) => {
            const r = await SifterSearchByID(it.id.replace(/f/g, ""));
            return { name: r.Pinfo.name, upc: r.Pinfo.upc };
          })
      );
      const statuses = await get_recall_status(foodUps);

      let idx = 0;
      built.forEach((it) => {
        if (it.type === "food") {
          it.recall_status = statuses[idx].slice(0, -1);
          idx++;
        }
      });

      setData(built);
    } catch (e) {
      error(e as any);
    } finally {
      setIsLoading(false);
      update_rerender_list_flag((f) => !f);
    }
  }

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleDelete = async (it: Item) => {
    await deleteProductByID(it.id);
    setDeleteItem(it);
    setSnackbarVisible(true);
    setData((d) => d.filter((x) => x.id !== it.id));
  };

  const handleUndoDelete = async () => {
    if (!deleteItem) return;
    try {
      const r = await SifterSearchByID(deleteItem.id.replace(/f/g, ""));
      await toggleSaveStatus(false, deleteItem.type as ProductType, r.Pinfo);
      setData((d) => [deleteItem!, ...d]);
      setDeleteItem(null);
    } catch (e) {
      error(e as any);
    }
  };

  const navigate_to = async (it: Item) => {
    if (it.type === "drug") {
      // Reuse stored recall object instead of re-fetching
      const recallObj = it.recall_status[0];
      if (recallObj) {
        navigation.navigate("DrugDetails", { recallData: recallObj });
      } else {
        Alert.alert(
          "No Recall Data",
          "Could not find recall info for this drug."
        );
      }
    } else {
      const r = await SifterSearchByID(it.id.replace(/f/g, ""));
      const p = await Page(r.Pinfo);
      navigation.navigate("FoodDetails", {
        Pinfo: p.Pinfo,
        recallData: it.recall_status,
      });
    }
  };

  const renderRight = (it: Item) => (
    <View style={{ width: 5 * em, justifyContent: "center", alignItems: "center" }}>
      <TouchableOpacity
        onPress={() => handleDelete(it)}
        style={{
          width: 50 * em,
          height: "100%",
          backgroundColor: "red",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#FFF", fontWeight: "bold" }}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: Item }) => (
    <Swipeable friction={2} rightThreshold={60} renderRightActions={() => renderRight(item)}>
      <Touchable onPress={() => navigate_to(item)}>
        <View
          style={[
            dynamicStyles.productCard,
            {
              paddingVertical: 0.75 * em,
              paddingHorizontal: 1 * em,
              flexDirection: "row",
              alignItems: "center",
            },
          ]}
        >
          <View style={{ justifyContent: "center" }}>
            {item.type === "food" && item.image_path ? (
              <FoodIcon url={foodToUrl(item.image_path)} />
            ) : (
              <MaterialCommunityIcons
                name="pill"
                color={get_theme_color(theme, "onBackground")}
                size={em * 3}
              />
            )}
          </View>
          <View style={{ flex: 1, marginLeft: em }}>
            <NormalText
              numberOfLines={2}
              style={[{ fontWeight: "bold" }, dynamicStyles.productText]}
              text={item.type === "food" ? item.name : item.description}
            />
            <NormalText
              style={{
                fontWeight: "bold",
                color: item.recall_status.length === 0 ? "limegreen" : "red",
              }}
            >
              {t(item.recall_status.length === 0 ? "notrecalled" : "recalled")}
            </NormalText>
          </View>
        </View>
      </Touchable>
    </Swipeable>
  );

  const renderEmpty = () => (
    <View style={{ flex: 1, justifyContent: "center", alignSelf: "center" }}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <NormalText style={{ fontWeight: "bold", textAlign: "center" }}>
          {t("no_items_saved")}
        </NormalText>
      )}
    </View>
  );

  // if (!fontsLoaded) return <AppLoading />;

  return (
    <SafeAreaView style={[styles.Page, dynamicStyles.container]}>
      <Portal>
        <Modal
          visible={nameFilterVisible}
          dismissable
          dismissableBackButton
          onDismiss={() => setNameFilterVisible(false)}
        >
          <View
            style={{
              backgroundColor: get_theme_color(theme, "primaryContainer"),
              borderRadius: 20,
              padding: 35,
              maxWidth: "80%",
              alignSelf: "center",
            }}
          >
            <TextInput
              style={{
                marginBottom: 15,
                textAlign: "center",
                color: get_theme_color(theme, "onPrimaryContainer"),
              }}
              onChangeText={setNameFilter}
              onSubmitEditing={() => setNameFilterVisible(false)}
              value={nameFilter}
              placeholder="Enter name to filter"
            />
            <View style={{ flexDirection: "row", paddingLeft: em }}>
              <TextButton
                onPress={() => {
                  setNameFilter("");
                  setNameFilterVisible(false);
                }}
              >
                {t("saved_clear")}
              </TextButton>
            </View>
          </View>
        </Modal>
      </Portal>

      <View style={dynamicStyles.headerContainer}>
        <NormalText style={dynamicStyles.headerText}>Saved Products</NormalText>
      </View>

      <View style={dynamicStyles.searchBarContainer}>
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Search Products..."
          placeholderTextColor={isDark ? "#B6E8FF" : "#024B6D"}
          value={nameFilter}
          onChangeText={setNameFilter}
          returnKeyType="search"
        />
        <Menu
          visible={typeFilterVisible}
          onDismiss={() => setTypeFilterVisible(false)}
          anchor={  
            <TouchableOpacity
              style={dynamicStyles.filterIconContainer}
              onPress={() => setTypeFilterVisible(true)}
            >
              <Icon name="filter" size={em * 2} color={isDark ? "#B6E8FF" : "#024B6D"} />
            </TouchableOpacity>
          }
          contentStyle={{
            backgroundColor: isDark ? "#B6E8FF" : "#024B6D",
            borderRadius: em * 0.5,
          }}
        >
          {["All", "Food", "Drug"].map((opt) => (
            <Menu.Item
              key={opt}
              onPress={() => {
                setTypeFilter(opt === "All" ? "" : opt.toLowerCase());
                setTypeFilterVisible(false);
              }}
              title={opt}
              titleStyle={{ color: get_theme_color(theme, "background") }}
            />
          ))}
        </Menu>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data}
          extraData={rerender_list_flag}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{
            paddingHorizontal: em * 0.5,
            paddingBottom: em * 2,
          }}
        />
      )}

      <Snackbar
        visible={snackBarVisible}
        duration={5000}
        onDismiss={() => setSnackbarVisible(false)}
        action={{ label: "Undo", onPress: handleUndoDelete }}
      >
        {t("saved_undo")}
      </Snackbar>
    </SafeAreaView>
  );
};























