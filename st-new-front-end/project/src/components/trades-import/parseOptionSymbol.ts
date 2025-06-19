
/**
 * Checks if is this trade is option using  OCC (Options Clearing Corporation) symbology. 
 * Click an option symbol to see its option summary page. Read an option symbol The components of an options symbol are:
 * Root symbol (ticker symbol) + Expiration Year (yy) + Expiration Month (mm) + Expiration Day (dd) + Call/Put Indicator (C or P) + Strike Price*.
 * @param symbol The raw trade action string from the Excel file
 * @returns The standardized TradeAction enum value
 */
import { OptionDetails } from '../../types/OptionDetails';

export function parseOptionSymbol(occSymbol: string): OptionDetails {
  // 1) Clean: remove leading non‐alphanumerics, uppercase
  const cleaned = occSymbol.replace(/^[^A-Za-z0-9]*/, '').toUpperCase();

  // 2) Use a pattern that captures an optional decimal strike
  // const optionPattern = /^([A-Z0-9]+)    # root
  //                        (\d{6})         # YYMMDD
  //                        ([CP])          # C or P
  //                        (\d+(\.\d+)?)   # strike, int or decimal
  //                        $/x;
  const optionPattern = /^([A-Z0-9]+)(\d{6})([CP])(\d+(?:\.\d+)?|\d+)$/;
  
  const m = cleaned.match(optionPattern);
  if (!m) {
    throw new Error('Invalid OCC option symbol format = ' + occSymbol);
  }

  const [, rootSymbol, exp, typeCode, rawStrike] = m;

  // 3) Parse expiration
  const year  = `20${exp.slice(0,2)}`;
  const month = exp.slice(2,4);
  const day   = exp.slice(4,6);
  if (!isValidDate(year, month, day)) {
    throw new Error('Invalid expiration date in symbol');
  }

  // 4) Normalize strike: remove '.', pad fractional to 3 places, then left‐pad to 8 digits
  let strikeDigits = rawStrike;
  if (rawStrike.includes('.')) {
    const [intPart, fracPart] = rawStrike.split('.');
    // pad fractional to 3 places (e.g. "5" → "500", "25" → "250")
    const frac = fracPart.padEnd(3, '0').slice(0,3);
    strikeDigits = intPart + frac;
  } else {
    // no decimal → implicit .000
    strikeDigits = rawStrike + '000';
  }
  // now pad on the left with zeros to 8 total digits
  const padded = strikeDigits.padStart(8, '0');
  const strikePrice = parseInt(padded, 10) / 1000;

  return {
    usymbol:        rootSymbol,
    expirationDate: `${year}-${month}-${day}`,
    optionType:     typeCode === 'C' ? 'CALL' : 'PUT',
    strikePrice,
  };
}

function isValidDate(y: string, m: string, d: string): boolean {
  const dt = new Date(`${y}-${m}-${d}`);
  return !isNaN(dt.getTime());
}
