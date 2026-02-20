export type CurrencyCode =
    | "AUD" | "BRL" | "CAD" | "CHF" | "CNY" | "CZK" | "DKK" | "EUR" | "GBP" | "HKD"
    | "HUF" | "IDR" | "ILS" | "INR" | "ISK" | "JPY" | "KRW" | "MXN" | "MYR" | "NOK"
    | "NZD" | "PHP" | "PLN" | "RON" | "SEK" | "SGD" | "THB" | "TRY" | "USD" | "ZAR";

export type CurrencyMeta = {
    name: string;
    symbol: string;
    symbolNarrow?: string;
};

export const CURRENCY_META: Record<CurrencyCode, CurrencyMeta> = {
    AUD: {name: "Australian Dollar", symbol: "$", symbolNarrow: "A$"},
    BRL: {name: "Brazilian Real", symbol: "R$"},
    CAD: {name: "Canadian Dollar", symbol: "$", symbolNarrow: "C$"},
    CHF: {name: "Swiss Franc", symbol: "CHF"},
    CNY: {name: "Chinese Renminbi Yuan", symbol: "¥", symbolNarrow: "CN¥"},
    CZK: {name: "Czech Koruna", symbol: "Kč"},
    DKK: {name: "Danish Krone", symbol: "kr", symbolNarrow: "DKK"},
    EUR: {name: "Euro", symbol: "€"},
    GBP: {name: "British Pound", symbol: "£"},
    HKD: {name: "Hong Kong Dollar", symbol: "$", symbolNarrow: "HK$"},
    HUF: {name: "Hungarian Forint", symbol: "Ft"},
    IDR: {name: "Indonesian Rupiah", symbol: "Rp"},
    ILS: {name: "Israeli New Shekel", symbol: "₪"},
    INR: {name: "Indian Rupee", symbol: "₹"},
    ISK: {name: "Icelandic Króna", symbol: "kr", symbolNarrow: "ISK"},
    JPY: {name: "Japanese Yen", symbol: "¥", symbolNarrow: "JP¥"},
    KRW: {name: "South Korean Won", symbol: "₩"},
    MXN: {name: "Mexican Peso", symbol: "$", symbolNarrow: "Mex$"},
    MYR: {name: "Malaysian Ringgit", symbol: "RM"},
    NOK: {name: "Norwegian Krone", symbol: "kr", symbolNarrow: "NOK"},
    NZD: {name: "New Zealand Dollar", symbol: "$", symbolNarrow: "NZ$"},
    PHP: {name: "Philippine Peso", symbol: "₱"},
    PLN: {name: "Polish Złoty", symbol: "zł"},
    RON: {name: "Romanian Leu", symbol: "lei"},
    SEK: {name: "Swedish Krona", symbol: "kr", symbolNarrow: "SEK"},
    SGD: {name: "Singapore Dollar", symbol: "$", symbolNarrow: "S$"},
    THB: {name: "Thai Baht", symbol: "฿"},
    TRY: {name: "Turkish Lira", symbol: "₺"},
    USD: {name: "United States Dollar", symbol: "$", symbolNarrow: "$"},
    ZAR: {name: "South African Rand", symbol: "R"},
};
