import React, { useState, useCallback } from "react"; // Added useCallback
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Text,
    Platform,
    Alert,
    TextInput,
    ActivityIndicator,
    // Import StyleProp and TextStyle if used by helpers you keep
    StyleProp,
    TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { COLORS } from "../../../styles/colors"; // Adjust path
import { useAuth } from "@clerk/clerk-expo";
// Ensure necessary types are imported correctly from your types file
import type { RootStackParamList, CombinedFormsData, SubmissionPayload, ReportIncidentState, MedicalHistoryState } from "../../navigators/types"; // Adjust path

type ReviewSubmitNavigationProp = StackNavigationProp<
    RootStackParamList,
    "ReviewSubmit"
>;
type ReviewSubmitRouteProp = RouteProp<RootStackParamList, "ReviewSubmit">;

// --- Helper Components ---
// Review Row Helper
interface ReviewRowProps { label: string; value: string | undefined | null | boolean; }
const ReviewRow: React.FC<ReviewRowProps> = ({ label, value }) => {
    if (value === undefined || value === null || value === '') return null;
    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
    if (displayValue.trim() === '') return null;
    return (<View style={styles.reviewRow}><Text style={styles.reviewLabel}>{label}</Text><Text style={styles.reviewValue}>{displayValue}</Text></View>);
};
// Checkbox Helper
interface CheckboxProps { label: string; checked: boolean; onPress: () => void; style?: object; }
const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onPress, style }) => (
    <TouchableOpacity style={[styles.checkboxTouchable, style]} onPress={onPress} activeOpacity={0.7}>
        <Feather name={checked ? "check-square" : "square"} size={20} color={checked ? COLORS.secondary : COLORS.textLight} style={styles.checkboxIcon} />
        <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
);

// Section Header with Edit Button
interface SectionHeaderProps {
    title: string;
    onEditPress: () => void; // Callback for edit button press
}
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onEditPress }) => (
    <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
            <Feather name="edit-2" size={16} color={COLORS.secondary} />
            <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
    </View>
);
// --- End Helper Components ---


const ReviewSubmitScreen: React.FC = () => {
    const navigation = useNavigation<ReviewSubmitNavigationProp>();
    const route = useRoute<ReviewSubmitRouteProp>();
    const { combinedData } = route.params;
    const { problemAndProductData, patientAndReporterData } = combinedData;

    const { userId, isLoaded } = useAuth(); // Get userId from Clerk hook

    // State for OTP and Submission Flow
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [otpCode, setOtpCode] = useState<string>('');
    const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
    const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
    const [isVerificationLoading, setIsVerificationLoading] = useState<boolean>(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isAttested, setIsAttested] = useState<boolean>(false);

    // Navigation Handlers
    const goBack = () => { navigation.goBack(); };

    // --- Edit Handlers ---
    const handleEditProblemProduct = useCallback(() => {
        navigation.navigate('ReportIncident', { initialData: problemAndProductData });
    }, [navigation, problemAndProductData]);

    const handleEditPatientReporter = useCallback(() => {
        navigation.navigate('MedicalHistory', {
            problemAndProductData: problemAndProductData,
            initialData: patientAndReporterData
        });
    }, [navigation, problemAndProductData, patientAndReporterData]);
    // --- End Edit Handlers ---


    // Backend URLs
    const TWILIO_BACKEND_BASE_URL: string = 'https://urrecalls-server-chi.vercel.app';
    const LOCAL_AUTOMATION_BACKEND_URL: string = 'http://192.168.1.121:3000'; // !! UPDATE IP !!
    const YOUR_BACKEND_SEND_OTP_URL: string = `${TWILIO_BACKEND_BASE_URL}/api/send-twilio-otp`;
    const YOUR_BACKEND_CHECK_OTP_URL: string = `${TWILIO_BACKEND_BASE_URL}/api/check-twilio-otp`;

    // URL for submitting the report data to the database (AWS)
    const DATABASE_SUBMIT_URL: string = 'https://o8v3jrcjq3.execute-api.us-east-1.amazonaws.com/Development/user-report?type=submit-user-report';
    // URL for triggering the local FDA automation script
    const AUTOMATION_TRIGGER_URL: string = `${LOCAL_AUTOMATION_BACKEND_URL}/api/start-fda-automation`;


    // --- OTP Handlers --- (Unchanged)
    const handleSendOtp = async (): Promise<void> => {
        const formattedPhoneNumber = phoneNumber.replace(/[\s()-]/g, '');
        if (!formattedPhoneNumber.startsWith('+') || formattedPhoneNumber.length < 11) {
            setVerificationError("Please use format +1XXXXXXXXXX."); return;
        }
        setVerificationError(null); setIsVerificationLoading(true);
        try {
            console.log(`Requesting OTP for ${formattedPhoneNumber} from ${YOUR_BACKEND_SEND_OTP_URL}...`);
            const response = await fetch(YOUR_BACKEND_SEND_OTP_URL, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: formattedPhoneNumber }),
            });
            if (!response.ok) {
                let errorMsg = `Failed to send OTP. Status: ${response.status}`;
                try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { }
                throw new Error(errorMsg);
            }
            const responseData = await response.json();
            if (!responseData.success) throw new Error(responseData.error || 'Failed to send OTP');
            setIsOtpSent(true); Alert.alert('Code Sent', 'An OTP should arrive shortly.');
        } catch (error: any) {
            console.error("Send OTP Error:", error);
            setVerificationError(error.message || 'An error occurred sending the code.');
            Alert.alert('Error', error.message || 'An error occurred sending the code.');
        } finally { setIsVerificationLoading(false); }
    };

    const handleVerifyOtp = async (): Promise<void> => {
        const formattedPhoneNumber = phoneNumber.replace(/[\s()-]/g, '');
        if (!otpCode || otpCode.length < 4) { setVerificationError("Please enter the received OTP code."); return; }
        setVerificationError(null); setIsVerificationLoading(true);
        try {
            console.log(`Verifying OTP ${otpCode} for ${formattedPhoneNumber} via ${YOUR_BACKEND_CHECK_OTP_URL}...`);
            const response = await fetch(YOUR_BACKEND_CHECK_OTP_URL, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: formattedPhoneNumber, otpCode: otpCode }),
            });
            if (!response.ok) {
                let errorMsg = `Failed to verify OTP. Status: ${response.status}`;
                try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { }
                throw new Error(errorMsg);
            }
            const responseData = await response.json();
            // Adjust this check based on your actual Twilio backend response structure
            if (!responseData.success || responseData.status !== 'approved') {
                throw new Error(responseData.error || 'Invalid or expired OTP code.');
            }
            console.log('OTP Verified successfully.'); setIsOtpVerified(true);
            Alert.alert('Success', 'Phone number verified successfully!');
        } catch (error: any) {
            console.error("Verify OTP Error:", error);
            setVerificationError(error.message || 'An error occurred during verification.');
            Alert.alert('Error', error.message || 'An error occurred during verification.');
        } finally { setIsVerificationLoading(false); }
    };
    // --- End OTP Handlers ---


    // --- Final Submit Handler (Updated for Dual Submission) ---
    const handleFinalSubmit = async (): Promise<void> => {
        if (!isOtpVerified) { Alert.alert("Verification Required", "Please complete phone number verification first."); return; }
        if (!isAttested) { Alert.alert("Attestation Required", "Please check the box to attest that the information provided is accurate and truthful."); return; }

        setIsSubmitting(true);

        // Create Final Payload (Same as before)
        const finalPayload: SubmissionPayload = {
            // --- Populate all fields from problemAndProductData and patientAndReporterData ---
            problemDescription: problemAndProductData.problemDescription,
            problemDate: problemAndProductData.problemDate,
            problemCause: problemAndProductData.problemCause,
            productPurchaseLocation: problemAndProductData.productPurchaseLocation,
            reportIsAbout: problemAndProductData.reportIsAbout,
            productName: problemAndProductData.productName,
            productExpirationDate: problemAndProductData.productExpirationDate,
            specifications: problemAndProductData.specifications,
            patientInitials: patientAndReporterData.patientInitials,
            patientSex: patientAndReporterData.patientSex,
            patientKnownMedicalConditionsOrAllergies: patientAndReporterData.patientKnownMedicalConditionsOrAllergies,
            // identifier: problemAndProductData.identifier, // Uncomment if needed
            // category: problemAndProductData.category, // Uncomment if needed
            reporterFirstName: patientAndReporterData.reporterFirstName,
            reporterLastName: patientAndReporterData.reporterLastName,
            reporterEmail: patientAndReporterData.reporterEmail,
            patientSoughtMedicalAttention: patientAndReporterData.patientSoughtMedicalAttention, // Ensure this is included if needed by backend/automation
            userId: userId ?? null, // Add the user ID
            phoneNumberVerified: phoneNumber.replace(/[\s()-]/g, ''),
            attested: isAttested,
            submittedAt: new Date().toISOString(),
        };

        const jsonData = JSON.stringify(finalPayload, null, 2);
        let dbSubmissionSuccess = false; // Flag to track database submission status
        let automationTriggered = false; // Flag to track automation trigger status
        let dbErrorMessage: string | null = null;
        let automationErrorMessage: string | null = null;

        // --- Step 1: Submit to Database API (AWS) ---
        console.log(`--- 1. Submitting Report to Database API: ${DATABASE_SUBMIT_URL} ---`);
        try {
            const dbResponse = await fetch(DATABASE_SUBMIT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: jsonData,
            });

            if (!dbResponse.ok) {
                let errorMsg = `Database submission failed. Status: ${dbResponse.status}`;
                try {
                    const errorData = await dbResponse.json();
                    errorMsg = errorData.message || errorData.error || JSON.stringify(errorData) || errorMsg;
                } catch (e) {
                    try { const errorText = await dbResponse.text(); errorMsg += `. ${errorText.substring(0, 100)}`; } catch (e2) { }
                }
                throw new Error(errorMsg); // Throw error to be caught below
            }

            const dbResponseData = await dbResponse.json(); // Assuming success response is JSON
            console.log("Database API Success Response:", dbResponseData);
            dbSubmissionSuccess = true; // Mark database submission as successful

        } catch (error: any) {
            console.error('Database submission error:', error);
            dbErrorMessage = error.message || 'An unknown error occurred while submitting to the database.';
            // Do not proceed to automation if database save failed
            Alert.alert('Database Submission Failed', dbErrorMessage ?? 'An unknown error occurred.');
            setIsSubmitting(false); // Stop loading indicator
            return; // Exit the function
        }

        // --- Step 2: Trigger Local Automation (only if DB submission succeeded) ---
        if (dbSubmissionSuccess) {
            console.log(`--- 2. Triggering Local Automation: ${AUTOMATION_TRIGGER_URL} ---`);
            try {
                const automationResponse = await fetch(AUTOMATION_TRIGGER_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: jsonData, // Send the same data
                });

                if (!automationResponse.ok) {
                    let errorMsg = `Local automation trigger failed. Status: ${automationResponse.status}`;
                    try { const errorData = await automationResponse.json(); errorMsg = errorData.message || errorMsg; }
                    catch (e) { try { const errorText = await automationResponse.text(); errorMsg += `. ${errorText.substring(0, 100)}`; } catch (e2) { } }
                    throw new Error(errorMsg); // Throw error to be caught below
                }

                const automationResponseData = await automationResponse.json();
                console.log("Local Automation Trigger Success Response:", automationResponseData);
                automationTriggered = true; // Mark automation as triggered

            } catch (error: any) {
                console.error('Local automation trigger error:', error);
                automationErrorMessage = error.message || 'Something went wrong while triggering local automation.';
                // Handle specific network error for local server
                if (error.message?.includes('Network request failed')) {
                    automationErrorMessage = 'Network request failed. Ensure the local backend server is running and accessible (check IP, port, firewall, Wi-Fi).';
                } else if (error.message?.includes('JSON Parse error')) {
                    automationErrorMessage = 'Received an invalid response from the local backend server.';
                }
                // Don't stop execution here, report was saved, but warn the user
            }
        }

        // --- Step 3: Final Alert and Navigation ---
        setIsSubmitting(false); // Stop loading indicator

        if (dbSubmissionSuccess && automationTriggered) {
            Alert.alert('Success', 'Your report has been submitted and the automation process has started.');
        } else if (dbSubmissionSuccess && !automationTriggered) {
            // Report saved, but automation failed
            Alert.alert(
                'Report Submitted (Warning)',
                `Your report was saved successfully, but the local automation could not be started.\n\nError: ${automationErrorMessage || 'Unknown automation error.'}`
            );
        }
        // Note: The case where dbSubmissionSuccess is false is handled earlier by returning

        // Navigate home regardless of automation success, as the report is saved.
        navigation.popToTop();
        navigation.navigate('Home');

    }; // End handleFinalSubmit

    const canSubmit: boolean = isOtpVerified && isAttested && !isSubmitting;

    // --- Render JSX --- (Unchanged)
    return (
        <SafeAreaView style={styles.page} edges={["top", "left", "right"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.secondary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review & Submit</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Section 1: Problem & Product with Edit Button */}
                <SectionHeader title="Problem & Product Summary" onEditPress={handleEditProblemProduct} />
                <View style={styles.sectionContent}>
                    <ReviewRow label="Problem Description" value={problemAndProductData.problemDescription} />
                    <ReviewRow label="Problem Date" value={problemAndProductData.problemDate} />
                    <ReviewRow label="Purchase Location" value={problemAndProductData.productPurchaseLocation} />
                    <ReviewRow label="Problem Cause (Defaulted)" value={problemAndProductData.problemCause} />
                    <ReviewRow label="Report Is About" value={problemAndProductData.reportIsAbout} />
                    <ReviewRow label="Product Name" value={problemAndProductData.productName} />
                    <ReviewRow label="Expiration Date" value={problemAndProductData.productExpirationDate} />
                    <ReviewRow label="Specifications/Brand" value={problemAndProductData.specifications} />
                </View>

                {/* Section 2: Patient & Reporter with Edit Button */}
                <SectionHeader title="Patient & Reporter Summary" onEditPress={handleEditPatientReporter} />
                <View style={styles.sectionContent}>
                    <ReviewRow label="Patient Initials" value={patientAndReporterData.patientInitials} />
                    <ReviewRow label="Patient Gender" value={patientAndReporterData.patientSex} />
                    <ReviewRow label="Patient Known Conditions/Allergies" value={patientAndReporterData.patientKnownMedicalConditionsOrAllergies} />
                    <ReviewRow label="Sought Medical Attention" value={patientAndReporterData.patientSoughtMedicalAttention} />
                    <ReviewRow label="Reporter First Name" value={patientAndReporterData.reporterFirstName} />
                    <ReviewRow label="Reporter Last Name" value={patientAndReporterData.reporterLastName} />
                    <ReviewRow label="Reporter Email" value={patientAndReporterData.reporterEmail} />
                </View>


                {/* Phone Verification Section */}
                <View style={styles.verificationSection}>
                    <Text style={styles.sectionTitle}>Phone Verification</Text>
                    <Text style={styles.verificationSubtitle}>
                        {isOtpVerified ? "Your phone number has been verified." : "A code will be sent via SMS to verify this submission."}
                    </Text>
                    {/* OTP UI Logic */}
                    {!isOtpVerified ? (<> {!isOtpSent ? (<View style={styles.inputBlock}>
                        <Text style={styles.label}>Phone Number (e.g., +14155552671)</Text>
                        <View style={[styles.inputContainer, styles.phoneInputContainer]}>
                            <TextInput style={[styles.input, styles.phoneInput]} placeholder="+1XXXXXXXXXX" placeholderTextColor={COLORS.placeholder}
                                value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" textContentType="telephoneNumber"
                                editable={!isVerificationLoading} autoComplete="tel" />
                            <TouchableOpacity style={[styles.sendOtpButton, (isVerificationLoading || !phoneNumber || phoneNumber.length < 11) && styles.buttonDisabled]}
                                onPress={handleSendOtp} disabled={isVerificationLoading || !phoneNumber || phoneNumber.length < 11} activeOpacity={0.7} >
                                {isVerificationLoading ? (<ActivityIndicator size="small" color={COLORS.primary} />) : (<Text style={styles.sendOtpButtonText}>Send Code</Text>)}
                            </TouchableOpacity>
                        </View>
                    </View>) : (<View style={styles.inputBlock}>
                        <Text style={styles.label}>Enter OTP Code Sent to {phoneNumber}</Text>
                        <View style={styles.inputContainer}>
                            <TextInput style={styles.input} placeholder="Enter code" placeholderTextColor={COLORS.placeholder} value={otpCode}
                                onChangeText={setOtpCode} keyboardType="number-pad" maxLength={10} editable={!isVerificationLoading} textContentType="oneTimeCode" />
                        </View>
                        <TouchableOpacity style={[styles.verifyOtpButton, (isVerificationLoading || !otpCode || otpCode.length < 4) && styles.buttonDisabled]}
                            onPress={handleVerifyOtp} disabled={isVerificationLoading || !otpCode || otpCode.length < 4} activeOpacity={0.7} >
                            {isVerificationLoading ? (<ActivityIndicator size="small" color={COLORS.primary} />) : (<Text style={styles.verifyOtpButtonText}>Verify Code</Text>)}
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.resendButton, isVerificationLoading && styles.buttonDisabled]} onPress={handleSendOtp} disabled={isVerificationLoading}>
                            <Text style={styles.resendButtonText}>Resend Code?</Text>
                        </TouchableOpacity>
                    </View>)}
                        {verificationError && (<Text style={styles.errorText}>{verificationError}</Text>)}
                    </>) : (<View style={styles.verifiedContainer}>
                        <Feather name="check-circle" size={24} color="green" />
                        <Text style={styles.verifiedText}>Phone Number Verified</Text>
                    </View>)}
                </View>


                {/* Attestation Checkbox Section */}
                <View style={styles.attestationContainer}>
                    <Text style={styles.sectionTitle}>Final Attestation</Text>
                    <Checkbox
                        label="I attest that the information provided in this report is accurate and truthful. *"
                        checked={isAttested}
                        onPress={() => setIsAttested(!isAttested)}
                    />
                </View>

            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, !canSubmit && styles.buttonDisabled]}
                    onPress={handleFinalSubmit}
                    activeOpacity={canSubmit ? 0.8 : 1}
                    disabled={!canSubmit}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <>
                            <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                                SUBMIT FINAL REPORT
                            </Text>
                            <Feather name="send" size={18} color={!canSubmit ? COLORS.textMuted : COLORS.primary} style={{ marginLeft: 8 }} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// --- Styles --- (Unchanged)
const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: COLORS.primary },
    flex: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, paddingVertical: 12, backgroundColor: COLORS.primary, borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle, minHeight: 50 },
    backButton: { padding: 8, justifyContent: "center", alignItems: "center", width: 40, height: 40 },
    headerTitle: { color: COLORS.textLight, fontSize: 18, fontWeight: "600", textAlign: "center" },
    scrollContent: { paddingHorizontal: 15, paddingTop: 20, paddingBottom: 150 },
    sectionHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderSubtle,
    },
    sectionTitle: { color: COLORS.textLight, fontSize: 18, fontWeight: "600" },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundSubtle,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    editButtonText: { color: COLORS.secondary, fontSize: 13, fontWeight: '500', marginLeft: 5 },
    sectionContent: { backgroundColor: COLORS.backgroundSubtle, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 5, marginBottom: 25 },
    reviewRow: { flexDirection: "column", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
    reviewLabel: { color: COLORS.textMuted, fontSize: 13, fontWeight: "500", marginBottom: 4 },
    reviewValue: { color: COLORS.textLight, fontSize: 15, fontWeight: "400", lineHeight: 21 },
    verificationSection: { marginTop: 10, marginBottom: 15, paddingHorizontal: 5 },
    verificationSubtitle: { color: COLORS.textMuted, fontSize: 14, marginBottom: 15, lineHeight: 20 },
    inputBlock: { marginBottom: 15 },
    label: { color: COLORS.textMuted, fontSize: 14, marginBottom: 8, fontWeight: "500" },
    inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: "#d0d0d0", minHeight: 50 },
    phoneInputContainer: { /* Specific styles if needed */ },
    input: { flex: 1, paddingVertical: Platform.OS === "ios" ? 14 : 12, paddingHorizontal: 16, fontSize: 16, color: COLORS.textDark },
    phoneInput: { flexGrow: 1, flexShrink: 1 },
    sendOtpButton: { backgroundColor: COLORS.secondary, paddingHorizontal: 15, height: 50, marginLeft: 8, justifyContent: "center", alignItems: "center", borderTopRightRadius: 9, borderBottomRightRadius: 9, minWidth: 100 },
    sendOtpButtonText: { color: COLORS.primary, fontWeight: "bold", fontSize: 14 },
    verifyOtpButton: { backgroundColor: COLORS.secondary, paddingVertical: 14, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 10 },
    verifyOtpButtonText: { color: COLORS.primary, fontWeight: "bold", fontSize: 15 },
    resendButton: { marginTop: 15, alignItems: "center" },
    resendButtonText: { color: COLORS.secondary, fontSize: 14, textDecorationLine: "underline" },
    verifiedContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 20, backgroundColor: 'rgba(0, 255, 0, 0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'green' },
    verifiedText: { color: 'green', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    errorText: { color: '#FF6B6B', fontSize: 14, marginTop: 8, textAlign: 'center' },
    attestationContainer: { marginTop: 15, marginBottom: 20, paddingHorizontal: 5 },
    checkboxTouchable: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    checkboxIcon: { marginRight: 12 },
    checkboxLabel: { flex: 1, color: COLORS.textLight, fontSize: 15, lineHeight: 20, fontWeight: '500' },
    footer: { paddingVertical: 15, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, backgroundColor: COLORS.primary, borderTopWidth: 1, borderTopColor: COLORS.borderSubtle },
    submitButton: { flexDirection: "row", backgroundColor: COLORS.secondary, paddingVertical: 16, borderRadius: 10, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 4 },
    submitText: { color: COLORS.primary, fontWeight: "bold", fontSize: 16, textAlign: "center" },
    submitTextDisabled: { color: COLORS.textMuted },
    buttonDisabled: { opacity: 0.5, backgroundColor: '#cccccc' },
});

export default ReviewSubmitScreen;

//*Summary of Changes in `//handleFinalSubmit`:**

//1.  **URL Constants:** Ensured both `DATABASE_SUBMIT_URL` and `AUTOMATION_TRIGGER_URL` are defined and used.
//2.  **Sequential Execution:** The code now first attempts the `fetch` call to `DATABASE_SUBMIT_URL`.
//3.  **Conditional Automation Trigger:** The `fetch` call to `AUTOMATION_TRIGGER_URL` is *only* made if the database submission (`dbSubmissionSuccess`) was successful.
//4.  **Separate Error Handling:** Errors from the database submission and the automation trigger are caught and stored separately (`dbErrorMessage`, `automationErrorMessage`).
//5.  **Clearer User Feedback:**
// * If the database submission fails, an alert is shown immediately, and the process stops.
// * If the database submission succeeds but automation fails, an alert informs the user that the report was saved but automation failed, including the specific automation error.
// * If both succeed, a combined success message is shown.
//6.  **Navigation:** The user is navigated back to the home screen if the *database submission* is successful, regardless of whether the automation trigger succeeded or failed (as the primary goal of saving the report was achieved).

//This structure ensures the data is saved first, and then the local automation is attempted, with appropriate feedback provided to the user based on the outcome of both steps. Remember to update the IP address in `LOCAL_AUTOMATION_BACKEND_UR