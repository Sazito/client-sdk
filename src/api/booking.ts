/**
 * Booking API (Scheduler and appointments)
 */

import { HttpClient } from '../core/http-client';
import {
  SazitoResponse,
  PaginatedResponse,
  RequestOptions
} from '../types';
import {
  SCHEDULER_EVENTS_API,
  SCHEDULER_BOOKINGS_API,
  SCHEDULER_AVAILABILITIES_API
} from '../constants/endpoints';

/**
 * Legacy event shape returned by some scheduler list endpoints.
 */
export interface Event {
  id: number;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  bookedCount?: number;
  availableSlots?: number;
  price?: number;
  location?: string;
  createdAt?: string;
}

/**
 * Event details used in product booking flow.
 */
export interface SchedulerEvent {
  entityId: number;
  title: string;
  description: string;
  durationsMinute: number[];
}

export interface BookingTimeSlot {
  startTimeLocal: string;   // HH:mm
  endTimeLocal: string;     // HH:mm
  isAvailable: boolean;
  remainingCapacity: number;
}

export interface BookingAvailableDay {
  date: string;             // YYYY-MM-DD
  timeSlots: BookingTimeSlot[];
}

export interface EventAvailabilitiesResponse {
  availableDays: BookingAvailableDay[];
}

export interface EventAvailabilityFilters {
  eventEntityId: number;
  duration: number;
  fromDate: string;
  toDate: string;
  timezone?: string;
}

export interface CreateBookingInput {
  eventEntityId?: number;
  event_entity_id?: number;   // legacy support
  timezone: string;
  attendeeName?: string;
  attendee_name?: string;     // legacy support
  attendeeEmail?: string;
  attendee_email?: string;    // legacy support
  attendeePhone?: string;
  attendee_phone?: string;    // legacy support
}

export interface Booking {
  id: number;
  eventId: number;
  event: Event;
  userId?: number;
  attendeeName: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  bookingTime: string;
  createdAt: string;
}

export interface EventFilters {
  startDate?: string;
  start_date?: string;        // legacy support
  endDate?: string;
  end_date?: string;          // legacy support
  availableOnly?: boolean;
  available_only?: boolean;   // legacy support
  page?: number;
  pageSize?: number;
  page_size?: number;         // legacy support
}

export class BookingAPI {
  constructor(private http: HttpClient) {}

  private transformEventFilters(filters?: EventFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.startDate !== undefined || filters.start_date !== undefined) {
      params.start_date = filters.startDate ?? filters.start_date;
    }
    if (filters.endDate !== undefined || filters.end_date !== undefined) {
      params.end_date = filters.endDate ?? filters.end_date;
    }
    if (filters.availableOnly !== undefined || filters.available_only !== undefined) {
      params.available_only = filters.availableOnly ?? filters.available_only;
    }
    if (filters.page !== undefined) params.page = filters.page;
    if (filters.pageSize !== undefined || filters.page_size !== undefined) {
      params.page_size = filters.pageSize ?? filters.page_size;
    }

    return params;
  }

  /**
   * List available events (legacy scheduler listing).
   */
  async listEvents(
    filters?: EventFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<PaginatedResponse<Event>>> {
    return this.http.get<PaginatedResponse<Event>>(SCHEDULER_EVENTS_API, {
      ...options,
      params: this.transformEventFilters(filters)
    });
  }

  /**
   * Get event details used for booking (durations, title, description).
   */
  async getEvent(
    entityId: number,
    options?: RequestOptions
  ): Promise<SazitoResponse<SchedulerEvent>> {
    const response = await this.http.get<any>(`${SCHEDULER_EVENTS_API}/${entityId}`, options);

    if (response.data) {
      const eventData = response.data.event || response.data;
      return { data: eventData as SchedulerEvent };
    }

    return response;
  }

  /**
   * Get available days and time slots for an event.
   */
  async getEventAvailabilities(
    filters: EventAvailabilityFilters,
    options?: RequestOptions
  ): Promise<SazitoResponse<EventAvailabilitiesResponse>> {
    const response = await this.http.get<any>(SCHEDULER_AVAILABILITIES_API, {
      ...options,
      params: {
        eventEntityId: filters.eventEntityId,
        duration: filters.duration,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        timezone: filters.timezone
      }
    });

    if (response.data) {
      const availableDays = response.data.availableDays || response.data.data?.availableDays || [];
      return { data: { availableDays } };
    }

    return response;
  }

  /**
   * Create booking (legacy endpoint kept for backward compatibility).
   */
  async createBooking(
    input: CreateBookingInput,
    options?: RequestOptions
  ): Promise<SazitoResponse<Booking>> {
    return this.http.post<Booking>(SCHEDULER_BOOKINGS_API, input, options);
  }

  /**
   * List user bookings (requires authentication).
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
   * Cancel booking.
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
