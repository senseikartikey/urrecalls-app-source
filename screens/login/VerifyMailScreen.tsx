import React, { useEffect, useRef, useState } from 'react';
import { useUser } from "@clerk/clerk-expo";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    TextInput,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Text as PaperText, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
//  Imports for Navigation
import { useNavigation } from "@react-navigation/native";
import { LoginNavigatorParamList } from "~/navigators/login_navigator";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useSignUp } from '@clerk/clerk-expo';

// Type definition for screen navigation
export type VerifyEmailScreenProps = StackNavigationProp<LoginNavigatorParamList, "VerifyEmail">;

// Device dimension constants for responsive design
const { height, width } = Dimensions.get("window");
const baseFontSize = width > 400 ? 18 : 16;
const basePadding = width > 400 ? 24 : 16;

const VerifyMailScreen = () => {
    // Use Clerk Functionalities
    const { signUp, setActive } = useSignUp();
    const { user } = useUser();
    // Refs for OTP Input Fields
    const inputRefs = useRef<(TextInput | null)[]>([]);
    // Defining States for Timer and OTP Reset Functionalities
    const [timer, setTimer] = useState(120);
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [resendEnabled, setResendEnabled] = useState(false);
    // Check if all OTP digits are filled
    const isOtpComplete = otp.every((digit) => digit !== ""); 
    
    // Theme-based styling
    const theme = useTheme();
    const isDarkTheme = theme.dark;
    const primaryTextColor = isDarkTheme ? "#B6E8FF" : "#024B6D";
    const elementTextColor = isDarkTheme ? "#024B6D" : "#B6E8FF";
    const secondaryTextColor = isDarkTheme ? "#FFFFFF" : "#000000";
    
    // Navigation instance
    const navigation = useNavigation<VerifyEmailScreenProps>();

    // Countdown Timer
    useEffect(() => {
        if (timer === 0) {
            setResendEnabled(true);
            setOtp(Array(6).fill(''));
            return;
        }
        const interval = setInterval(() => {
            setTimer((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timer]);

    // Function to handle OTP submissions
    const handleSubmitOTP = async () => {
        const code = otp.join("");
        // Check if OTP received is 6 digits or not
        if (code.length < 6 || otp.includes("")) {
            alert("Please enter the full 6-digit code.");
            return;
        }

        try {
            const completeSignUp = await signUp?.attemptEmailAddressVerification({ code });
            // Let clerk re-render SignedIn and load MainNavigator
            await setActive({ session: completeSignUp?.createdSessionId });
        }
        catch (err) {
            // Throw error if OTP is Invalid
            alert("Invalid OTP. Please try again.");
            console.log(err);
        }
    };

    // Resend OTP Handler
    const handleResend = async () => {
        setTimer(120);
        setResendEnabled(false);
        setOtp(Array(6).fill(''));
        inputRefs.current[0]?.focus();

        if (signUp) {
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        }
    };

    // Handle OTP input field changes
    const handleChangeText = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        // Move to next input if filled
        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
        // Move to previous input if cleared
        if (!text && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <SafeAreaView style={{ flex: 1, backgroundColor: elementTextColor }}>
                    <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} />
                    <View style={styles.innerContainer}>
                        <PaperText variant="titleLarge" style={[styles.heading, { color: secondaryTextColor }]}>
                            Verify your Account
                        </PaperText>
                        <PaperText variant="bodyMedium" style={[styles.subtext, { color: primaryTextColor }]}>
                            Please enter the one-time code sent to your email:
                        </PaperText>

                        {/* Display User's Registered Email Address */}
                        <PaperText variant="bodyLarge" style={[styles.emailText, { color: primaryTextColor }]}>
                            {user?.primaryEmailAddress?.emailAddress || "Not Set"}
                        </PaperText>

                        {/* OTP Input Fields */}
                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => (inputRefs.current[index] = ref)}
                                    style={[styles.otpInput, { backgroundColor: primaryTextColor, color: elementTextColor }]}
                                    keyboardType="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChangeText={(text) => handleChangeText(text, index)}
                                />
                            ))}
                        </View>
                        
                        {/* Resend Code ? Timer : Text */}
                        <PaperText style={[styles.timerText, { color: secondaryTextColor }]}>
                            {resendEnabled ? (
                                <TouchableOpacity onPress={handleResend}>
                                    <PaperText style={{ fontWeight: 600, color: primaryTextColor }}>Resend Code</PaperText>
                                </TouchableOpacity>
                            ) : (
                                `Resend code in: ${Math.floor(timer / 60)
                                    .toString()
                                    .padStart(2, '0')}:${(timer % 60).toString().padStart(2, '0')}`
                            )}
                        </PaperText>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: primaryTextColor }]}
                            onPress={handleSubmitOTP}
                            disabled={!isOtpComplete}
                        >
                            <PaperText style={[styles.submitText, { color: elementTextColor }]}>
                                SUBMIT
                            </PaperText>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
};

export default VerifyMailScreen;


// Defining Styles required for VerifyEmail Screen
const styles = StyleSheet.create({
    innerContainer: {
        width: "100%",
        alignItems: "center",
        padding: basePadding
    },
    heading: {
        fontWeight: "bold",
        fontSize: baseFontSize * 1.5,
        marginTop: basePadding * 2,
    },
    subtext: {
        fontSize: baseFontSize - 1,
        marginTop: basePadding,
        textAlign: "center"
    },
    emailText: {
        fontWeight: "bold",
        fontSize: baseFontSize,
        marginVertical: basePadding * 2,
        textAlign: "center"
    },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "80%",
        marginVertical: basePadding,
    },
    otpInput: {
        width: width * 0.1,
        height: height * 0.06,
        borderWidth: 1,
        borderColor: "#A3A3A3",
        borderRadius: 8,
        textAlign: "center",
        fontSize: baseFontSize + 2,
        marginHorizontal: 5
    },
    timerText: {
        fontSize: baseFontSize - 1,
        marginVertical: 12,
    },
    submitButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 16,
        marginTop: 20
    },
    submitText: {
        fontWeight: "bold",
        fontSize: baseFontSize,
    },
});
