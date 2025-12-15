/**
 * Tags API
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  PaginatedResponse,
  Tag,
  RequestOptions
} from '../types';
import { TAGS_API } from '../constants/endpoints';

export class TagsAPI {
  constructor(private http: HttpClient) {}

  /**
   * Get a single tag by ID or slug
   */
  async get(
    idOrSlug: string | number,
    options?: RequestOptions
  ): Promise<SazitoResponse<Tag>> {
    return this.http.get<Tag>(`${TAGS_API}/${idOrSlug}`, options);
  }

  /**
   * List all tags
   */
  async list(
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<Tag>>> {
    return this.http.get<PaginatedResponse<Tag>>(TAGS_API, options);
  }
}
