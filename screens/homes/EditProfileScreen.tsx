// Import necessary libraries and hooks
import React, { useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-expo";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles, { get_theme_color } from "styles/main_styles";
import { FTextInput, NormalText, TextButton } from "~/components/generic";
import { Text } from "react-native";
import { t } from "~/utility/utility";
import Icon from "react-native-vector-icons/FontAwesome";
import { useTheme } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import Feather from "react-native-vector-icons/Feather";
import BottomNav from "~/components/BottomNav";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
<<<<<<< HEAD
=======
import { Alert } from "react-native";
>>>>>>> 582fd58f4414bad26358e8f0b8f6a9cc02bc470b

// Main component for editing user profile
export default function ProfileEditScreen({ navigation }: { navigation: any }) {
  const theme = useTheme();
  // Theme-based dynamic colors
  const isDarkTheme = theme.dark;
  const backgroundColor = isDarkTheme ? "#024B6D" : "#B6E8FF";
  const textColor = isDarkTheme ? "#B6E8FF" : "#024B6D";
  const inputBgColor = isDarkTheme ? "#2C2C2E" : "#F5F5F5";

  // Get screen dimensions for responsive layout scaling
  const { width, height } = Dimensions.get("window");
  const baseFontSize = width > 400 ? 18 : 16;
  const basePadding = width > 400 ? 24 : 16;

  const { user } = useUser();
  const { signOut } = useAuth();

  // Default values pulled from user profile
  const defaultProfilePic = user?.imageUrl || "";
  const defaultName = user?.firstName || "";
  const defaultEmail = user?.emailAddresses?.[0]?.emailAddress || "";

  // Local state for editable fields and modal
  const [profilePic, setProfilePic] = useState(defaultProfilePic);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [newClerkPassword, setNewClerkPassword] = useState("");
  const [newClerkPasswordConfirm, setNewClerkPasswordConfirm] = useState("");
  const [currentClerkPassword, setCurrentClerkPassword] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);

  // Error states for form validation
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isNameValid, setIsNameValid] = useState(true);

  // Regex-based validation for name (only letters and spaces)
  const validateName = (name: string) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name);
  };

  // Regex-based validation for email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
  };

  // Password should be strong: 8+ chars, number, special char
  const validatePassword = (password: string): boolean => {
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  // Show/hide logout modal
  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  // Trigger image picker to change profile picture
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access media library is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  // Modal for logout, delete, and close
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

  // Validate all inputs and attempt to update user profile
<<<<<<< HEAD
  const handleUpdateProfile = async () => {
    let hasError = false;

    if (name.trim() === "") {
=======
  // console.log("Update button pressed");
  const handleUpdateProfile = async () => {
    let hasError = false;

    if (!name.trim()) {
>>>>>>> 582fd58f4414bad26358e8f0b8f6a9cc02bc470b
      setNameError("Name cannot be empty.");
      setIsNameValid(false);
      hasError = true;
    } else if (!validateName(name)) {
      setNameError("Name can only contain letters and spaces.");
      setIsNameValid(false);
      hasError = true;
    } else {
      setNameError(null);
      setIsNameValid(true);
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (newClerkPassword && !validatePassword(newClerkPassword)) {
      setPasswordError("Password must be at least 8 characters, include a number, and a special character.");
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (newClerkPassword !== newClerkPasswordConfirm) {
      setConfirmPasswordError("Passwords do not match.");
      hasError = true;
    } else {
      setConfirmPasswordError(null);
    }

<<<<<<< HEAD
    if (hasError) return;

    try {
      await user?.update({
        firstName: name,
        primaryEmailAddressId: user?.primaryEmailAddressId || undefined,
      });

      if (profilePic) {
        await user?.setProfileImage({ file: profilePic });
=======
    if (hasError || !user) return;

    try {
      if (name !== user.firstName) {
        await user.update({ firstName: name });
      }

      if (profilePic && profilePic !== user.imageUrl) {
        const response = await fetch(profilePic);
        const blob = await response.blob();
        await user.setProfileImage({ file: blob });
>>>>>>> 582fd58f4414bad26358e8f0b8f6a9cc02bc470b
      }

      if (newClerkPassword && newClerkPassword === newClerkPasswordConfirm) {
        await user.updatePassword({
          currentPassword: currentClerkPassword,
          newPassword: newClerkPassword,
          signOutOfOtherSessions: true,
        });
      }

<<<<<<< HEAD
=======
      Alert.alert("Success", "Profile updated successfully!");
>>>>>>> 582fd58f4414bad26358e8f0b8f6a9cc02bc470b
      navigation.navigate("ProfileScreen");
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
      Alert.alert("Update Failed", error.message || "Something went wrong.");
    }
  };

<<<<<<< HEAD
=======



>>>>>>> 582fd58f4414bad26358e8f0b8f6a9cc02bc470b
  // Format last updated date
  const formattedDate = user?.updatedAt
    ? new Date(user.updatedAt).toLocaleDateString()
    : "No date set";

  // Delete account function
  const handleDeleteAccount = async () => {
    try {
      await user?.delete();
      navigation.navigate("LoginNavigator");
    } catch (error) {
      console.log("Error deleting account:", error);
    }
  };

  // Sign out function
  const handleSignOut = async () => {
    try {
      navigation.navigate("LoginNavigator");
      await signOut();
    } catch (error) {
      console.log("Error signing out:", error);
    }
  };

  // Navigation back handler
  const goBack = (): void => {
    navigation.goBack();
  };

  // ##todoss

  // Local styles (could be moved to a separate file)
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
      fontSize: 16,
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
      paddingHorizontal: basePadding,
      paddingVertical: basePadding * 0.75,
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
      marginBottom: basePadding * 0.5,
      fontWeight: "500",
    },
    Container: {
      flex: 1,
    },
  });

  // Return the JSX layout
  return (
    <SafeAreaView
      style={[
        styles.Page,
        { backgroundColor: get_theme_color(theme, "primaryContainer") },
      ]}
    >
      {/* Responsive keyboard handling */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header with back button and title */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={textColor} />
          </TouchableOpacity>
<<<<<<< HEAD
          <Text style={styles.headerTitle}>Profile</Text>
=======
          <Text style={styles.headerTitle}>Edit Profile</Text>
>>>>>>> 582fd58f4414bad26358e8f0b8f6a9cc02bc470b
          <View style={{ width: 40 }} />
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

        {/* Scrollable content */}
        <View style={[styles.Container, { backgroundColor }]}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: basePadding * 5,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* --- Profile Image Section --- */}
            <View
              style={{ alignItems: "center", marginBottom: basePadding * 1.25 }}
            >
              <TouchableOpacity onPress={pickImage}>
                <Image
                  source={{
                    uri: profilePic || "https://via.placeholder.com/150",
                  }}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    borderWidth: 3,
                    borderColor: get_theme_color(theme, "primary"),
                  }}
                />
                {/* Pencil icon over profile picture to indicate edit */}
                <Icon
                  name="pencil"
                  size={24}
                  color={get_theme_color(theme, "primary")}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    backgroundColor: "white",
                    borderRadius: 12,
                    padding: basePadding * 0.25,
                  }}
                />
              </TouchableOpacity>
            </View>

            {/* --- Input Fields Section --- */}
            <View style={{ paddingHorizontal: basePadding * 1.25 }}>
              {/* Name input with real-time validation */}
              <FTextInput
                label={t("profile_name", { defaultValue: "Name" })}
                value={name}
                style={{
                  color: get_theme_color(theme, "onBackground"),
                  backgroundColor: inputBgColor,
                }}
                onChangeText={(text) => {
<<<<<<< HEAD
                  setName(text);
                  const isValid = validateName(text);
                  setIsNameValid(isValid);
                  if (!isValid) {
                    setNameError("Name can only contain letters and spaces.");
                  } else {
                    setNameError(null);
                  }
                }}
              />
              {/* Display name error if invalid */}
              {!isNameValid && nameError && (
=======
                  console.log("Name changed to:", text);
                  setName(text);
                  const isValid = validateName(text);
                  setIsNameValid(isValid);
                  setNameError(isValid ? null : "Name can only contain letters and spaces.");
                }}
              />
              {nameError && !isNameValid && (
>>>>>>> 582fd58f4414bad26358e8f0b8f6a9cc02bc470b
                <Text style={{ color: "red", marginTop: basePadding * 0.3125 }}>
                  {nameError}
                </Text>
              )}

<<<<<<< HEAD
              {/* Email input with basic validation */}
=======
              {/* Email input */}
>>>>>>> 582fd58f4414bad26358e8f0b8f6a9cc02bc470b
              <FTextInput
                label="Email"
                value={email}
                style={{
                  color: get_theme_color(theme, "onBackground"),
                  backgroundColor: inputBgColor,
                }}
                onChangeText={(text) => {
<<<<<<< HEAD
                  setEmail(text);
                  setEmailError(null); // Clear previous error
                }}
              />
              {emailError && (
                <Text
                  style={{ color: "red", marginBottom: basePadding * 0.625 }}
                >
=======
                  console.log("Email changed to:", text);
                  setEmail(text);
                  setEmailError(null);
                }}
              />
              {emailError && (
                <Text style={{ color: "red", marginBottom: basePadding * 0.625 }}>
>>>>>>> 582fd58f4414bad26358e8f0b8f6a9cc02bc470b
                  {emailError}
                </Text>
              )}

              {/* --- Password Reset Section --- */}
              <Text
                style={{
                  marginTop: basePadding * 1.875,
                  marginBottom: basePadding * 0.625,
                  fontSize: baseFontSize * 1.125,
                  fontWeight: "bold",
<<<<<<< HEAD
                  color: get_theme_color(theme, "onBackground")
=======
                  color: get_theme_color(theme, "onBackground"),
>>>>>>> 582fd58f4414bad26358e8f0b8f6a9cc02bc470b
                }}
              >
                Reset Password
              </Text>

              {/* New password input */}
              <FTextInput
                label="New Password"
                value={newClerkPassword}
                style={{
                  color: get_theme_color(theme, "onBackground"),
                  backgroundColor: inputBgColor,
                }}
                onChangeText={(text) => {
<<<<<<< HEAD
                  setNewClerkPassword(text);
                  setPasswordError(null);
                }}
                secureTextEntry={true}
              />
              {passwordError && (
                <Text
                  style={{ color: "red", marginBottom: basePadding * 0.625 }}
                >
=======
                  console.log("New Password changed to:", text);
                  setNewClerkPassword(text);
                  setPasswordError(null);
                }}
                secureTextEntry
              />
              {passwordError && (
                <Text style={{ color: "red", marginBottom: basePadding * 0.625 }}>
>>>>>>> 582fd58f4414bad26358e8f0b8f6a9cc02bc470b
                  {passwordError}
                </Text>
              )}

              {/* Confirm password input */}
              <FTextInput
                label="Confirm New Password"
                value={newClerkPasswordConfirm}
                style={{
                  color: get_theme_color(theme, "onBackground"),
                  backgroundColor: inputBgColor,
                }}
                onChangeText={(text) => {
<<<<<<< HEAD
                  setNewClerkPasswordConfirm(text);
                  setConfirmPasswordError(null);
                }}
                secureTextEntry={true}
              />
              {confirmPasswordError && (
                <Text
                  style={{ color: "red", marginBottom: basePadding * 0.625 }}
                >
=======
                  console.log("Confirm Password changed to:", text);
                  setNewClerkPasswordConfirm(text);
                  setConfirmPasswordError(null);
                }}
                secureTextEntry
              />
              {confirmPasswordError && (
                <Text style={{ color: "red", marginBottom: basePadding * 0.625 }}>
>>>>>>> 582fd58f4414bad26358e8f0b8f6a9cc02bc470b
                  {confirmPasswordError}
                </Text>
              )}
            </View>

<<<<<<< HEAD
=======

>>>>>>> 582fd58f4414bad26358e8f0b8f6a9cc02bc470b
            {/* --- Metadata & Last Updated --- */}
            <View
              style={{
                marginTop: basePadding * 0.625,
                marginBottom: basePadding * 1.25,
                alignSelf: "center",
                alignItems: "center",
              }}
            >
              {/* Can be used to show email confirmation text */}
              <NormalText
                style={{
                  color: get_theme_color(theme, "onBackground"),
                }}
              ></NormalText>
              {/* Display last updated date */}
              <NormalText>
                {t("profile_lastupdated", { date: formattedDate })}
              </NormalText>
            </View>

            {/* --- Submit Button --- */}
            <View
              style={{
                flexDirection: "row",
                marginTop: basePadding * 1.25,
                alignSelf: "center",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <TextButton onPress={handleUpdateProfile}>
                {t("profile_updateprofile", { defaultValue: "Update Profile" })}
              </TextButton>
            </View>
          </ScrollView>
        </View>

        <SettingsModal />
      </KeyboardAvoidingView>
      <BottomNav />
    </SafeAreaView>
  );
}
