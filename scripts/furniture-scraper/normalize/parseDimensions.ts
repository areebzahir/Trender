/**
 * Parse dimension strings into structured width/height/depth values.
 * Converts inches to cm when detected.
 */

export interface ParsedDimensions {
  width?: number;
  height?: number;
  depth?: number;
  length?: number;
  seat_height?: number;
  weight?: number;
  unit: 'cm' | 'inches' | 'mm';
  raw_dimensions_text: string;
}

const CM_PER_INCH = 2.54;

function inchesToCm(inches: number): number {
  return Math.round(inches * CM_PER_INCH * 10) / 10;
}

export function parseDimensions(raw: string | null | undefined): ParsedDimensions | null {
  if (!raw || raw.trim().length < 3) return null;

  const result: ParsedDimensions = {
    unit: 'cm',
    raw_dimensions_text: raw.trim(),
  };

  const isInches = /["']|inch|in\b/i.test(raw) && !/\bcm\b/i.test(raw);
  const isMm = /\bmm\b/i.test(raw);
  result.unit = isMm ? 'mm' : isInches ? 'inches' : 'cm';

  const toStored = (val: number): number => {
    if (isInches) return inchesToCm(val);
    if (isMm) return Math.round(val / 10 * 10) / 10; // mm to cm
    return val;
  };

  // Pattern: "W 80 x D 40 x H 30 cm" or "80W x 40D x 30H"
  const wxdxh = raw.match(
    /(?:w|width)[:\s]*(\d+(?:\.\d+)?)["\s]*[xX×,\s]+(?:d|depth)[:\s]*(\d+(?:\.\d+)?)["\s]*[xX×,\s]+(?:h|height)[:\s]*(\d+(?:\.\d+)?)/i
  );
  if (wxdxh) {
    result.width  = toStored(parseFloat(wxdxh[1]));
    result.depth  = toStored(parseFloat(wxdxh[2]));
    result.height = toStored(parseFloat(wxdxh[3]));
    result.unit = 'cm';
    return result;
  }

  // Pattern: "80 x 40 x 30 cm" (W x H x D assumed)
  const plain3 = raw.match(/(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)/);
  if (plain3) {
    result.width  = toStored(parseFloat(plain3[1]));
    result.height = toStored(parseFloat(plain3[2]));
    result.depth  = toStored(parseFloat(plain3[3]));
    result.unit = 'cm';
    return result;
  }

  // Pattern: "104.5\" W x 34.25\" H x 38\" D"
  const imperial = raw.match(
    /(\d+(?:\.\d+)?)["\s]*\s*(?:w|width)[^0-9]*(\d+(?:\.\d+)?)["\s]*\s*(?:h|height)[^0-9]*(\d+(?:\.\d+)?)["\s]*\s*(?:d|depth)/i
  );
  if (imperial) {
    result.width  = inchesToCm(parseFloat(imperial[1]));
    result.height = inchesToCm(parseFloat(imperial[2]));
    result.depth  = inchesToCm(parseFloat(imperial[3]));
    result.unit = 'cm';
    return result;
  }

  // Individual labels
  const w  = raw.match(/(?:w|width)[:\s]*(\d+(?:\.\d+)?)/i);
  const h  = raw.match(/(?:h|height)[:\s]*(\d+(?:\.\d+)?)/i);
  const d  = raw.match(/(?:d|depth)[:\s]*(\d+(?:\.\d+)?)/i);
  const l  = raw.match(/(?:l|length)[:\s]*(\d+(?:\.\d+)?)/i);
  const sh = raw.match(/seat.?height[:\s]*(\d+(?:\.\d+)?)/i);
  const wt = raw.match(/weight[:\s]*(\d+(?:\.\d+)?)/i);

  if (w)  result.width       = toStored(parseFloat(w[1]));
  if (h)  result.height      = toStored(parseFloat(h[1]));
  if (d)  result.depth       = toStored(parseFloat(d[1]));
  if (l)  result.length      = toStored(parseFloat(l[1]));
  if (sh) result.seat_height = toStored(parseFloat(sh[1]));
  if (wt) result.weight      = parseFloat(wt[1]); // weight stays as-is

  if (result.unit === 'cm' && (w || h || d || l)) {
    result.unit = 'cm';
  }

  const hasData = result.width || result.height || result.depth || result.length;
  return hasData ? result : null;
}
