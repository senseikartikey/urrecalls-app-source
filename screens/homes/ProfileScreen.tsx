// Core React & React Native imports
import React, { useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-expo"; // Clerk hooks for user data and authentication
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  Text,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // Handles iOS safe area insets
import { get_theme_color } from "styles/main_styles"; // Custom theming utility
import { ScrollView } from "react-native-gesture-handler"; // Better gesture support on ScrollViews
import { NormalText, TextButton } from "~/components/generic"; // Reusable custom text/button components
import { t } from "~/utility/utility"; // i18n or other utility functions
import Icon from "react-native-vector-icons/FontAwesome"; // Cog icon for settings
import { useTheme } from "react-native-paper"; // Theme context from Paper
import Feather from "react-native-vector-icons/Feather"; // Back arrow icon
import BottomNav from "~/components/BottomNav"; // Persistent bottom nav bar
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";

// Component: ProfileScreen
export default function ProfileScreen({
  navigation,
}: {
  navigation: any;
  route: any;
}) {
  // Access app-wide theme colors (light/dark)
  const theme = useTheme();
  const isDarkTheme = theme.dark;
  const backgroundColor = isDarkTheme ? "#024B6D" : "#B6E8FF";
  const textColor = isDarkTheme ? "#B6E8FF" : "#024B6D";

  // Get screen dimensions for responsive layout scaling
  const { width, height } = Dimensions.get("window");
  const baseFontSize = width > 400 ? 18 : 16;
  const basePadding = width > 400 ? 24 : 16;


  // Clerk user data and sign-out method
  const { user } = useUser();
  const { signOut } = useAuth();

  // Local state: toggles visibility of settings modal
  const [isModalVisible, setModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  // Format the user's last updated date
  const formattedDate = user?.updatedAt
    ? new Date(user.updatedAt).toLocaleDateString()
    : "No date set";

  // Sign the user out and redirect to LoginNavigator
  const handleSignOut = async () => {
    try {
      navigation.navigate("LoginNavigator");
      await signOut();
    } catch (e) {
      console.log(e);
    }
  };

  // Delete user account and redirect to LoginNavigator
  const handleDeleteAccount = async () => {
    try {
      await user?.delete();
      navigation.navigate("LoginNavigator");
    } catch (e) {
      console.log(e);
    }
  };

  // Go back to previous screen
  const goBack = (): void => {
    navigation.goBack();
  };

  // Modal component containing "Logout", "Delete", and "Close" buttons
  // const SettingsModal = () => (
  //   <Modal
  //     animationType="slide"
  //     transparent={true}
  //     visible={isModalVisible}
  //     onRequestClose={toggleModal}
  //   >
  //     <View
  //       style={{
  //         marginTop: 22,
  //         margin: 20,
  //         backgroundColor: backgroundColor,
  //         borderRadius: 20,
  //         padding: 35,
  //         alignItems: "center",
  //         shadowColor: "#000",
  //         shadowOffset: { width: 0, height: 2 },
  //         shadowOpacity: 0.25,
  //         shadowRadius: 3.84,
  //         elevation: 5,
  //       }}
  //     >
  //       <TextButton
  //         onPress={handleSignOut}
  //         style={{ marginBottom: 20, alignSelf: "center" }}
  //       >
  //         Logout
  //       </TextButton>
  //       <TextButton
  //         onPress={handleDeleteAccount}
  //         style={{
  //           marginBottom: 20,
  //           alignSelf: "center",
  //           backgroundColor: "red",
  //         }}
  //       >
  //         Delete Account
  //       </TextButton>
  //       <TextButton onPress={toggleModal} style={{ alignSelf: "center" }}>
  //         Close
  //       </TextButton>
  //     </View>
  //   </Modal>
  // );

  const SettingsModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={toggleModal}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor }]}>
          <TouchableOpacity
            onPress={handleSignOut}
            style={[styles.modalButton, { backgroundColor: "#f0ad4e" }]}
          >
            <FontAwesome name="sign-out" size={18} color="#fff" style={styles.icon} />
            <Text style={styles.modalButtonText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={[styles.modalButton, { backgroundColor: "#d9534f" }]}
          >
            <MaterialIcons name="delete" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.modalButtonText}>Delete Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleModal}
            style={[styles.modalButton, { backgroundColor: "#5bc0de" }]}
          >
            <MaterialIcons name="close" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );


  // Styles used within the component
  const styles = StyleSheet.create({

    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContainer: {
      width: "80%",
      borderRadius: 16,
      paddingVertical: 30,
      paddingHorizontal: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 6,
    },
    modalButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      marginBottom: 15,
      width: "100%",
      justifyContent: "center",
    },
    icon: {
      marginRight: 10,
    },
    modalButtonText: {
      color: "#fff",
      fontSize: baseFontSize,
      fontWeight: "bold",
    },

    // modalOverlay: {
    //   flex: 1,
    //   justifyContent: "flex-end",
    //   backgroundColor: "rgba(0,0,0,0.4)",
    // },
    // modalContainer: {
    //   borderTopLeftRadius: 20,
    //   borderTopRightRadius: 20,
    //   paddingVertical: 30,
    //   paddingHorizontal: 20,
    //   alignItems: "center",
    //   shadowColor: "#000",
    //   shadowOffset: { width: 0, height: -3 },
    //   shadowOpacity: 0.25,
    //   shadowRadius: 5,
    //   elevation: 6,
    // },
    // modalButton: {
    //   flexDirection: "row",
    //   alignItems: "center",
    //   paddingVertical: 14,
    //   paddingHorizontal: 20,
    //   borderRadius: 10,
    //   marginBottom: 15,
    //   width: "100%",
    //   justifyContent: "center",
    // },
    // icon: {
    //   marginRight: 10,
    // },
    // modalButtonText: {
    //   color: "#fff",
    //   fontSize: 16,
    //   fontWeight: "bold",
    // },

    Page: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 15,
      paddingVertical: 12,
      backgroundColor: get_theme_color(theme, "primaryContainer"),
      borderBottomWidth: 1,
      borderBottomColor: get_theme_color(theme, "primaryContainer"),
      minHeight: 50,
    },
    backButton: {
      padding: 8,
      justifyContent: "center",
      alignItems: "center",
      width: 40,
      height: 40,
    },
    headerTitle: {
      color: textColor,
      fontSize: baseFontSize * 1.25,
      fontWeight: "600",
      textAlign: "center",
    },
    label: {
      color: textColor,
      fontSize: baseFontSize * 0.875,
      marginBottom: 8,
      fontWeight: "500",
    },
    Container: {
      flex: 1,
    },
  });

  return (
    <SafeAreaView
      style={[
        styles.Page,
        { backgroundColor: get_theme_color(theme, "primaryContainer") },
      ]}
    >
      {/* KeyboardAvoidingView ensures keyboard doesn't overlap form elements */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header with back arrow and title */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} /> {/* Placeholder for right alignment */}
        </View>

        {/* Settings icon under header */}
        <View
          style={{
            alignItems: "flex-end",
            paddingHorizontal: basePadding,
            marginTop: basePadding * 0.75,
            backgroundColor: backgroundColor,
          }}
        >
          <TouchableOpacity
            onPress={toggleModal}
            style={{
              backgroundColor: get_theme_color(theme, "primaryContainer"),
              borderRadius: 24,
              padding: basePadding * 0.625,
              marginTop: basePadding * 0.75,
            }}
          >
            <Icon
              name="cog"
              size={22}
              color={get_theme_color(theme, "onPrimaryContainer")}
            />
          </TouchableOpacity>
        </View>

        {/* Scrollable profile content */}
        <View style={[styles.Container, { backgroundColor }]}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          >
            {/* Profile Image */}
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                marginTop: basePadding * 2.5,
              }}
            >
              <Image
                source={{
                  uri: user?.imageUrl || "https://via.placeholder.com/150",
                }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 3,
                  borderColor: get_theme_color(theme, "primary"),
                }}
              />
            </View>

            {/* User Details */}
            <View
              style={{
                marginTop: basePadding * 2.5,
                marginBottom: basePadding * 1.25,
                alignSelf: "center",
                paddingHorizontal: 24,
              }}
            >
              {/* Full Name */}
              <Text
                style={[
                  styles.label,
                  {
                    color: textColor,
                    fontSize: baseFontSize,
                    marginBottom: basePadding * 0.875,
                  },
                ]}
              >
                <Text style={{ fontWeight: "bold" }}>Name: </Text>
                {user?.fullName || "Not Set"}
              </Text>

              {/* Email Address */}
              <Text
                style={[
                  styles.label,
                  {
                    color: textColor,
                    fontSize: baseFontSize,
                    marginBottom: basePadding * 0.875,
                  },
                ]}
              >
                <Text style={{ fontWeight: "bold" }}>Email: </Text>
                {user?.primaryEmailAddress?.emailAddress || "Not Set"}
              </Text>

              {/* Last Updated Date */}
              <Text
                style={[
                  styles.label,
                  {
                    color: textColor,
                    fontSize: baseFontSize,
                  },
                ]}
              >
                <Text style={{ fontWeight: "bold" }}>Last Updated: </Text>
                {formattedDate}
              </Text>
            </View>

            {/* Edit Profile Button */}
            <View
              style={{
                flexDirection: "row",
                marginTop: basePadding * 1.25,
                alignSelf: "center",
              }}
            >
              <TextButton
                onPress={() => navigation.navigate("EditProfileScreen")}
                style={{ marginLeft: basePadding * 0.625 }}
              >
                Edit Profile
              </TextButton>
            </View>
          </ScrollView>
        </View>

        {/* Logout/Delete modal */}
        <SettingsModal />
      </KeyboardAvoidingView>

      {/* Persistent Bottom Navigation Bar */}
      <BottomNav />
    </SafeAreaView>
  );
}
