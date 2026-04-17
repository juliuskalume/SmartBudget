export type CountryOption = {
  code: string;
  iso3: string;
  name: string;
  currency: string;
  latestMonthlyInflationPct: number | null;
  latestInflationMonth: string | null;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
  {
    "code": "AF",
    "iso3": "AFG",
    "name": "Afghanistan",
    "currency": "AFN",
    "latestMonthlyInflationPct": 0.111,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "AL",
    "iso3": "ALB",
    "name": "Albania",
    "currency": "ALL",
    "latestMonthlyInflationPct": 0.311,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "DZ",
    "iso3": "DZA",
    "name": "Algeria",
    "currency": "DZD",
    "latestMonthlyInflationPct": 0.341,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "AS",
    "iso3": "ASM",
    "name": "American Samoa",
    "currency": "USD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "AD",
    "iso3": "AND",
    "name": "Andorra",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "AO",
    "iso3": "AGO",
    "name": "Angola",
    "currency": "AOA",
    "latestMonthlyInflationPct": 1.672,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "AI",
    "iso3": "AIA",
    "name": "Anguilla",
    "currency": "XCD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "AG",
    "iso3": "ATG",
    "name": "Antigua and Barbuda",
    "currency": "XCD",
    "latestMonthlyInflationPct": -2.29,
    "latestInflationMonth": "2024-09"
  },
  {
    "code": "AR",
    "iso3": "ARG",
    "name": "Argentina",
    "currency": "ARS",
    "latestMonthlyInflationPct": 2.211,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "AM",
    "iso3": "ARM",
    "name": "Armenia",
    "currency": "AMD",
    "latestMonthlyInflationPct": 0.055,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "AW",
    "iso3": "ABW",
    "name": "Aruba",
    "currency": "AWG",
    "latestMonthlyInflationPct": 0.173,
    "latestInflationMonth": "2020-02"
  },
  {
    "code": "AU",
    "iso3": "AUS",
    "name": "Australia",
    "currency": "AUD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "AT",
    "iso3": "AUT",
    "name": "Austria",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.157,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "AZ",
    "iso3": "AZE",
    "name": "Azerbaijan",
    "currency": "AZN",
    "latestMonthlyInflationPct": 0.66,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "BS",
    "iso3": "BHS",
    "name": "Bahamas",
    "currency": "BSD",
    "latestMonthlyInflationPct": 0.099,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "BH",
    "iso3": "BHR",
    "name": "Bahrain",
    "currency": "BHD",
    "latestMonthlyInflationPct": 0.296,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "BD",
    "iso3": "BGD",
    "name": "Bangladesh",
    "currency": "BDT",
    "latestMonthlyInflationPct": 1.287,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "BB",
    "iso3": "BRB",
    "name": "Barbados",
    "currency": "BBD",
    "latestMonthlyInflationPct": -0.089,
    "latestInflationMonth": "2024-11"
  },
  {
    "code": "BY",
    "iso3": "BLR",
    "name": "Belarus",
    "currency": "BYN",
    "latestMonthlyInflationPct": 0.564,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "BE",
    "iso3": "BEL",
    "name": "Belgium",
    "currency": "EUR",
    "latestMonthlyInflationPct": -0.074,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "BZ",
    "iso3": "BLZ",
    "name": "Belize",
    "currency": "BZD",
    "latestMonthlyInflationPct": 0.0,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "BJ",
    "iso3": "BEN",
    "name": "Benin",
    "currency": "XOF",
    "latestMonthlyInflationPct": -1.072,
    "latestInflationMonth": "2024-09"
  },
  {
    "code": "BM",
    "iso3": "BMU",
    "name": "Bermuda",
    "currency": "BMD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "BT",
    "iso3": "BTN",
    "name": "Bhutan",
    "currency": "BTN",
    "latestMonthlyInflationPct": 0.554,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "BO",
    "iso3": "BOL",
    "name": "Bolivia",
    "currency": "BOB",
    "latestMonthlyInflationPct": 1.708,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "BA",
    "iso3": "BIH",
    "name": "Bosnia and Herzegovina",
    "currency": "BAM",
    "latestMonthlyInflationPct": 0.743,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "BW",
    "iso3": "BWA",
    "name": "Botswana",
    "currency": "BWP",
    "latestMonthlyInflationPct": 0.279,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "BR",
    "iso3": "BRA",
    "name": "Brazil",
    "currency": "BRL",
    "latestMonthlyInflationPct": 0.56,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "IO",
    "iso3": "IOT",
    "name": "British Indian Ocean Territory",
    "currency": "USD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "VG",
    "iso3": "VGB",
    "name": "British Virgin Islands",
    "currency": "USD",
    "latestMonthlyInflationPct": -0.234,
    "latestInflationMonth": "2017-05"
  },
  {
    "code": "BN",
    "iso3": "BRN",
    "name": "Brunei",
    "currency": "BND",
    "latestMonthlyInflationPct": 0.279,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "BG",
    "iso3": "BGR",
    "name": "Bulgaria",
    "currency": "BGN",
    "latestMonthlyInflationPct": 0.152,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "BF",
    "iso3": "BFA",
    "name": "Burkina Faso",
    "currency": "XOF",
    "latestMonthlyInflationPct": -0.388,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "BI",
    "iso3": "BDI",
    "name": "Burundi",
    "currency": "BIF",
    "latestMonthlyInflationPct": 7.372,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "KH",
    "iso3": "KHM",
    "name": "Cambodia",
    "currency": "KHR",
    "latestMonthlyInflationPct": 0.375,
    "latestInflationMonth": "2024-07"
  },
  {
    "code": "CM",
    "iso3": "CMR",
    "name": "Cameroon",
    "currency": "XAF",
    "latestMonthlyInflationPct": 0.758,
    "latestInflationMonth": "2024-09"
  },
  {
    "code": "CA",
    "iso3": "CAN",
    "name": "Canada",
    "currency": "CAD",
    "latestMonthlyInflationPct": 0.307,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "CV",
    "iso3": "CPV",
    "name": "Cape Verde",
    "currency": "CVE",
    "latestMonthlyInflationPct": 0.424,
    "latestInflationMonth": "2024-10"
  },
  {
    "code": "BQ",
    "iso3": "BES",
    "name": "Caribbean Netherlands",
    "currency": "USD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "KY",
    "iso3": "CYM",
    "name": "Cayman Islands",
    "currency": "KYD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "CF",
    "iso3": "CAF",
    "name": "Central African Republic",
    "currency": "XAF",
    "latestMonthlyInflationPct": 1.311,
    "latestInflationMonth": "2024-10"
  },
  {
    "code": "TD",
    "iso3": "TCD",
    "name": "Chad",
    "currency": "XAF",
    "latestMonthlyInflationPct": -0.666,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "CL",
    "iso3": "CHL",
    "name": "Chile",
    "currency": "CLP",
    "latestMonthlyInflationPct": 0.393,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "CN",
    "iso3": "CHN",
    "name": "China",
    "currency": "CNY",
    "latestMonthlyInflationPct": -0.193,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "CX",
    "iso3": "CXR",
    "name": "Christmas Island",
    "currency": "AUD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "CC",
    "iso3": "CCK",
    "name": "Cocos (Keeling) Islands",
    "currency": "AUD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "CO",
    "iso3": "COL",
    "name": "Colombia",
    "currency": "COP",
    "latestMonthlyInflationPct": 0.524,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "KM",
    "iso3": "COM",
    "name": "Comoros",
    "currency": "KMF",
    "latestMonthlyInflationPct": -2.516,
    "latestInflationMonth": "2014-10"
  },
  {
    "code": "CK",
    "iso3": "COK",
    "name": "Cook Islands",
    "currency": "CKD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "CR",
    "iso3": "CRI",
    "name": "Costa Rica",
    "currency": "CRC",
    "latestMonthlyInflationPct": 0.361,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "HR",
    "iso3": "HRV",
    "name": "Croatia",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.379,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "CU",
    "iso3": "CUB",
    "name": "Cuba",
    "currency": "CUC",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "CW",
    "iso3": "CUW",
    "name": "Curaçao",
    "currency": "ANG",
    "latestMonthlyInflationPct": -0.299,
    "latestInflationMonth": "2020-02"
  },
  {
    "code": "CY",
    "iso3": "CYP",
    "name": "Cyprus",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.12,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "CZ",
    "iso3": "CZE",
    "name": "Czechia",
    "currency": "CZK",
    "latestMonthlyInflationPct": 0.065,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "CD",
    "iso3": "COD",
    "name": "DR Congo",
    "currency": "CDF",
    "latestMonthlyInflationPct": 1.941,
    "latestInflationMonth": "2017-02"
  },
  {
    "code": "DK",
    "iso3": "DNK",
    "name": "Denmark",
    "currency": "DKK",
    "latestMonthlyInflationPct": -0.497,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "DJ",
    "iso3": "DJI",
    "name": "Djibouti",
    "currency": "DJF",
    "latestMonthlyInflationPct": 0.065,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "DM",
    "iso3": "DMA",
    "name": "Dominica",
    "currency": "XCD",
    "latestMonthlyInflationPct": 1.163,
    "latestInflationMonth": "2024-01"
  },
  {
    "code": "DO",
    "iso3": "DOM",
    "name": "Dominican Republic",
    "currency": "DOP",
    "latestMonthlyInflationPct": 0.323,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "EC",
    "iso3": "ECU",
    "name": "Ecuador",
    "currency": "USD",
    "latestMonthlyInflationPct": 0.086,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "EG",
    "iso3": "EGY",
    "name": "Egypt",
    "currency": "EGP",
    "latestMonthlyInflationPct": 2.118,
    "latestInflationMonth": "2024-09"
  },
  {
    "code": "SV",
    "iso3": "SLV",
    "name": "El Salvador",
    "currency": "USD",
    "latestMonthlyInflationPct": -0.061,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "GQ",
    "iso3": "GNQ",
    "name": "Equatorial Guinea",
    "currency": "XAF",
    "latestMonthlyInflationPct": 0.448,
    "latestInflationMonth": "2023-09"
  },
  {
    "code": "ER",
    "iso3": "ERI",
    "name": "Eritrea",
    "currency": "ERN",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "EE",
    "iso3": "EST",
    "name": "Estonia",
    "currency": "EUR",
    "latestMonthlyInflationPct": -0.475,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "SZ",
    "iso3": "SWZ",
    "name": "Eswatini",
    "currency": "SZL",
    "latestMonthlyInflationPct": 0.36,
    "latestInflationMonth": "2020-09"
  },
  {
    "code": "ET",
    "iso3": "ETH",
    "name": "Ethiopia",
    "currency": "ETB",
    "latestMonthlyInflationPct": 2.798,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "FK",
    "iso3": "FLK",
    "name": "Falkland Islands",
    "currency": "FKP",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "FO",
    "iso3": "FRO",
    "name": "Faroe Islands",
    "currency": "DKK",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "FJ",
    "iso3": "FJI",
    "name": "Fiji",
    "currency": "FJD",
    "latestMonthlyInflationPct": -0.649,
    "latestInflationMonth": "2024-01"
  },
  {
    "code": "FI",
    "iso3": "FIN",
    "name": "Finland",
    "currency": "EUR",
    "latestMonthlyInflationPct": -0.041,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "FR",
    "iso3": "FRA",
    "name": "France",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.183,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "GF",
    "iso3": "GUF",
    "name": "French Guiana",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "PF",
    "iso3": "PYF",
    "name": "French Polynesia",
    "currency": "XPF",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "TF",
    "iso3": "ATF",
    "name": "French Southern and Antarctic Lands",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "GA",
    "iso3": "GAB",
    "name": "Gabon",
    "currency": "XAF",
    "latestMonthlyInflationPct": -0.041,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "GM",
    "iso3": "GMB",
    "name": "Gambia",
    "currency": "GMD",
    "latestMonthlyInflationPct": 0.0,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "GE",
    "iso3": "GEO",
    "name": "Georgia",
    "currency": "GEL",
    "latestMonthlyInflationPct": 0.672,
    "latestInflationMonth": "2024-07"
  },
  {
    "code": "DE",
    "iso3": "DEU",
    "name": "Germany",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.331,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "GH",
    "iso3": "GHA",
    "name": "Ghana",
    "currency": "GHS",
    "latestMonthlyInflationPct": 1.306,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "GI",
    "iso3": "GIB",
    "name": "Gibraltar",
    "currency": "GIP",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "GR",
    "iso3": "GRC",
    "name": "Greece",
    "currency": "EUR",
    "latestMonthlyInflationPct": 1.43,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "GL",
    "iso3": "GRL",
    "name": "Greenland",
    "currency": "DKK",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "GD",
    "iso3": "GRD",
    "name": "Grenada",
    "currency": "XCD",
    "latestMonthlyInflationPct": -0.025,
    "latestInflationMonth": "2024-10"
  },
  {
    "code": "GP",
    "iso3": "GLP",
    "name": "Guadeloupe",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "GU",
    "iso3": "GUM",
    "name": "Guam",
    "currency": "USD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "GT",
    "iso3": "GTM",
    "name": "Guatemala",
    "currency": "GTQ",
    "latestMonthlyInflationPct": 0.157,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "GG",
    "iso3": "GGY",
    "name": "Guernsey",
    "currency": "GBP",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "GN",
    "iso3": "GIN",
    "name": "Guinea",
    "currency": "GNF",
    "latestMonthlyInflationPct": 0.123,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "GW",
    "iso3": "GNB",
    "name": "Guinea-Bissau",
    "currency": "XOF",
    "latestMonthlyInflationPct": -0.079,
    "latestInflationMonth": "2023-11"
  },
  {
    "code": "GY",
    "iso3": "GUY",
    "name": "Guyana",
    "currency": "GYD",
    "latestMonthlyInflationPct": 0.028,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "HT",
    "iso3": "HTI",
    "name": "Haiti",
    "currency": "HTG",
    "latestMonthlyInflationPct": 2.02,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "HN",
    "iso3": "HND",
    "name": "Honduras",
    "currency": "HNL",
    "latestMonthlyInflationPct": 0.244,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "HK",
    "iso3": "HKG",
    "name": "Hong Kong",
    "currency": "HKD",
    "latestMonthlyInflationPct": -0.092,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "HU",
    "iso3": "HUN",
    "name": "Hungary",
    "currency": "HUF",
    "latestMonthlyInflationPct": -0.043,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "IS",
    "iso3": "ISL",
    "name": "Iceland",
    "currency": "ISK",
    "latestMonthlyInflationPct": 0.374,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "IN",
    "iso3": "IND",
    "name": "India",
    "currency": "INR",
    "latestMonthlyInflationPct": -0.279,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "ID",
    "iso3": "IDN",
    "name": "Indonesia",
    "currency": "IDR",
    "latestMonthlyInflationPct": 1.65,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "IR",
    "iso3": "IRN",
    "name": "Iran",
    "currency": "IRR",
    "latestMonthlyInflationPct": 3.339,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "IQ",
    "iso3": "IRQ",
    "name": "Iraq",
    "currency": "IQD",
    "latestMonthlyInflationPct": -0.553,
    "latestInflationMonth": "2024-09"
  },
  {
    "code": "IE",
    "iso3": "IRL",
    "name": "Ireland",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.69,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "IM",
    "iso3": "IMN",
    "name": "Isle of Man",
    "currency": "GBP",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "IL",
    "iso3": "ISR",
    "name": "Israel",
    "currency": "ILS",
    "latestMonthlyInflationPct": 0.493,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "IT",
    "iso3": "ITA",
    "name": "Italy",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.328,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "CI",
    "iso3": "CIV",
    "name": "Ivory Coast",
    "currency": "XOF",
    "latestMonthlyInflationPct": 0.384,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "JM",
    "iso3": "JAM",
    "name": "Jamaica",
    "currency": "JMD",
    "latestMonthlyInflationPct": -0.279,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "JP",
    "iso3": "JPN",
    "name": "Japan",
    "currency": "JPY",
    "latestMonthlyInflationPct": -0.36,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "JE",
    "iso3": "JEY",
    "name": "Jersey",
    "currency": "GBP",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "JO",
    "iso3": "JOR",
    "name": "Jordan",
    "currency": "JOD",
    "latestMonthlyInflationPct": 0.39,
    "latestInflationMonth": "2024-11"
  },
  {
    "code": "KZ",
    "iso3": "KAZ",
    "name": "Kazakhstan",
    "currency": "KZT",
    "latestMonthlyInflationPct": 0.0,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "KE",
    "iso3": "KEN",
    "name": "Kenya",
    "currency": "KES",
    "latestMonthlyInflationPct": 0.722,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "KI",
    "iso3": "KIR",
    "name": "Kiribati",
    "currency": "AUD",
    "latestMonthlyInflationPct": -0.124,
    "latestInflationMonth": "2024-09"
  },
  {
    "code": "XK",
    "iso3": "UNK",
    "name": "Kosovo",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "KW",
    "iso3": "KWT",
    "name": "Kuwait",
    "currency": "KWD",
    "latestMonthlyInflationPct": 0.96,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "KG",
    "iso3": "KGZ",
    "name": "Kyrgyzstan",
    "currency": "KGS",
    "latestMonthlyInflationPct": 0.305,
    "latestInflationMonth": "2023-12"
  },
  {
    "code": "LA",
    "iso3": "LAO",
    "name": "Laos",
    "currency": "LAK",
    "latestMonthlyInflationPct": -0.062,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "LV",
    "iso3": "LVA",
    "name": "Latvia",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.879,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "LB",
    "iso3": "LBN",
    "name": "Lebanon",
    "currency": "LBP",
    "latestMonthlyInflationPct": 0.022,
    "latestInflationMonth": "2023-12"
  },
  {
    "code": "LS",
    "iso3": "LSO",
    "name": "Lesotho",
    "currency": "LSL",
    "latestMonthlyInflationPct": 0.526,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "LR",
    "iso3": "LBR",
    "name": "Liberia",
    "currency": "LRD",
    "latestMonthlyInflationPct": 2.069,
    "latestInflationMonth": "2024-06"
  },
  {
    "code": "LY",
    "iso3": "LBY",
    "name": "Libya",
    "currency": "LYD",
    "latestMonthlyInflationPct": 0.066,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "LI",
    "iso3": "LIE",
    "name": "Liechtenstein",
    "currency": "CHF",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "LT",
    "iso3": "LTU",
    "name": "Lithuania",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.402,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "LU",
    "iso3": "LUX",
    "name": "Luxembourg",
    "currency": "EUR",
    "latestMonthlyInflationPct": -0.161,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "MO",
    "iso3": "MAC",
    "name": "Macau",
    "currency": "MOP",
    "latestMonthlyInflationPct": 0.216,
    "latestInflationMonth": "2024-07"
  },
  {
    "code": "MG",
    "iso3": "MDG",
    "name": "Madagascar",
    "currency": "MGA",
    "latestMonthlyInflationPct": 0.964,
    "latestInflationMonth": "2023-12"
  },
  {
    "code": "MW",
    "iso3": "MWI",
    "name": "Malawi",
    "currency": "MWK",
    "latestMonthlyInflationPct": 4.548,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "MY",
    "iso3": "MYS",
    "name": "Malaysia",
    "currency": "MYR",
    "latestMonthlyInflationPct": 0.374,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "MV",
    "iso3": "MDV",
    "name": "Maldives",
    "currency": "MVR",
    "latestMonthlyInflationPct": 0.273,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "ML",
    "iso3": "MLI",
    "name": "Mali",
    "currency": "XOF",
    "latestMonthlyInflationPct": -0.565,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "MT",
    "iso3": "MLT",
    "name": "Malta",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.31,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "MH",
    "iso3": "MHL",
    "name": "Marshall Islands",
    "currency": "USD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "MQ",
    "iso3": "MTQ",
    "name": "Martinique",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "MR",
    "iso3": "MRT",
    "name": "Mauritania",
    "currency": "MRU",
    "latestMonthlyInflationPct": 0.21,
    "latestInflationMonth": "2024-01"
  },
  {
    "code": "MU",
    "iso3": "MUS",
    "name": "Mauritius",
    "currency": "MUR",
    "latestMonthlyInflationPct": 1.449,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "YT",
    "iso3": "MYT",
    "name": "Mayotte",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "MX",
    "iso3": "MEX",
    "name": "Mexico",
    "currency": "MXN",
    "latestMonthlyInflationPct": 0.277,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "FM",
    "iso3": "FSM",
    "name": "Micronesia",
    "currency": "USD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "MD",
    "iso3": "MDA",
    "name": "Moldova",
    "currency": "MDL",
    "latestMonthlyInflationPct": 2.818,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "MC",
    "iso3": "MCO",
    "name": "Monaco",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "MN",
    "iso3": "MNG",
    "name": "Mongolia",
    "currency": "MNT",
    "latestMonthlyInflationPct": 1.369,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "ME",
    "iso3": "MNE",
    "name": "Montenegro",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.423,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "MS",
    "iso3": "MSR",
    "name": "Montserrat",
    "currency": "XCD",
    "latestMonthlyInflationPct": -0.076,
    "latestInflationMonth": "2024-09"
  },
  {
    "code": "MA",
    "iso3": "MAR",
    "name": "Morocco",
    "currency": "MAD",
    "latestMonthlyInflationPct": -0.168,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "MZ",
    "iso3": "MOZ",
    "name": "Mozambique",
    "currency": "MZN",
    "latestMonthlyInflationPct": -0.107,
    "latestInflationMonth": "2024-08"
  },
  {
    "code": "MM",
    "iso3": "MMR",
    "name": "Myanmar",
    "currency": "MMK",
    "latestMonthlyInflationPct": -0.109,
    "latestInflationMonth": "2020-11"
  },
  {
    "code": "NA",
    "iso3": "NAM",
    "name": "Namibia",
    "currency": "NAD",
    "latestMonthlyInflationPct": 0.536,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "NR",
    "iso3": "NRU",
    "name": "Nauru",
    "currency": "AUD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "NP",
    "iso3": "NPL",
    "name": "Nepal",
    "currency": "NPR",
    "latestMonthlyInflationPct": 0.405,
    "latestInflationMonth": "2024-07"
  },
  {
    "code": "NL",
    "iso3": "NLD",
    "name": "Netherlands",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.399,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "NC",
    "iso3": "NCL",
    "name": "New Caledonia",
    "currency": "XPF",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "NZ",
    "iso3": "NZL",
    "name": "New Zealand",
    "currency": "NZD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "NI",
    "iso3": "NIC",
    "name": "Nicaragua",
    "currency": "NIO",
    "latestMonthlyInflationPct": -0.299,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "NE",
    "iso3": "NER",
    "name": "Niger",
    "currency": "XOF",
    "latestMonthlyInflationPct": 1.761,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "NG",
    "iso3": "NGA",
    "name": "Nigeria",
    "currency": "NGN",
    "latestMonthlyInflationPct": 2.444,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "NU",
    "iso3": "NIU",
    "name": "Niue",
    "currency": "NZD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "NF",
    "iso3": "NFK",
    "name": "Norfolk Island",
    "currency": "AUD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "KP",
    "iso3": "PRK",
    "name": "North Korea",
    "currency": "KPW",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "MK",
    "iso3": "MKD",
    "name": "North Macedonia",
    "currency": "MKD",
    "latestMonthlyInflationPct": 0.48,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "MP",
    "iso3": "MNP",
    "name": "Northern Mariana Islands",
    "currency": "USD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "NO",
    "iso3": "NOR",
    "name": "Norway",
    "currency": "NOK",
    "latestMonthlyInflationPct": -0.657,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "OM",
    "iso3": "OMN",
    "name": "Oman",
    "currency": "OMR",
    "latestMonthlyInflationPct": -0.094,
    "latestInflationMonth": "2024-11"
  },
  {
    "code": "PK",
    "iso3": "PAK",
    "name": "Pakistan",
    "currency": "PKR",
    "latestMonthlyInflationPct": 0.888,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "PW",
    "iso3": "PLW",
    "name": "Palau",
    "currency": "USD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "PS",
    "iso3": "PSE",
    "name": "Palestine",
    "currency": "EGP",
    "latestMonthlyInflationPct": 8.197,
    "latestInflationMonth": "2024-02"
  },
  {
    "code": "PA",
    "iso3": "PAN",
    "name": "Panama",
    "currency": "PAB",
    "latestMonthlyInflationPct": 0.08,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "PG",
    "iso3": "PNG",
    "name": "Papua New Guinea",
    "currency": "PGK",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "PY",
    "iso3": "PRY",
    "name": "Paraguay",
    "currency": "PYG",
    "latestMonthlyInflationPct": 0.441,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "PE",
    "iso3": "PER",
    "name": "Peru",
    "currency": "PEN",
    "latestMonthlyInflationPct": 0.81,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "PH",
    "iso3": "PHL",
    "name": "Philippines",
    "currency": "PHP",
    "latestMonthlyInflationPct": -0.234,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "PN",
    "iso3": "PCN",
    "name": "Pitcairn Islands",
    "currency": "NZD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "PL",
    "iso3": "POL",
    "name": "Poland",
    "currency": "PLN",
    "latestMonthlyInflationPct": 0.208,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "PT",
    "iso3": "PRT",
    "name": "Portugal",
    "currency": "EUR",
    "latestMonthlyInflationPct": 1.422,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "PR",
    "iso3": "PRI",
    "name": "Puerto Rico",
    "currency": "USD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "QA",
    "iso3": "QAT",
    "name": "Qatar",
    "currency": "QAR",
    "latestMonthlyInflationPct": -2.531,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "CG",
    "iso3": "COG",
    "name": "Republic of the Congo",
    "currency": "XAF",
    "latestMonthlyInflationPct": -0.168,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "RO",
    "iso3": "ROU",
    "name": "Romania",
    "currency": "RON",
    "latestMonthlyInflationPct": 0.884,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "RU",
    "iso3": "RUS",
    "name": "Russia",
    "currency": "RUB",
    "latestMonthlyInflationPct": 11.967,
    "latestInflationMonth": "2024-11"
  },
  {
    "code": "RW",
    "iso3": "RWA",
    "name": "Rwanda",
    "currency": "RWF",
    "latestMonthlyInflationPct": 1.855,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "RE",
    "iso3": "REU",
    "name": "Réunion",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "BL",
    "iso3": "BLM",
    "name": "Saint Barthélemy",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "SH",
    "iso3": "SHN",
    "name": "Saint Helena, Ascension and Tristan da Cunha",
    "currency": "GBP",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "KN",
    "iso3": "KNA",
    "name": "Saint Kitts and Nevis",
    "currency": "XCD",
    "latestMonthlyInflationPct": 0.385,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "LC",
    "iso3": "LCA",
    "name": "Saint Lucia",
    "currency": "XCD",
    "latestMonthlyInflationPct": -0.534,
    "latestInflationMonth": "2024-09"
  },
  {
    "code": "MF",
    "iso3": "MAF",
    "name": "Saint Martin",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "PM",
    "iso3": "SPM",
    "name": "Saint Pierre and Miquelon",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "VC",
    "iso3": "VCT",
    "name": "Saint Vincent and the Grenadines",
    "currency": "XCD",
    "latestMonthlyInflationPct": -0.386,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "WS",
    "iso3": "WSM",
    "name": "Samoa",
    "currency": "WST",
    "latestMonthlyInflationPct": 0.96,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "SM",
    "iso3": "SMR",
    "name": "San Marino",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.362,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "SA",
    "iso3": "SAU",
    "name": "Saudi Arabia",
    "currency": "SAR",
    "latestMonthlyInflationPct": 0.257,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "SN",
    "iso3": "SEN",
    "name": "Senegal",
    "currency": "XOF",
    "latestMonthlyInflationPct": -0.495,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "RS",
    "iso3": "SRB",
    "name": "Serbia",
    "currency": "RSD",
    "latestMonthlyInflationPct": 0.071,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "SC",
    "iso3": "SYC",
    "name": "Seychelles",
    "currency": "SCR",
    "latestMonthlyInflationPct": -0.275,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "SL",
    "iso3": "SLE",
    "name": "Sierra Leone",
    "currency": "SLE",
    "latestMonthlyInflationPct": 0.243,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "SG",
    "iso3": "SGP",
    "name": "Singapore",
    "currency": "SGD",
    "latestMonthlyInflationPct": 0.347,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "SX",
    "iso3": "SXM",
    "name": "Sint Maarten",
    "currency": "ANG",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "SK",
    "iso3": "SVK",
    "name": "Slovakia",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.291,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "SI",
    "iso3": "SVN",
    "name": "Slovenia",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.627,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "SB",
    "iso3": "SLB",
    "name": "Solomon Islands",
    "currency": "SBD",
    "latestMonthlyInflationPct": -0.866,
    "latestInflationMonth": "2024-03"
  },
  {
    "code": "SO",
    "iso3": "SOM",
    "name": "Somalia",
    "currency": "SOS",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "ZA",
    "iso3": "ZAF",
    "name": "South Africa",
    "currency": "ZAR",
    "latestMonthlyInflationPct": 0.3,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "GS",
    "iso3": "SGS",
    "name": "South Georgia",
    "currency": "GBP",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "KR",
    "iso3": "KOR",
    "name": "South Korea",
    "currency": "KRW",
    "latestMonthlyInflationPct": 0.181,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "SS",
    "iso3": "SSD",
    "name": "South Sudan",
    "currency": "SSP",
    "latestMonthlyInflationPct": 0.0,
    "latestInflationMonth": "2024-10"
  },
  {
    "code": "ES",
    "iso3": "ESP",
    "name": "Spain",
    "currency": "EUR",
    "latestMonthlyInflationPct": 0.059,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "LK",
    "iso3": "LKA",
    "name": "Sri Lanka",
    "currency": "LKR",
    "latestMonthlyInflationPct": -0.208,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "SD",
    "iso3": "SDN",
    "name": "Sudan",
    "currency": "SDG",
    "latestMonthlyInflationPct": 1.753,
    "latestInflationMonth": "2023-02"
  },
  {
    "code": "SR",
    "iso3": "SUR",
    "name": "Suriname",
    "currency": "SRD",
    "latestMonthlyInflationPct": 0.464,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "SJ",
    "iso3": "SJM",
    "name": "Svalbard and Jan Mayen",
    "currency": "NOK",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "SE",
    "iso3": "SWE",
    "name": "Sweden",
    "currency": "SEK",
    "latestMonthlyInflationPct": -0.687,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "CH",
    "iso3": "CHE",
    "name": "Switzerland",
    "currency": "CHF",
    "latestMonthlyInflationPct": 0.049,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "SY",
    "iso3": "SYR",
    "name": "Syria",
    "currency": "SYP",
    "latestMonthlyInflationPct": 14.964,
    "latestInflationMonth": "2019-12"
  },
  {
    "code": "ST",
    "iso3": "STP",
    "name": "São Tomé and Príncipe",
    "currency": "STN",
    "latestMonthlyInflationPct": 1.521,
    "latestInflationMonth": "2024-02"
  },
  {
    "code": "TW",
    "iso3": "TWN",
    "name": "Taiwan",
    "currency": "TWD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "TJ",
    "iso3": "TJK",
    "name": "Tajikistan",
    "currency": "TJS",
    "latestMonthlyInflationPct": 0.198,
    "latestInflationMonth": "2024-11"
  },
  {
    "code": "TZ",
    "iso3": "TZA",
    "name": "Tanzania",
    "currency": "TZS",
    "latestMonthlyInflationPct": 0.604,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "TH",
    "iso3": "THA",
    "name": "Thailand",
    "currency": "THB",
    "latestMonthlyInflationPct": -1.344,
    "latestInflationMonth": "2024-09"
  },
  {
    "code": "TL",
    "iso3": "TLS",
    "name": "Timor-Leste",
    "currency": "USD",
    "latestMonthlyInflationPct": 0.161,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "TG",
    "iso3": "TGO",
    "name": "Togo",
    "currency": "XOF",
    "latestMonthlyInflationPct": -1.377,
    "latestInflationMonth": "2024-09"
  },
  {
    "code": "TK",
    "iso3": "TKL",
    "name": "Tokelau",
    "currency": "NZD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "TO",
    "iso3": "TON",
    "name": "Tonga",
    "currency": "TOP",
    "latestMonthlyInflationPct": 2.524,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "TT",
    "iso3": "TTO",
    "name": "Trinidad and Tobago",
    "currency": "TTD",
    "latestMonthlyInflationPct": 0.08,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "TN",
    "iso3": "TUN",
    "name": "Tunisia",
    "currency": "TND",
    "latestMonthlyInflationPct": -0.11,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "TR",
    "iso3": "TUR",
    "name": "Turkey",
    "currency": "TRY",
    "latestMonthlyInflationPct": 2.46,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "TM",
    "iso3": "TKM",
    "name": "Turkmenistan",
    "currency": "TMT",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "TC",
    "iso3": "TCA",
    "name": "Turks and Caicos Islands",
    "currency": "USD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "TV",
    "iso3": "TUV",
    "name": "Tuvalu",
    "currency": "AUD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "UG",
    "iso3": "UGA",
    "name": "Uganda",
    "currency": "UGX",
    "latestMonthlyInflationPct": 0.181,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "UA",
    "iso3": "UKR",
    "name": "Ukraine",
    "currency": "UAH",
    "latestMonthlyInflationPct": 1.498,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "AE",
    "iso3": "ARE",
    "name": "United Arab Emirates",
    "currency": "AED",
    "latestMonthlyInflationPct": 0.093,
    "latestInflationMonth": "2024-12"
  },
  {
    "code": "GB",
    "iso3": "GBR",
    "name": "United Kingdom",
    "currency": "GBP",
    "latestMonthlyInflationPct": 0.369,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "US",
    "iso3": "USA",
    "name": "United States",
    "currency": "USD",
    "latestMonthlyInflationPct": 0.369,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "UM",
    "iso3": "UMI",
    "name": "United States Minor Outlying Islands",
    "currency": "USD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "VI",
    "iso3": "VIR",
    "name": "United States Virgin Islands",
    "currency": "USD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "UY",
    "iso3": "URY",
    "name": "Uruguay",
    "currency": "UYU",
    "latestMonthlyInflationPct": 0.691,
    "latestInflationMonth": "2025-02"
  },
  {
    "code": "UZ",
    "iso3": "UZB",
    "name": "Uzbekistan",
    "currency": "UZS",
    "latestMonthlyInflationPct": 0.72,
    "latestInflationMonth": "2025-01"
  },
  {
    "code": "VU",
    "iso3": "VUT",
    "name": "Vanuatu",
    "currency": "VUV",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "VA",
    "iso3": "VAT",
    "name": "Vatican City",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "VE",
    "iso3": "VEN",
    "name": "Venezuela",
    "currency": "VES",
    "latestMonthlyInflationPct": 15.1,
    "latestInflationMonth": "2016-12"
  },
  {
    "code": "VN",
    "iso3": "VNM",
    "name": "Vietnam",
    "currency": "VND",
    "latestMonthlyInflationPct": -0.026,
    "latestInflationMonth": "2025-03"
  },
  {
    "code": "WF",
    "iso3": "WLF",
    "name": "Wallis and Futuna",
    "currency": "XPF",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "EH",
    "iso3": "ESH",
    "name": "Western Sahara",
    "currency": "DZD",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  },
  {
    "code": "YE",
    "iso3": "YEM",
    "name": "Yemen",
    "currency": "YER",
    "latestMonthlyInflationPct": 23.908,
    "latestInflationMonth": "2015-12"
  },
  {
    "code": "ZM",
    "iso3": "ZMB",
    "name": "Zambia",
    "currency": "ZMW",
    "latestMonthlyInflationPct": 1.602,
    "latestInflationMonth": "2024-11"
  },
  {
    "code": "ZW",
    "iso3": "ZWE",
    "name": "Zimbabwe",
    "currency": "ZWL",
    "latestMonthlyInflationPct": -6.154,
    "latestInflationMonth": "2023-08"
  },
  {
    "code": "AX",
    "iso3": "ALA",
    "name": "Åland Islands",
    "currency": "EUR",
    "latestMonthlyInflationPct": null,
    "latestInflationMonth": null
  }
] as CountryOption[];

export const DEFAULT_COUNTRY_CODE = 'TR';
