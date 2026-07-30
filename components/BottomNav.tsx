import React from "react";
import { StyleSheet, View } from "react-native";
import { BottomNavigation } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";

/**
 * BottomNav
 * - Custom bottom navigation bar using React Native Paper's BottomNavigation.
 * - Handles navigation between main app tabs.
 */
const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();

  /**
   * Define the tab items for the bottom navigation bar.
   * Each tab has a key, title, icon, and navigation route.
   */
  const tabs = [
    {
      key: "Home",
      title: "Home",
      icon: ({ color }: { color: string }) => (
        <FontAwesome5 name="home" color={color} size={20} />
      ),
      route: "Home",
    },
    {
      key: "Search",
      title: "Search",
      icon: ({ color }: { color: string }) => (
        <FontAwesome5 name="search" color={color} size={20} />
      ),
      route: "Search",
    },
    {
      key: "Barcode",
      title: "Scan",
      icon: ({ color }: { color: string }) => (
        <FontAwesome5 name="barcode" color={color} size={24} />
      ),
      route: "Barcode",
    },
    {
      key: "History",
      title: "History",
      icon: ({ color }: { color: string }) => (
        <FontAwesome5 name="history" color={color} size={20} />
      ),
      route: "History",
    },
    {
      key: "Report",
      title: "Report",
      icon: ({ color }: { color: string }) => (
        <MaterialCommunityIcons
          name="notebook-edit-outline"
          color={color}
          size={22}
        />
      ),
      route: "ReportIncident",
    },
  ];

  /**
   * Determine the initial selected index based on the current route.
   * If route not matched, default to the first tab.
   */
  const currentIndex = tabs.findIndex((tab) =>
    route.name.toLowerCase().includes(tab.route.toLowerCase())
  );
  const [index, setIndex] = React.useState(
    currentIndex === -1 ? 0 : currentIndex
  );

  /**
   * Update the index and navigate to the corresponding route.
   */
  const handleIndexChange = (newIndex: number) => {
    setIndex(newIndex);
    const selectedTab = tabs[newIndex];
    if (selectedTab) {
      navigation.navigate(selectedTab.route as never);
    }
  };

  return (
    <View style={styles.container}>
      <BottomNavigation.Bar
        navigationState={{ index, routes: tabs }}
        onTabPress={({ route }) => {
          const tabIndex = tabs.findIndex((t) => t.key === route.key);
          handleIndexChange(tabIndex);
        }}
        renderIcon={({ route, color }) => {
          const tab = tabs.find((t) => t.key === route.key);
          return tab?.icon({ color });
        }}
        getLabelText={({ route }) => {
          const tab = tabs.find((t) => t.key === route.key);
          return tab?.title || "";
        }}
        shifting={false}
        labeled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent", // Allows flexibility with themed backgrounds
  },
});

export default BottomNav;
