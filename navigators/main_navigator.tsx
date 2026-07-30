import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createMaterialBottomTabNavigator } from "react-native-paper/react-navigation";
import { SignedIn } from "@clerk/clerk-expo";
import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

// Utility for translations (if used)
import { t } from "~/utility/utility";

// Screens
import { HomeScreen } from "~/screens/homes/HomeScreen";
import ProductScreen from "~/screens/product/ProductScreen";
import BarcodeScreen from "~/screens/food/Barcode";
import { SavedScreen } from "~/screens/homes/SavedScreen";
import FoodDetails from "~/screens/food/FoodDetails";
import ProfileScreen from "~/screens/homes/ProfileScreen";
import DrugDetails from "~/screens/drug/DrugDetails";
import EditProfileScreen from "~/screens/homes/EditProfileScreen";
import ReportIncidentScreen from "~/screens/report/ReportIncidentScreen";
import MedicalHistoryScreen from "~/screens/report/MedicalHistoryScreen";
import ReviewSubmitScreen from "~/screens/report/ReviewSubmitScreen";

// Types for form state and route parameters
import { ReportFormState, ReviewSubmitRouteParams } from "./types";

// Type definitions for stack and tab navigators
export type MainStackParamList = {
  Home: undefined;
  SearchProduct: undefined;
  Barcode: undefined;
  History: undefined;
  ReportIncident: undefined;
  MedicalHistory: { reportData: ReportFormState };
  ReviewSubmit: ReviewSubmitRouteParams;
  ProfileScreen: undefined;
  EditProfileScreen: undefined;
  FoodDetails: { Pinfo: any; recallData: any };
  DrugDetails: { Pinfo: any; recallData: any };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Barcode: undefined;
  History: undefined;
  Report: undefined;
};

// Navigator instances
const Stack = createStackNavigator<MainStackParamList>();
const Tab = createMaterialBottomTabNavigator<MainTabParamList>();

/**
 * Bottom Tab Navigator — represents the main tabs of the app
 */
function MainStack() {
  return (
    <Tab.Navigator initialRouteName="Home" labeled backBehavior="initialRoute">
      {/* Home Tab */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="home" color={color} size={20} />
          ),
        }}
      />

      {/* Search Tab */}
      <Tab.Screen
        name="Search"
        component={ProductScreen}
        options={{
          tabBarLabel: "Search",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="search" color={color} size={20} />
          ),
        }}
      />

      {/* Barcode Scanner Tab */}
      <Tab.Screen
        name="Barcode"
        component={BarcodeScreen}
        options={{
          tabBarLabel: "Scan",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="barcode" color={color} size={24} />
          ),
        }}
      />

      {/* History Tab */}
      <Tab.Screen
        name="History"
        component={SavedScreen}
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="history" color={color} size={20} />
          ),
        }}
      />

      {/* Report Tab */}
      <Tab.Screen
        name="Report"
        component={ReportIncidentScreen}
        options={{
          tabBarLabel: "Report",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="notebook-edit-outline"
              color={color}
              size={22}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * MainNavigator — wraps the Tab Navigator and all additional screens
 * - Uses React Navigation's StackNavigator
 * - Headers are hidden globally with screenOptions
 * - Only shows if user is authenticated via Clerk (SignedIn)
 */
function MainNavigator() {
  return (
    <SignedIn>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        {/* Main Tab Screens */}
        <Stack.Screen name="Home" component={MainStack} />
        <Stack.Screen name="SearchProduct" component={MainStack} />

        {/* Profile Management */}
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />

        {/* Scanner and Saved History (also available in Tab) */}
        <Stack.Screen name="Barcode" component={BarcodeScreen} />
        <Stack.Screen name="History" component={SavedScreen} />

        {/* Report Flow Screens */}
        <Stack.Screen name="ReportIncident" component={ReportIncidentScreen} />
        <Stack.Screen name="MedicalHistory" component={MedicalHistoryScreen} />
        <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} />

        {/* Details Screens for Food/Drugs */}
        <Stack.Screen name="FoodDetails" component={FoodDetails} />
        <Stack.Screen name="DrugDetails" component={DrugDetails} />
      </Stack.Navigator>
    </SignedIn>
  );
}

export default MainNavigator;
