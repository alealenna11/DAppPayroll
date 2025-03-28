// src/utils/format.ts

/**
 * Formats USDC values (6 decimals) to human-readable strings
 * @param value BigInt value from contract
 * @returns Formatted string with 2 decimal places
 */
export const formatUSDC = (value: bigint | undefined | null): string => {
  if (value === undefined || value === null) return "0.00";

  // Handle both bigint and number cases
  const numericValue = typeof value === "bigint" ? Number(value) : value;
  return (numericValue / 1e6).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Formats Ethereum addresses
 * @param address Full address string or undefined
 * @returns Shortened address (0x123...abcd) or "Not Connected"
 */
export const formatAddress = (address: string | undefined | null): string => {
  if (!address) return "Not Connected";

  // Ensure address is valid before slicing
  if (typeof address !== "string" || address.length < 10)
    return "Invalid Address";

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Converts user input to USDC units (6 decimals)
 * @param value String input from user
 * @returns BigInt value for contract calls
 */
export const parseUSDC = (value: string | undefined | null): bigint => {
  if (!value) return BigInt(0);

  // Clean input (remove commas, etc.)
  const cleanedValue = value.replace(/,/g, "");
  const amount = parseFloat(cleanedValue);

  if (isNaN(amount)) return BigInt(0);

  // Handle negative values (though unlikely for USDC)
  const absoluteAmount = Math.abs(amount);
  const usdcUnits = BigInt(Math.floor(absoluteAmount * 1e6));

  return amount < 0 ? -usdcUnits : usdcUnits;
};

// Additional type guard for addresses
export const isEthAddress = (address: any): address is `0x${string}` => {
  return (
    typeof address === "string" &&
    address.startsWith("0x") &&
    address.length === 42
  );
};
