import React from "react";
import { SignedOut } from "@clerk/clerk-expo";
import { createStackNavigator } from "@react-navigation/stack";

// Auth-related Screens
import SignInScreen from "../screens/login/SignInScreen";
import SignUpScreen from "../screens/login/SignUpScreen";
import TermsAndConditions from "../screens/login/TermsConditionsScreen";
import VerifyMailScreen from "../screens/login/VerifyMailScreen";
import ForgotPassword from "../screens/login/ForgotPasswordScreen";

// Navigation param types for LoginNavigator
export type LoginNavigatorParamList = {
  Login: undefined;
  Signup: undefined;
  Terms: { acceptance_callback: (e: void) => void };
  ForgotPassword: undefined;
  VerifyEmail: undefined;
};

const Stack = createStackNavigator<LoginNavigatorParamList>();

/**
 * LoginNavigator
 * - Only rendered when the user is signed out (handled via Clerk's <SignedOut>)
 * - Contains screens for Sign In, Sign Up, T&Cs, and Password Reset
 */
function LoginNavigator() {
  return (
    <SignedOut>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Sign In Screen */}
        <Stack.Screen name="Login" component={SignInScreen} />

        {/* Sign Up Screen */}
        <Stack.Screen name="Signup" component={SignUpScreen} />

        {/* Terms & Conditions Screen (acceptance callback passed via route params) */}
        <Stack.Screen name="Terms" component={TermsAndConditions} />

        {/* Verify Email Screen */}
        <Stack.Screen name="VerifyEmail" component={VerifyMailScreen} />

        {/* Forgot Password Screen (with visible header but empty title) */}
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPassword}
          options={{ headerShown: true, title: "" }}
        />
      </Stack.Navigator>
    </SignedOut>
  );
}

export default LoginNavigator;
