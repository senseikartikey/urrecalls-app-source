import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    ImageBackground, // Keep if you still want the overlay image
    View,
    Modal,
    TouchableOpacity,
    Text,
    Alert,
    Platform,
    Animated, // Import Animated
    Dimensions
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SifterSearch } from "~/network/network_request";
import Page from "~/FDAtest"; // Ensure this path is correct
import { error, log, t } from '~/utility/utility';
import Feather from 'react-native-vector-icons/Feather'; // For close button
import { COLORS } from '../../styles/colors'; // Adjust path if needed

// --- Constants for Scanner Box UI ---
const { width } = Dimensions.get('window');
// Make SCAN_BOX_SIZE slightly smaller than barcode.tsx uses, as it's in a modal
const SCAN_BOX_SIZE = width * 0.75; // Example: 75% of screen width

// Define the structure of the data returned on successful scan and processing
export interface ScanResultData {
    identifier: string; // The scanned barcode (UPC/NDC)
    name?: string;
    category?: string;
    specifications?: string; // e.g., brand, size, etc.
    // Add any other relevant fields your Page function might return and ReportIncidentScreen needs
}

interface ScannerModalProps {
    isVisible: boolean;
    onClose: () => void;
    onScanSuccess: (data: ScanResultData) => void;
    onError: (message: string) => void;
    reportType?: 'Product' | 'Drug'; // To adjust search/expectations if needed
}

export default function ScannerModal({ isVisible, onClose, onScanSuccess, onError, reportType }: ScannerModalProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const scanned_time = useRef(new Date().getTime());
    const [isProcessing, setIsProcessing] = useState(false);

    // --- Animation State ---
    const scanLineAnim = useRef(new Animated.Value(0)).current;

    // --- Start/Stop Animation ---
    const startAnimation = () => {
        scanLineAnim.setValue(0);
        Animated.loop(
            Animated.timing(scanLineAnim, {
                toValue: 1,
                duration: 2500, // Match barcode.tsx duration
                useNativeDriver: true, // Use native driver for performance
            })
        ).start();
    };

    const stopAnimation = () => {
        // Check if animation is running before stopping
        // Note: This is a basic check; more robust checks might involve tracking animation state if needed.
        try {
             scanLineAnim.stopAnimation();
             scanLineAnim.setValue(0); // Reset position
        } catch(e) {
             console.warn("Minor issue stopping animation (might already be stopped):", e);
        }
    };

    // --- Updated useEffect for Permission Handling and Animation ---
    useEffect(() => {
        // Define cleanup function early
        const cleanup = () => stopAnimation();

        if (!isVisible) {
            stopAnimation(); // Stop if not visible
            return cleanup; // Return cleanup
        }

        // If visible, but the permission object hasn't loaded yet, just wait.
        if (!permission) {
            log("ScannerModal: Waiting for camera permission object...");
            // Don't request here, let the initial hook call handle it or deny screen show it
            return cleanup; // Return cleanup
        }

        // Now we know 'permission' exists. Check its status.
        if (permission.granted) {
            log("ScannerModal: Permission granted, starting animation.");
            startAnimation();
        } else {
            log(`ScannerModal: Permission not granted (status: ${permission.status}, canAskAgain: ${permission.canAskAgain}).`);
            stopAnimation(); // Ensure animation is stopped if not granted

            // Request permission only if we are allowed to ask again.
            // This prevents potentially looping requests if permission was permanently denied.
            if (permission.canAskAgain) {
                log("ScannerModal: Requesting camera permission...");
                requestPermission();
            } else {
                // If we can't ask again, the "Permission Denied" view will be shown by the component's return logic.
                log("ScannerModal: Cannot ask for permission again.");
            }
        }

        // Return the cleanup function
        return cleanup;

    }, [isVisible, permission, requestPermission]); // Dependencies: visibility and the permission object itself


    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (isProcessing || !isVisible) {
            return;
        }

        // --- Debounce Logic (using 1500ms from original ScannerModal) ---
        const now = new Date().getTime();
        if (now - scanned_time.current <= 1500) {
            return;
        }
        scanned_time.current = now;
        setIsProcessing(true);
        stopAnimation(); // Pause animation while processing

        log("Raw Scanned Data:", data);

        // --- Format UPC/Identifier (using logic from original ScannerModal) ---
        let identifier = data;
        if (identifier.length === 13 && identifier.startsWith('0')) {
            identifier = identifier.substring(1);
        } else if (identifier.length === 12) {
            // Standard UPC-A, okay
        }
        // Add more specific formatting for NDC if reportType is 'Drug' here if needed

        log(`Scanning for ${reportType} with identifier:`, identifier);

        try {
            // --- API Calls (ensure these match the desired logic from barcode.tsx) ---
            log(`Calling SifterSearch with identifier: ${identifier}`);
            const results = await SifterSearch(identifier, 'upc', 1); // Use same params as barcode.tsx if different
            log("SifterSearch Results:", results);

            if (results.Pinfo == undefined || results.Pinfo.length == 0) {
                throw new Error("Product/Drug information not found for this barcode.");
            }

            log("Calling Page function with:", results.Pinfo[0]);
            // Ensure Page function is async if it wasn't already treated as such
            const pageResults = await Page(results.Pinfo[0]);
            log("Page Results:", pageResults);

             if (!pageResults || !pageResults.Pinfo) {
                 throw new Error("Detailed information could not be retrieved.");
             }

            // --- Map results to ScanResultData (ADJUST MAPPING based on actual pageResults and desired fields) ---
            const scanResultData: ScanResultData = {
                identifier: identifier, // Use the scanned & formatted identifier
                name: pageResults.Pinfo.name || pageResults.Pinfo.description || "N/A", // Match mapping logic from barcode.tsx or desired state
                category: pageResults.Pinfo.category || undefined,
                specifications: pageResults.Pinfo.brand_name || pageResults.Pinfo.package_size || undefined, // Combine fields as needed
                // Add other relevant fields from pageResults.Pinfo
            };

            log("Scan Success - Passing Data:", scanResultData);
            onScanSuccess(scanResultData); // *** USE CALLBACK ***

        } catch (err: any) {
            error("Scanning/Processing Error:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during scanning.";
            onError(errorMessage); // *** USE CALLBACK ***
        } finally {
            // Reset processing state but keep modal open (parent controls closure)
            setIsProcessing(false);
             // Restart animation ONLY if modal is still visible after callbacks return
             // It's usually better handled by the main useEffect reacting to isVisible again
             // if (isVisible) { startAnimation(); } // Avoid restarting here directly
        }
    };

    // --- Permission Handling JSX (same as before) ---
    if (!isVisible) return null;

    // If permission object itself is null/undefined, show loading/requesting state
    if (!permission) {
     return (
         <Modal visible={isVisible} onRequestClose={onClose} animationType="slide">
             <View style={styles.permissionContainer}>
                 <Text style={styles.permissionText}>Requesting camera permission...</Text>
                 <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>Close</Text>
                 </TouchableOpacity>
             </View>
         </Modal>
     );
    }

    // If permission object exists but is not granted
    if (!permission.granted) {
     return (
         <Modal visible={isVisible} onRequestClose={onClose} animationType="slide">
             <View style={styles.permissionContainer}>
                 <Text style={styles.permissionText}>Camera permission denied. Please grant permission in settings or retry.</Text>
                 {/* Show request button only if we can ask again */}
                 {permission.canAskAgain && (
                     <TouchableOpacity onPress={requestPermission} style={styles.requestButton}>
                        <Text style={styles.requestButtonText}>Grant Permission</Text>
                     </TouchableOpacity>
                 )}
                 <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                     <Text style={styles.closeButtonText}>Close</Text>
                 </TouchableOpacity>
             </View>
         </Modal>
     );
    }

    // --- Calculate position for the scanner box ---
    // Adjust vertical offset if needed, subtracting approx status bar height might help center
    const statusBarHeight = Platform.OS === 'ios' ? 44 : 0; // Basic approximation
    const availableHeight = Dimensions.get('window').height - statusBarHeight;
    const boxTop = (availableHeight - SCAN_BOX_SIZE) / 2 + statusBarHeight;
    const boxLeft = (width - SCAN_BOX_SIZE) / 2;

    // --- Animated Scan Line Style ---
     const scanLineTranslateY = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, SCAN_BOX_SIZE - 4], // Adjust range to stay within box borders
    });

    // --- Render Scanner UI ---
    return (
        <Modal
            visible={isVisible}
            onRequestClose={onClose}
            animationType="slide"
            transparent={true} // Make modal background transparent to see camera through
        >
            <CameraView
                onBarcodeScanned={!isProcessing ? handleBarCodeScanned : undefined}
                barcodeScannerSettings={{
                    barcodeTypes: ["ean13", "upc_a", "upc_e"], // Match barcode.tsx or add more
                }}
                style={StyleSheet.absoluteFillObject} // Camera fills the whole modal
            >
                {/* Overlay View for UI elements */}
                <View style={styles.overlay}>
                    {/* Optional: Semi-transparent background layers outside the box */}
                    <View style={[styles.overlayPart, { top: 0, height: boxTop }]} />
                    <View style={[styles.overlayPart, { bottom: 0, height: Dimensions.get('window').height - (boxTop + SCAN_BOX_SIZE) }]} />
                    <View style={[styles.overlayPart, { top: boxTop, left: 0, height: SCAN_BOX_SIZE, width: boxLeft }]} />
                    <View style={[styles.overlayPart, { top: boxTop, right: 0, height: SCAN_BOX_SIZE, width: width - (boxLeft + SCAN_BOX_SIZE) }]} />


                    {/* Scanner Box with Corners and Animated Line */}
                    <View style={[styles.scannerBox, { top: boxTop, left: boxLeft }]}>
                        {/* Colored Corners */}
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />

                        {/* Animated Scan Line */}
                        <Animated.View
                            style={[
                                styles.scanLine,
                                { transform: [{ translateY: scanLineTranslateY }] },
                            ]}
                        />
                    </View>

                    {/* Processing Indicator (Keep from original modal) */}
                    {isProcessing && (
                        <View style={styles.processingIndicator}>
                            <Text style={styles.processingText}>Processing...</Text>
                        </View>
                    )}

                    {/* Close Button (Keep from original modal) */}
                    <TouchableOpacity onPress={onClose} style={styles.closeButtonAbsolute}>
                        <Feather name="x" size={30} color="#fff" />
                    </TouchableOpacity>

                   {/* Optional: Add "Upload from Gallery" button if needed */}
                   {/* <TouchableOpacity onPress={pickImageFromGallery} style={styles.uploadButton}>...</TouchableOpacity> */}

                </View>
            </CameraView>
        </Modal>
    );
}

// --- Styles --- (Includes merged styles)
const styles = StyleSheet.create({
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: COLORS.primary, // Use theme color
    },
    permissionText: {
      color: COLORS.textLight, // Use theme color
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
    },
     requestButton: {
       backgroundColor: COLORS.secondary, // Use theme color
       paddingVertical: 12,
       paddingHorizontal: 25,
       borderRadius: 8,
       marginBottom: 15,
    },
    requestButtonText: {
       color: COLORS.primary, // Use theme color
       fontSize: 16,
       fontWeight: 'bold',
    },
    closeButton: {
       marginTop: 10,
       padding: 10,
    },
     closeButtonText: {
       color: COLORS.textMuted, // Use theme color
       fontSize: 14,
    },

    // --- Styles for Scanner UI (merged from barcode.tsx and adapted) ---
    overlay: {
        flex: 1,
        backgroundColor: 'transparent', // Overall overlay is transparent
    },
     overlayPart: { // Semi-transparent parts outside the scan box
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Darken area outside box
        width: '100%', // Default width
     },
    scannerBox: {
        position: 'absolute', // Position it within the overlay
        width: SCAN_BOX_SIZE,
        height: SCAN_BOX_SIZE,
        // borderColor: '#ffffff', // White border from barcode.tsx
        // borderWidth: 1, // Thinner border might look better in modal
        borderRadius: 10, // Keep border radius
        overflow: 'hidden', // Important for scan line animation
        // backgroundColor: 'rgba(0,0,0,0.1)', // Slightly darker inside? Optional.
    },
    scanLine: {
        position: 'absolute',
        top: 0,
        left: '5%', // Add some horizontal margin
        right: '5%',
        height: 2,
        // backgroundColor: 'rgba(255, 255, 255, 0.7)', // White scan line from barcode.tsx
         backgroundColor: '#FFC107', // Or use theme color like secondary?
         borderRadius: 1,
         shadowColor: "#FFC107", // Add shadow for glow effect
         shadowOpacity: 0.8,
         shadowRadius: 3.00,
         shadowOffset: { height: 0, width: 0 },
         elevation: 8, // for Android shadow
    },
    corner: {
        position: 'absolute',
        width: 30, // Match barcode.tsx size
        height: 30,
        borderWidth: 5, // Match barcode.tsx thickness
        borderRadius: 3, // Slightly rounded corners
    },
    topLeft: {
        top: -2, // Adjust position slightly due to border width
        left: -2,
        borderTopColor: '#FFC107', // Yellow from barcode.tsx
        borderLeftColor: '#FFC107',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    topRight: {
        top: -2,
        right: -2,
        borderTopColor: '#000000', // Black from barcode.tsx
        borderRightColor: '#000000',
        borderLeftColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    bottomLeft: {
        bottom: -2,
        left: -2,
        borderBottomColor: '#FFFFFF', // White from barcode.tsx
        borderLeftColor: '#FFFFFF',
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
    },
    bottomRight: {
        bottom: -2,
        right: -2,
        borderBottomColor: '#FFC107', // Yellow from barcode.tsx
        borderRightColor: '#FFC107',
        borderTopColor: 'transparent',
        borderLeftColor: 'transparent',
    },
    // --- End Scanner UI Styles ---

    closeButtonAbsolute: {
       position: 'absolute',
       top: Platform.OS === 'ios' ? 50 : 20, // Adjust for status bar/notch
       left: 20,
       backgroundColor: 'rgba(0, 0, 0, 0.4)',
       borderRadius: 20,
       padding: 5,
       zIndex: 10 // Ensure close button is on top
    },
    processingIndicator: {
       position: 'absolute',
       bottom: 50,
       alignSelf: 'center', // Center indicator
       backgroundColor: 'rgba(0, 0, 0, 0.6)',
       paddingVertical: 8,
       paddingHorizontal: 15,
       borderRadius: 20,
       zIndex: 10 // Ensure indicator is on top
    },
    processingText: {
       color: '#fff',
       fontSize: 14,
       fontWeight: 'bold',
    },

    // --- Optional Upload Button Styles (if added) ---
    // uploadButton: { /* ... styles from barcode.tsx if needed ... */ },
    // uploadText: { /* ... styles from barcode.tsx if needed ... */ },
});