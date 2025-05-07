import { DateTime } from 'luxon';

/**
 * Converts a string date from various formats to a PostgreSQL compatible date
 * @param mydate The date string to convert
 * @param debug Optional flag to enable debug logging
 * @returns Date object or null if conversion fails
 */
export function convertToDate(mydate: string, debug: boolean = false): Date | null {
  let rdate: Date | null;
  
  // Collect failed formats for debugging
  const failedFormats: string[] = [];
  
  // Helper function to check date format
  function checkDateFormat(dateStr: string, format: string): Date | null {
    try {
      // Using luxon for robust date parsing (using ES module import at the top level)
      const parsed = DateTime.fromFormat(dateStr, format, { 
        locale: 'en-US' ,
        zone: 'utc' // Add this line to force UTC parsing
      });
      
      if (parsed.isValid) {
        if (debug) {
          console.log(`Successfully parsed "${dateStr}" using format "${format}"`);
        }
        return parsed.toUTC().toJSDate();
      } else {
        // Parsing completed but resulted in an invalid date
        failedFormats.push(`Format "${format}" - Invalid result: ${parsed.invalidReason}`);
        return null;
      }
    } catch (e) {
      // Format doesn't match or other error occurred
      failedFormats.push(`Format "${format}" - Exception: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  }

  console.log('Input date = ',mydate )
  // Try different date formats
  rdate = checkDateFormat(mydate, 'd-MMM-yyyy');
  if (rdate !== null) {
    return rdate;
  }
  
  rdate = checkDateFormat(mydate, 'M/d/yyyy');
  if (rdate !== null) {
    return rdate;
  }
  
  rdate = checkDateFormat(mydate, 'MM/dd/yyyy');
  if (rdate !== null) {
    return rdate;
  }
  
  rdate = checkDateFormat(mydate, 'MM/dd/yy');
  if (rdate !== null) {
    return rdate;
  }
  
  rdate = checkDateFormat(mydate, 'M/d/yy');
  if (rdate !== null) {
    return rdate;
  }
  
  // Basic ISO date format (yyyyMMdd)
  rdate = checkDateFormat(mydate, 'yyyyMMdd');
  if (rdate !== null) {
    return rdate;
  }
  
  rdate = checkDateFormat(mydate, 'yyyy-MM-dd');
  if (rdate !== null) {
    return rdate;
  }
  
  rdate = checkDateFormat(mydate, 'yyyy-M-dd');
  if (rdate !== null) {
    return rdate;
  }
  
  rdate = checkDateFormat(mydate, 'yyyyMMdd');
  if (rdate !== null) {
    return rdate;
  }
  
  rdate = checkDateFormat(mydate, 'EEE, MMM dd yyyy');
  if (rdate !== null) {
    return rdate;
  }
  
  rdate = checkDateFormat(mydate, 'EEEE, MMM dd, yyyy HH:mm:ss');
  if (rdate !== null) {
    return rdate;
  }
  
  // ISO formats
  try {
    // For ISO formats, we can use Date constructor directly
    const parsed = new Date(mydate);
    if (!isNaN(parsed.getTime())) {
      if (debug) {
        console.log(`Successfully parsed "${mydate}" using native Date constructor`);
      }
      return parsed;
    } else {
      failedFormats.push("Native Date constructor - Invalid date");
    }
  } catch (e) {
    // Invalid format
    failedFormats.push(`Native Date constructor - Exception: ${e instanceof Error ? e.message : String(e)}`);
  }
  
  // If we get here, all formats failed
  if (debug) {
    console.warn(`Failed to parse date string: "${mydate}"`);
    console.warn("Failed formats:");
    failedFormats.forEach(msg => console.warn(`- ${msg}`));
  }
  
  return null;
}

export default convertToDate;