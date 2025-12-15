/**
 * Booking API (Event scheduling and appointments)
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  PaginatedResponse,
  RequestOptions
} from '../types';
import { SCHEDULER_EVENTS_API, SCHEDULER_BOOKINGS_API } from '../constants/endpoints';

export interface Event {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  available_slots: number;
  price?: number;
  location?: string;
  created_at: string;
}

export interface Booking {
  id: number;
  event_id: number;
  event: Event;
  user_id?: number;
  attendee_name: string;
  attendee_email?: string;
  attendee_phone?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  booking_time: string;
  created_at: string;
}

export interface CreateBookingInput {
  event_entity_id: number;
  timezone: string;
  attendee_name: string;
  attendee_email?: string;
  attendee_phone?: string;
}

export interface EventFilters {
  start_date?: string;
  end_date?: string;
  available_only?: boolean;
  page?: number;
  per_page?: number;
}

export class BookingAPI {
  constructor(private http: HttpClient) {}

  /**
   * List available events
   */
  async listEvents(
    filters?: EventFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<Event>>> {
    return this.http.get<PaginatedResponse<Event>>(SCHEDULER_EVENTS_API, {
      ...options,
      params: filters
    });
  }

  /**
   * Get single event
   */
  async getEvent(
    eventId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<Event>> {
    return this.http.get<Event>(`${SCHEDULER_EVENTS_API}/${eventId}`, options);
  }

  /**
   * Create booking
   */
  async createBooking(
    input: CreateBookingInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<Booking>> {
    return this.http.post<Booking>(SCHEDULER_BOOKINGS_API, input, options);
  }

  /**
   * List user bookings (requires authentication)
   */
  async listBookings(
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<Booking>>> {
    return this.http.get<PaginatedResponse<Booking>>(
      SCHEDULER_BOOKINGS_API,
      options
    );
  }

  /**
   * Cancel booking
   */
  async cancelBooking(
    bookingId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<Booking>> {
    return this.http.post<Booking>(
      `${SCHEDULER_BOOKINGS_API}/${bookingId}/cancel`,
      {},
      options
    );
  }
}
