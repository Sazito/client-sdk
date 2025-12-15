/**
 * Images API (File upload)
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, RequestOptions } from '../types';
import { IMAGES_API } from '../constants/endpoints';


export interface UploadImageResponse {
  id: number;
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

export class ImagesAPI {
  constructor(private http: HttpClient) {}

  /**
   * Upload image file
   * @param file - File or Blob to upload
   */
  async upload(
    file: File | Blob,
    options?: RequestOptions
  ): Promise<SazitoResponse<UploadImageResponse>> {
    const formData = new FormData();
    formData.append('image', file);

    // Note: We need to override Content-Type for FormData
    const customHeaders = {
      ...options?.headers
    };
    // Remove Content-Type to let browser set it with boundary
    delete customHeaders['Content-Type'];

    return this.http.post<UploadImageResponse>(IMAGES_API, formData, {
      ...options,
      headers: customHeaders
    } as any);
  }

  /**
   * Delete image
   */
  async delete(
    imageId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<void>> {
    return this.http.delete<void>(`${IMAGES_API}/${imageId}`, options);
  }
}
