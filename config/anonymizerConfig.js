export const INITIAL_EDITOR_STATE = {
  html: "",
  text: "",
};

export const DEFAULT_ACCEPTANCE_THRESHOLD = 0.5;
export const DEFAULT_DEIDENTIFICATION_TYPE = "replace";
export const DEFAULT_MASK_CHAR_COUNT = 15;
export const DEFAULT_MASK_CHAR = "*";
export const DEFAULT_ENCRYPT_KEY = "w0dPsi0DAZTBIkeBGsvWGwgG";
export const DEIDENTIFICATION_TYPE_OPTIONS = [
  { value: "replace", label: "Replace" },
  { value: "redact", label: "Redact" },
  { value: "mask", label: "Mask" },
  { value: "hash", label: "Hash" },
  { value: "encrypt", label: "Encrypt" },
  { value: "highlight", label: "Highlight" },
];
export const API_BASE_URL = "/api";
export const API_ROUTES = {
  anonymize: `${API_BASE_URL}/anonymize`,
  saved: `${API_BASE_URL}/anonymize/saved`,
};
export const THEME_STORAGE_KEY = "anonymizerTheme";
export const THEME_LIGHT = "light";
export const THEME_DARK = "dark";

export const NER_MODEL_OPTIONS = [
  {
    value: "en_core_web_lg",
    label: "English (en_core_web_lg)",
    language: "en",
    disabled: false,
  },
  {
    value: "nl_core_news_lg",
    label: "Dutch (nl_core_news_lg)",
    language: "nl",
    disabled: false,
  },
  {
    value: "de_core_news_lg",
    label: "German (de_core_news_lg)",
    language: "de",
    disabled: true,
  },
  {
    value: "fr_core_news_lg",
    label: "French (fr_core_news_lg)",
    language: "fr",
    disabled: true,
  },
];

export const DEFAULT_NER_MODEL =
  localStorage.getItem("preferredNerModel") || NER_MODEL_OPTIONS[0].value;

export const ENTITY_TYPE_OPTIONS = [
  { value: "PERSON", label: "Person" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "LOCATION", label: "Place / Location" },
  { value: "GPE", label: "Geo-political entity" },
  { value: "NRP", label: "Nationality / Religion / Political" },
  { value: "FAC", label: "Facility" },
  { value: "PRODUCT", label: "Product" },
  { value: "EVENT", label: "Event" },
  { value: "LAW", label: "Law" },
  { value: "LANGUAGE", label: "Language" },
  { value: "DATE_TIME", label: "Date & Time" },
  { value: "DATE", label: "Date" },
  { value: "TIME", label: "Time" },
  { value: "AGE", label: "Age" },
  { value: "TITLE", label: "Job title" },
  { value: "MONEY", label: "Money" },
  { value: "PERCENT", label: "Percent" },
  { value: "QUANTITY", label: "Quantity" },
  { value: "ORDINAL", label: "Ordinal" },
  { value: "CARDINAL", label: "Cardinal" },
  { value: "EMAIL_ADDRESS", label: "Email address" },
  { value: "PHONE_NUMBER", label: "Phone number" },
  { value: "IP_ADDRESS", label: "IP address" },
  { value: "IPV4_ADDRESS", label: "IPv4 address" },
  { value: "IPV6_ADDRESS", label: "IPv6 address" },
  { value: "MAC_ADDRESS", label: "MAC address" },
  { value: "DOMAIN_NAME", label: "Domain name" },
  { value: "URL", label: "URL" },
  { value: "CREDIT_CARD", label: "Credit card" },
  { value: "IBAN_CODE", label: "IBAN" },
  { value: "SWIFT_CODE", label: "SWIFT/BIC" },
  { value: "CRYPTO", label: "Cryptocurrency wallet" },
  { value: "MEDICAL_LICENSE", label: "Medical license" },
  { value: "US_HEALTHCARE_NPI", label: "US healthcare NPI" },
  { value: "BANK_ACCOUNT", label: "Bank account" },
  { value: "US_BANK_ACCOUNT_NUMBER", label: "US bank account number" },
  { value: "US_BANK_ROUTING", label: "US bank routing" },
  { value: "US_SSN", label: "US SSN" },
  { value: "US_ITIN", label: "US ITIN" },
  { value: "US_PASSPORT", label: "US passport" },
  { value: "PASSPORT", label: "Passport" },
  { value: "US_DRIVER_LICENSE", label: "US driver license" },
  { value: "UK_NHS", label: "UK NHS" },
  { value: "SG_NRIC_FIN", label: "Singapore NRIC/FIN" },
  { value: "ES_NIF", label: "Spain NIF" },
  { value: "ES_NIE", label: "Spain NIE" },
  { value: "ES_CIF", label: "Spain CIF" },
  { value: "IT_FISCAL_CODE", label: "Italy fiscal code" },
  { value: "IT_VAT_CODE", label: "Italy VAT code" },
  { value: "IT_IDENTITY_CARD", label: "Italy identity card" },
  { value: "IT_DRIVER_LICENSE", label: "Italy driver license" },
  { value: "IT_PASSPORT", label: "Italy passport" },
  { value: "IN_AADHAAR", label: "India Aadhaar" },
  { value: "IN_PAN", label: "India PAN" },
  { value: "IN_VOTER", label: "India voter ID" },
  { value: "IN_PASSPORT", label: "India passport" },
  { value: "NL_BSN", label: "Netherlands BSN" },
  { value: "AU_TFN", label: "Australia TFN" },
  { value: "AU_ABN", label: "Australia ABN" },
  { value: "AU_ACN", label: "Australia ACN" },
  { value: "AU_MEDICARE_NUMBER", label: "Australia Medicare" },
  { value: "ZIP_CODE", label: "ZIP / Postal code" },
];

export const ENTITY_TYPE_STORAGE_KEY = "preferredEntityTypes";
export const DEIDENTIFICATION_TYPE_STORAGE_KEY =
  "preferredDeidentificationType";
export const MASK_CHAR_COUNT_STORAGE_KEY = "preferredMaskCharCount";
export const MASK_CHAR_STORAGE_KEY = "preferredMaskChar";
export const ENCRYPT_KEY_STORAGE_KEY = "preferredEncryptKey";
export const PRESET_STORAGE_KEY = "anonymizerPresets";
export const ENTITY_TYPE_TRANSLATIONS = {
  nl: {
    PERSON: { label: "Persoon", value: "PERSOON" },
    ORGANIZATION: { label: "Organisatie", value: "ORGANISATIE" },
    LOCATION: { label: "Plaats / locatie", value: "LOCATIE" },
    GPE: { label: "Geo-politieke entiteit", value: "GEO_POLITIEKE_ENTITEIT" },
    NRP: {
      label: "Nationaliteit / religie / politiek",
      value: "NATIONALITEIT_RELIGIE_POLITIEK",
    },
    FAC: { label: "Faciliteit", value: "FACILITEIT" },
    PRODUCT: { label: "Product", value: "PRODUCT" },
    EVENT: { label: "Gebeurtenis", value: "GEBEURTENIS" },
    LAW: { label: "Wetgeving", value: "WETGEVING" },
    LANGUAGE: { label: "Taal", value: "TAAL" },
    DATE_TIME: { label: "Datum en tijd", value: "DATUM_TIJDSAANDUIDING" },
    DATE: { label: "Datum", value: "DATUM" },
    TIME: { label: "Tijd", value: "TIJD" },
    AGE: { label: "Leeftijd", value: "LEEFTIJD" },
    TITLE: { label: "Functietitel", value: "FUNCTIETITEL" },
    MONEY: { label: "Bedrag", value: "BEDRAG" },
    PERCENT: { label: "Percentage", value: "PERCENTAGE" },
    QUANTITY: { label: "Hoeveelheid", value: "HOEVEELHEID" },
    ORDINAL: { label: "Rangnummer", value: "RANGNUMMER" },
    CARDINAL: { label: "Getal", value: "GETAL" },
    EMAIL_ADDRESS: { label: "E-mailadres", value: "E_MAILADRES" },
    PHONE_NUMBER: { label: "Telefoonnummer", value: "TELEFOONNUMMER" },
    IP_ADDRESS: { label: "IP-adres", value: "IP_ADRES" },
    IPV4_ADDRESS: { label: "IPv4-adres", value: "IPV4_ADRES" },
    IPV6_ADDRESS: { label: "IPv6-adres", value: "IPV6_ADRES" },
    MAC_ADDRESS: { label: "MAC-adres", value: "MAC_ADRES" },
    DOMAIN_NAME: { label: "Domeinnaam", value: "DOMEINNAAM" },
    URL: { label: "URL", value: "URL" },
    CREDIT_CARD: {
      label: "Kredietkaartnummer",
      value: "KREDIETKAARTNUMMER",
    },
    IBAN_CODE: { label: "IBAN", value: "IBAN" },
    SWIFT_CODE: { label: "SWIFT/BIC", value: "SWIFT_BIC" },
    CRYPTO: { label: "Cryptowallet", value: "CRYPTO_WALLET" },
    MEDICAL_LICENSE: { label: "Medische licentie", value: "MEDISCHE_LICENTIE" },
    US_HEALTHCARE_NPI: {
      label: "Amerikaans zorgverlenersnummer (NPI)",
      value: "VS_ZORG_NPI",
    },
    BANK_ACCOUNT: { label: "Bankrekening", value: "BANKREKENING" },
    US_BANK_ACCOUNT_NUMBER: {
      label: "Amerikaans bankrekeningnummer",
      value: "VS_BANKREKENINGNUMMER",
    },
    US_BANK_ROUTING: {
      label: "Amerikaanse bankroutingcode",
      value: "VS_BANKROUTING",
    },
    US_SSN: {
      label: "Amerikaans sofinummer (SSN)",
      value: "VS_SOFINUMMER",
    },
    US_ITIN: {
      label: "Amerikaans belastingnummer (ITIN)",
      value: "VS_BELASTINGNUMMER",
    },
    US_PASSPORT: {
      label: "Amerikaans paspoortnummer",
      value: "VS_PASPOORT",
    },
    PASSPORT: { label: "Paspoortnummer", value: "PASPOORTNUMMER" },
    US_DRIVER_LICENSE: {
      label: "Amerikaans rijbewijsnummer",
      value: "VS_RIJBEWIJS",
    },
    UK_NHS: { label: "Brits NHS-nummer", value: "VK_NHS_NUMMER" },
    SG_NRIC_FIN: {
      label: "Singaporees NRIC/FIN-nummer",
      value: "SG_NRIC_FIN",
    },
    ES_NIF: { label: "Spaans NIF-nummer", value: "ES_NIF" },
    ES_NIE: { label: "Spaans NIE-nummer", value: "ES_NIE" },
    ES_CIF: { label: "Spaans CIF-nummer", value: "ES_CIF" },
    IT_FISCAL_CODE: {
      label: "Italiaans fiscaal nummer",
      value: "IT_FISCAAL_NUMMER",
    },
    IT_VAT_CODE: {
      label: "Italiaans btw-nummer",
      value: "IT_BTW_NUMMER",
    },
    IT_IDENTITY_CARD: {
      label: "Italiaanse identiteitskaart",
      value: "IT_IDENTITEITSKAART",
    },
    IT_DRIVER_LICENSE: {
      label: "Italiaans rijbewijsnummer",
      value: "IT_RIJBEWIJS",
    },
    IT_PASSPORT: {
      label: "Italiaans paspoortnummer",
      value: "IT_PASPOORT",
    },
    IN_AADHAAR: {
      label: "Indiaas Aadhaar-nummer",
      value: "IN_AADHAAR",
    },
    IN_PAN: { label: "Indiaas PAN-nummer", value: "IN_PAN" },
    IN_VOTER: {
      label: "Indiaas kiezersnummer",
      value: "IN_KIEZERSNUMMER",
    },
    IN_PASSPORT: {
      label: "Indiaas paspoortnummer",
      value: "IN_PASPOORT",
    },
    NL_BSN: { label: "Nederlands BSN", value: "NL_BSN" },
    AU_TFN: { label: "Australisch TFN", value: "AU_TFN" },
    AU_ABN: { label: "Australisch ABN", value: "AU_ABN" },
    AU_ACN: { label: "Australisch ACN", value: "AU_ACN" },
    AU_MEDICARE_NUMBER: {
      label: "Australisch Medicare-nummer",
      value: "AU_MEDICARE",
    },
    ZIP_CODE: { label: "Postcode", value: "POSTCODE" },
  },
};

export const INITIAL_ENTITY_DISPLAY_LIMIT = 10;
