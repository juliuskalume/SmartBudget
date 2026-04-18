import type { Bank } from "../types";

export const BANKS_BY_COUNTRY: Record<string, Bank[]> = {
  TR: [
    {
      id: "tr-ziraat",
      name: "Ziraat Bankası",
      code: "TCZBTR2A",
      country: "TR",
      iban: "TR330001001000000000000001",
      swift: "TCZBTR2A",
      description: "Türkiye Cumhuriyeti Ziraat Bankası A.Ş.",
    },
    {
      id: "tr-garanti",
      name: "Garanti BBVA",
      code: "TGBATRIS",
      country: "TR",
      iban: "TR330006200000000000000001",
      swift: "TGBATRIS",
      description: "Türkiye Garanti Bankası A.Ş.",
    },
    {
      id: "tr-isbank",
      name: "Türkiye İş Bankası",
      code: "ISBKTRIS",
      country: "TR",
      iban: "TR330006400000000000000001",
      swift: "ISBKTRIS",
      description: "Türkiye İş Bankası A.Ş.",
    },
    {
      id: "tr-akbank",
      name: "Akbank T.A.Ş.",
      code: "AKBKTRIS",
      country: "TR",
      iban: "TR330004600000000000000001",
      swift: "AKBKTRIS",
      description: "Akbank T.A.Ş.",
    },
    {
      id: "tr-yapikredi",
      name: "Yapı ve Kredi Bankası",
      code: "YAPITRIS",
      country: "TR",
      iban: "TR330006701000000000000001",
      swift: "YAPITRIS",
      description: "Yapı ve Kredi Bankası A.Ş.",
    },
  ],
  US: [
    {
      id: "us-chase",
      name: "JPMorgan Chase Bank",
      code: "CHASUS33",
      country: "US",
      iban: "US123456789012345678901234",
      swift: "CHASUS33",
      description: "JPMorgan Chase Bank, N.A.",
    },
    {
      id: "us-bank-of-america",
      name: "Bank of America",
      code: "BOFAUS3N",
      country: "US",
      iban: "US123456789012345678901235",
      swift: "BOFAUS3N",
      description: "Bank of America, N.A.",
    },
    {
      id: "us-wells-fargo",
      name: "Wells Fargo Bank",
      code: "WFBIUS6S",
      country: "US",
      iban: "US123456789012345678901236",
      swift: "WFBIUS6S",
      description: "Wells Fargo Bank, N.A.",
    },
  ],
  GB: [
    {
      id: "gb-barclays",
      name: "Barclays Bank",
      code: "BARCGB22",
      country: "GB",
      iban: "GB29RBOS60161331926819",
      swift: "BARCGB22",
      description: "Barclays Bank PLC",
    },
    {
      id: "gb-hsbc",
      name: "HSBC Bank",
      code: "MIDLGB22",
      country: "GB",
      iban: "GB29MIDL40051512345678",
      swift: "MIDLGB22",
      description: "HSBC Bank plc",
    },
  ],
  DE: [
    {
      id: "de-deutsche",
      name: "Deutsche Bank",
      code: "DEUTDEFF",
      country: "DE",
      iban: "DE89370400440532013000",
      swift: "DEUTDEFF",
      description: "Deutsche Bank AG",
    },
    {
      id: "de-commerzbank",
      name: "Commerzbank",
      code: "COBADEFF",
      country: "DE",
      iban: "DE89370400440532013001",
      swift: "COBADEFF",
      description: "Commerzbank AG",
    },
  ],
  FR: [
    {
      id: "fr-bnp",
      name: "BNP Paribas",
      code: "BNPAFRPP",
      country: "FR",
      iban: "FR7630006000011234567890189",
      swift: "BNPAFRPP",
      description: "BNP Paribas SA",
    },
    {
      id: "fr-societe-generale",
      name: "Société Générale",
      code: "SOGEFRPP",
      country: "FR",
      iban: "FR7630006000011234567890190",
      swift: "SOGEFRPP",
      description: "Société Générale SA",
    },
  ],
};

export function getBanksForCountry(countryCode: string): Bank[] {
  return BANKS_BY_COUNTRY[countryCode] || [];
}

export function getBankById(bankId: string): Bank | undefined {
  for (const banks of Object.values(BANKS_BY_COUNTRY)) {
    const bank = banks.find(b => b.id === bankId);
    if (bank) return bank;
  }
  return undefined;
}
