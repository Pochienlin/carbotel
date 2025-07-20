"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTDP = getTDP;
exports.getCountryGridCI = getCountryGridCI;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.resolve(__dirname, 'infra.db');
// console.info(`sqlite db is sitting at ${dbPath}`)
const db = new better_sqlite3_1.default(dbPath);
function normalizeChipName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function getTDP(chipName) {
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
        const result = stmt.get(`%${normalized}%`);
        if (result) {
            console.log(`Match found: "${result.model}" (normalized: ${result.normalized_model}) → TDP: ${result.tdp}W`);
            return result.tdp;
        }
        else {
            console.warn(`No match found for "${chipName}" (normalized: "${normalized}"). Will use default tdp instead.`);
            return null;
        }
    }
    catch (error) {
        console.error('Database query failed:', error);
        return null;
    }
}
function getCountryGridCI(countryName) {
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
        const result = stmt.get(`%${countryName}%`);
        if (result) {
            console.log(`Latest match: "${result.country}" (${result.update_year}) → CI: ${result.gridCI} gCO₂/kWh`);
            return result.gridCI;
        }
        else {
            console.warn(`No carbon intensity found for "${countryName}. Will use default values instead"`);
            return null;
        }
    }
    catch (error) {
        console.error('Database query failed:', error);
        return null;
    }
}
