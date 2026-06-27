export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
    Number.isFinite(n) ? n : 0,
  );

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0);

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigit(n: number): string {
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return tens[t] + (o ? " " + ones[o] : "");
}

function threeDigit(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(ones[h] + " Hundred");
  if (r) parts.push(twoDigit(r));
  return parts.join(" ");
}

/** Indian numbering: Crore, Lakh, Thousand, Hundred */
export function numberToIndianWords(num: number): string {
  if (!Number.isFinite(num)) return "Zero";
  const negative = num < 0;
  num = Math.abs(num);
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  const inWords = (n: number): string => {
    if (n === 0) return "Zero";
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const rest = n;
    const parts: string[] = [];
    if (crore) parts.push(twoDigit(crore) + " Crore");
    if (lakh) parts.push(twoDigit(lakh) + " Lakh");
    if (thousand) parts.push(twoDigit(thousand) + " Thousand");
    if (rest) parts.push(threeDigit(rest));
    return parts.join(" ").replace(/\s+/g, " ").trim();
  };

  let str = inWords(rupees) + " Rupees";
  if (paise) str += " and " + twoDigit(paise) + " Paise";
  str += " Only";
  return (negative ? "Minus " : "") + str;
}
