import React from "react";

// Clerk (authentication) imports
import { ClerkLoaded, useSession } from "@clerk/clerk-expo";

// Navigation imports
import { createStackNavigator } from "@react-navigation/stack";
import LoginNavigator from "~/navigators/login_navigator";
import MainNavigator from "~/navigators/main_navigator";

// React Native + UI components
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native-paper";

// Define route param types for stack navigation
export type RootNavigatorParamList = {
  LoginNavigator: undefined;
  MainNavigator: undefined;
};

// Stack navigator instance
const Stack = createStackNavigator<RootNavigatorParamList>();

/**
 * RootNavigator
 * - This is the top-level navigator of the app.
 * - Based on authentication state from Clerk, it determines whether to show the Login flow or the Main app.
 * - Ensures navigation setup is only initialized once Clerk has finished loading.
 */
function RootNavigator() {
  const { isLoaded, session } = useSession();

  // While Clerk is loading, show a centered activity indicator
  if (!isLoaded) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator animating />
      </SafeAreaView>
    );
  }

  // If a session exists, user is signed in → show main app
  // Otherwise, show the login flow
  const initialRouteName = session ? "MainNavigator" : "LoginNavigator";

  return (
    <ClerkLoaded>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="LoginNavigator" component={LoginNavigator} />
        <Stack.Screen name="MainNavigator" component={MainNavigator} />
      </Stack.Navigator>
    </ClerkLoaded>
  );
}

export default RootNavigator;
