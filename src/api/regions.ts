/**
 * Regions API
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, RequestOptions } from '../types';
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
  regions?: RegionWithCities[];
}

export class RegionsAPI {
  constructor(private http: HttpClient) {}

  private sortAlphabetically(regions: RegionWithCities[]): RegionWithCities[] {
    return [...regions]
      .map(region => ({
        ...region,
        cities: [...(region.cities || [])].sort((a, b) => a.name.localeCompare(b.name, 'fa'))
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  }

  /**
   * Get all regions with nested cities (sorted by name).
   */
  async list(options?: RequestOptions): Promise<SazitoResponse<RegionWithCities[]>> {
    const response = await this.http.get<RegionsResponse>(REGIONS_API, options);

    if (response.data) {
      const regions = Array.isArray(response.data.regions)
        ? response.data.regions
        : Array.isArray((response.data as any).items) ? (response.data as any).items : [];

      return { data: this.sortAlphabetically(regions) };
    }

    return response as SazitoResponse<RegionWithCities[]>;
  }
}
