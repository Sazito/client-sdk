/**
 * Regions API
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, RequestOptions, JsonValue } from '../types';
import { REGIONS_API } from '../constants/endpoints';

export interface RegionCity {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export interface RegionWithCities {
  id: number;
  name: string;
  cities: RegionCity[];
}

interface RegionsResponse {
  regions?: JsonValue[];
  items?: JsonValue[];
}

function isRecord(value: JsonValue | object | null | undefined): value is Record<string, JsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toNumber(value: JsonValue | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toSafeString(value: JsonValue | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

export class RegionsAPI {
  constructor(private http: HttpClient) {}

  private normalizeCity(rawCity: JsonValue): RegionCity {
    if (!isRecord(rawCity)) {
      return {
        id: 0,
        name: '',
        latitude: 0,
        longitude: 0
      };
    }

    return {
      id: toNumber(rawCity.id),
      name: toSafeString(rawCity.name),
      latitude: toNumber(rawCity.latitude),
      longitude: toNumber(rawCity.longitude)
    };
  }

  private normalizeRegion(rawRegion: JsonValue): RegionWithCities {
    if (!isRecord(rawRegion)) {
      return {
        id: 0,
        name: '',
        cities: []
      };
    }

    const rawCities = Array.isArray(rawRegion.cities) ? rawRegion.cities : [];

    return {
      id: toNumber(rawRegion.id),
      name: toSafeString(rawRegion.name),
      cities: rawCities
        .map(city => this.normalizeCity(city))
        .filter(city => city.id > 0 && city.name.length > 0)
    };
  }

  private extractRegions(payload: JsonValue | RegionsResponse | undefined): JsonValue[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (!isRecord(payload)) {
      return [];
    }

    if (Array.isArray(payload.regions)) {
      return payload.regions;
    }

    if (Array.isArray(payload.items)) {
      return payload.items;
    }

    return [];
  }

  private sortAlphabetically(regions: RegionWithCities[]): RegionWithCities[] {
    return [...regions]
      .map(region => ({
        ...region,
        cities: [...region.cities].sort((a, b) => a.name.localeCompare(b.name, 'fa'))
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  }

  /**
   * Get all regions with nested cities (sorted by name).
   */
  async list(options?: RequestOptions): Promise<SazitoResponse<RegionWithCities[]>> {
    const response = await this.http.get<RegionsResponse>(REGIONS_API, options);

    if (response.error) {
      return { error: response.error };
    }

    const regions = this.extractRegions(response.data)
      .map(region => this.normalizeRegion(region))
      .filter(region => region.id > 0 && region.name.length > 0);

    return { data: this.sortAlphabetically(regions) };
  }
}
