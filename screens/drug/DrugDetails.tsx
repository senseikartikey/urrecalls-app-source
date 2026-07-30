// DrugDetails.tsx
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import {
  getAllProducts,
  toggleSaveStatus,
  get_product_id,
} from "~/store";
import {
  LargeText,
  NormalText,
  PageView,
  Touchable,
} from "~/components/generic";
import styles, { em, get_theme_color } from "styles/main_styles";
import { error, i18n, log, t } from "~/utility/utility";
import { Card, Divider, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MainStackParamList } from "~/navigators/main_navigator";

export type DrugDetailsScreenProps = StackScreenProps<
  MainStackParamList,
  "DrugDetails"
>;

/** parse YYYYMMDD → localized date string */
function recall_data_parse_initiation_date(dateString: string) {
  if (!dateString) return "";
  const year = Number(dateString.slice(0, 4));
  const month = Number(dateString.slice(4, 6)) - 1;
  const day = Number(dateString.slice(6, 8));
  const date = new Date(year, month, day);
  try {
    return new Intl.DateTimeFormat(i18n.locale).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US").format(date);
  }
}

export default function DrugDetails({
  route,
}: DrugDetailsScreenProps) {
  // ── LOG the incoming params ─────────────────────────────────────────────
  console.log("📋 [DrugDetails] got route.params.recallData:", route.params.recallData);

  // accommodate both search (object) and saved (array) flows:
  const incoming = route.params.recallData;
  const recallData = Array.isArray(incoming) ? incoming[0] || {} : incoming;

  const [isRecalled] = useState(
    (recallData.status as string)?.toLowerCase() === "ongoing"
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const theme = useTheme();
  const isDark = theme.dark;

  // check saved status
  useEffect(() => {
    log("Checking drug saved status");
    getAllProducts(undefined, { type: "drug", status: null }, 1, true)
      .then((data) => {
        const thisId = get_product_id(recallData, "drug");
        setIsSaved(data.some((d) => (d as any).id === thisId));
      })
      .catch(error);
  }, []);

  function toggleSaved() {
    toggleSaveStatus(isSaved, "drug", recallData)
      .then((success) => {
        if (!success) throw new Error("Failed to update save status");
        setIsSaved(!isSaved);
      })
      .catch(error);
  }

  // prepare description
  const fullDesc = recallData.product_description ?? "";
  const truncatedDesc =
    fullDesc.length > 100 ? fullDesc.slice(0, 100) + "..." : fullDesc;

  // sections in desired order
  const sections = [
    {
      title: t("fooddetails_initiationdate"),
      content: recall_data_parse_initiation_date(
        recallData.recall_initiation_date
      ),
    },
    {
      title: t("fooddetails_distributionlocations"),
      content: recallData.distribution_pattern,
    },
    {
      title: t("fooddetails_reasonrecall"),
      content: recallData.reason_for_recall,
    },
    {
      title: t("fooddetails_classification"),
      content: recallData.classification,
    },
    {
      title: t("fooddetails_description"),
      content: fullDesc,
      isDescription: true,
    },
  ];

  return (
    <PageView
      contentContainerStyle={{
        justifyContent: "flex-start",
        paddingHorizontal: 0,
        paddingBottom: em * 0.2,
      }}
    >
      {/* floating save icon */}
      <Touchable
        onPress={toggleSaved}
        style={{
          position: "absolute",
          top: em,
          right: em,
          zIndex: 10,
          padding: em * 0.5,
        }}
      >
        <MaterialCommunityIcons
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={em * 2}
          color={get_theme_color(theme, "primary")}
        />
      </Touchable>

      {/* HEADER */}
      <View
        style={{
          marginTop: em * 2.3,
          paddingHorizontal: em,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <MaterialCommunityIcons
          name="pill"
          color={get_theme_color(theme, "onBackground")}
          size={em * 3}
        />
        <View style={{ marginLeft: em, flex: 1 }}>
          <LargeText
            style={{
              fontWeight: "bold",
              color: isDark ? "#B6E8FF" : "#024B6D",
            }}
          >
            {recallData.recalling_firm}
          </LargeText>
        </View>
      </View>

      {/* STATUS CARD */}
      <View
        style={{
          ...styles.h_centered_container,
          marginTop: em * 1.5,
          marginBottom: em * 0.4,
          backgroundColor: get_theme_color(
            theme,
            isRecalled ? "errorContainer" : "primaryContainer"
          ),
          borderRadius: 12,
          padding: em * 0.5,
        }}
      >
        <LargeText
          style={{
            fontWeight: "bold",
            fontSize: isRecalled ? 29 : 24.5,
            color: get_theme_color(
              theme,
              isRecalled ? "onErrorContainer" : "onPrimaryContainer"
            ),
          }}
        >
          {(isRecalled ? t("detailsrecalled") : t("detailsnotrecalled")).toUpperCase()}
        </LargeText>
      </View>

      {/* DETAILS CARD */}
      <Card
        style={{
          backgroundColor: isDark ? "#B6E8FF" : "#024B6D",
          borderRadius: 12,
          marginBottom: em * 0.5,
          width: "100%",
        }}
      >
        {sections.map((sec, i) => (
          <View key={i}>
            <View style={{ padding: em * 0.75 }}>
              <LargeText
                style={{
                  fontWeight: "bold",
                  color: isDark ? "#024B6D" : "#B6E8FF",
                }}
              >
                {sec.title}
              </LargeText>
              <NormalText
                style={{
                  marginTop: em * 0.3,
                  color: isDark ? "#024B6D" : "#000",
                }}
              >
                {sec.isDescription
                  ? isDescriptionExpanded
                    ? sec.content
                    : truncatedDesc
                  : sec.content}
              </NormalText>
              {sec.isDescription && fullDesc.length > 100 && (
                <Touchable
                  onPress={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                >
                  <NormalText
                    style={{
                      marginTop: em * 0.3,
                      color: isDark ? "#024B6D" : "#000",
                    }}
                  >
                    {isDescriptionExpanded ? "Show Less" : "Show More"}
                  </NormalText>
                </Touchable>
              )}
            </View>
            {i < sections.length - 1 && (
              <Divider
                style={{
                  backgroundColor: get_theme_color(theme, "outline"),
                }}
              />
            )}
          </View>
        ))}
      </Card>
    </PageView>
  );
}


