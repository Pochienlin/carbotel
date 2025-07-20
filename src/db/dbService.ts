import Database from 'better-sqlite3';
import path from 'path';

// ROW STRUCTURES
interface ChipRow {
  model: string;
  tdp: number;
  normalized_model: string;
}

interface CountryGrid {
  country: string;
  gridCI: number;
  update_year: number;
}

const dbPath = path.resolve(__dirname, 'infra.db');
// console.info(`sqlite db is sitting at ${dbPath}`)
const db = new Database(
  dbPath,
  // , { verbose: console.log }
);

function normalizeChipName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getTDP(chipName: string): number | null {
  if (!chipName || typeof chipName !== 'string') {
    console.warn('getTDP: Invalid chip name provided.');
    return null;
  }

  const normalized = normalizeChipName(chipName);

  const stmt = db.prepare(`
    SELECT model, tdp, normalized_model FROM tdp
    WHERE normalized_model LIKE ?
    ORDER BY LENGTH(normalized_model) ASC
    LIMIT 1
  `);

  try {
    const result = stmt.get(`%${normalized}%`) as ChipRow;

    if (result) {
      console.log(
        `Match found: "${result.model}" (normalized: ${result.normalized_model}) → TDP: ${result.tdp}W`,
      );
      return result.tdp;
    } else {
      console.warn(
        `No match found for "${chipName}" (normalized: "${normalized}"). Will use default tdp instead.`,
      );
      return null;
    }
  } catch (error) {
    console.error('Database query failed:', error);
    return null;
  }
}

export function getCountryGridCI(countryName: string): number | null {
  if (!countryName || typeof countryName !== 'string') {
    console.warn('getCountryGridCI: Invalid country name provided.');
    return null;
  }

  const stmt = db.prepare(`
      SELECT country, update_year, gridCI FROM gridCI
      WHERE LOWER(country) LIKE LOWER(?)
      ORDER BY update_year DESC
      LIMIT 1
    `);

  try {
    const result = stmt.get(`%${countryName}%`) as CountryGrid;

    if (result) {
      console.log(
        `Latest match: "${result.country}" (${result.update_year}) → CI: ${result.gridCI} gCO₂/kWh`,
      );
      return result.gridCI;
    } else {
      console.warn(
        `No carbon intensity found for "${countryName}. Will use default values instead"`,
      );
      return null;
    }
  } catch (error) {
    console.error('Database query failed:', error);
    return null;
  }
}
