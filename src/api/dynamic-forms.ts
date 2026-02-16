/**
 * Dynamic Forms API
 */

import { HttpClient } from '../core/http-client';
import { SazitoResponse, RequestOptions } from '../types';
import {
  DYNAMIC_FORMS_API,
  DYNAMIC_FORM_PRIVATE_UPLOAD_API
} from '../constants/endpoints';

export type DynamicFormFieldType =
  | 'TextBox'
  | 'TextArea'
  | 'Select'
  | 'Checkbox'
  | 'StatusBox'
  | 'Number'
  | 'Password'
  | 'NationalId'
  | 'PhoneNumber'
  | 'IBAN'
  | 'Separator'
  | 'Uploader';

export interface SelectOption {
  value: string;
  label: string;
}

export interface DynamicFormField {
  key: string;
  name: string;
  type: DynamicFormFieldType;
  label: string;
  value: any;
  placeholder: string;
  required: boolean;
  inputOptions: SelectOption[];
  allowedExtensions: string[];
}

export interface DynamicForm {
  id: number;
  title: string;
  description: string;
  fields: DynamicFormField[];
}

export interface UploadedDynamicFormFile {
  serveKey: string;
}

export class DynamicFormsAPI {
  constructor(private http: HttpClient) {}

  private normalizeField(field: any): DynamicFormField {
    return {
      key: String(field?.key ?? ''),
      name: String(field?.name ?? ''),
      type: field?.type as DynamicFormFieldType,
      label: String(field?.label ?? ''),
      value: field?.value,
      placeholder: String(field?.placeholder ?? ''),
      required: Boolean(field?.required),
      inputOptions: Array.isArray(field?.inputOptions) ? field.inputOptions : [],
      allowedExtensions: Array.isArray(field?.allowedExtensions) ? field.allowedExtensions : []
    };
  }

  private normalizeForm(data: any): DynamicForm {
    const fields = Array.isArray(data?.fields) ? data.fields : [];

    return {
      id: Number(data?.id ?? 0),
      title: String(data?.title ?? data?.name ?? ''),
      description: String(data?.description ?? ''),
      fields: fields.map((field: any) => this.normalizeField(field))
    };
  }

  /**
   * Fetch dynamic form definition by ID.
   */
  async getForm(
    formId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<DynamicForm>> {
    const response = await this.http.get<any>(`${DYNAMIC_FORMS_API}/${formId}`, options);

    if (response.data) {
      const formData = response.data.form || response.data.data || response.data;
      return { data: this.normalizeForm(formData) };
    }

    return response;
  }

  /**
   * Upload file for uploader fields in product dynamic forms.
   */
  async uploadProductFormFile(
    file: File | Blob,
    options?: RequestOptions
  ): Promise<SazitoResponse<UploadedDynamicFormFile>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.http.post<any>(DYNAMIC_FORM_PRIVATE_UPLOAD_API, formData, options);

    if (response.data) {
      const serveKey = response.data?.data?.file?.serveKey
        || response.data?.file?.serveKey
        || response.data?.serveKey;

      return { data: { serveKey: String(serveKey ?? '') } };
    }

    return response;
  }
}
