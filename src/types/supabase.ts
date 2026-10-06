/**
 * Roles determine what a user can do in the app.
 * - patient:   default, can raise and manage their own emergencies
 * - paramedic: responds to assigned emergencies, reports live position
 * - dispatcher: manages the ambulance fleet and assigns emergencies
 */
export type UserRole = "patient" | "paramedic" | "dispatcher" | "PATIENT" | "DOCTOR" | "ADMIN";
export type AppRole = "PATIENT" | "DOCTOR" | "ADMIN" | "PARAMEDIC" | "DISPATCHER";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          medical_conditions: string | null;
          allergies: string | null;
          blood_type: string | null;
          smartwatch_connected: boolean | null;
          role: UserRole;
          role_v2?: AppRole | null;
          ambulance_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          medical_conditions?: string | null;
          allergies?: string | null;
          blood_type?: string | null;
          smartwatch_connected?: boolean | null;
          role?: UserRole;
          ambulance_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          medical_conditions?: string | null;
          allergies?: string | null;
          blood_type?: string | null;
          smartwatch_connected?: boolean | null;
          role?: UserRole;
          ambulance_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      hospitals: {
        Row: {
          id: string;
          name: string;
          address: string;
          phone: string | null;
          latitude: number;
          longitude: number;
          emergency_department: boolean | null;
          icu_beds: number | null;
          total_beds: number | null;
          rating: number | null;
          distance_from_user: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          phone?: string | null;
          latitude: number;
          longitude: number;
          emergency_department?: boolean | null;
          icu_beds?: number | null;
          total_beds?: number | null;
          rating?: number | null;
          distance_from_user?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          phone?: string | null;
          latitude?: number;
          longitude?: number;
          emergency_department?: boolean | null;
          icu_beds?: number | null;
          total_beds?: number | null;
          rating?: number | null;
          distance_from_user?: number | null;
          created_at?: string;
        };
      };
      ambulances: {
        Row: {
          id: string;
          driver_name: string | null;
          vehicle_number: string | null;
          latitude: number;
          longitude: number;
          status: "available" | "dispatched" | "en_route" | "arrived" | "busy";
          current_emergency_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_name?: string | null;
          vehicle_number?: string | null;
          latitude: number;
          longitude: number;
          status?: "available" | "dispatched" | "en_route" | "arrived" | "busy";
          current_emergency_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_name?: string | null;
          vehicle_number?: string | null;
          latitude?: number;
          longitude?: number;
          status?: "available" | "dispatched" | "en_route" | "arrived" | "busy";
          current_emergency_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      emergencies: {
        Row: {
          id: string;
          user_id: string;
          latitude: number;
          longitude: number;
          address: string | null;
          description: string | null;
          status: "pending" | "dispatched" | "en_route" | "arrived" | "resolved" | "cancelled";
          assigned_ambulance_id: string | null;
          assigned_hospital_id: string | null;
          eta_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          latitude: number;
          longitude: number;
          address?: string | null;
          description?: string | null;
          status?: "pending" | "dispatched" | "en_route" | "arrived" | "resolved" | "cancelled";
          assigned_ambulance_id?: string | null;
          assigned_hospital_id?: string | null;
          eta_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          latitude?: number;
          longitude?: number;
          address?: string | null;
          description?: string | null;
          status?: "pending" | "dispatched" | "en_route" | "arrived" | "resolved" | "cancelled";
          assigned_ambulance_id?: string | null;
          assigned_hospital_id?: string | null;
          eta_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_locations: {
        Row: {
          id: string;
          user_id: string;
          latitude: number;
          longitude: number;
          heart_rate: number | null;
          steps: number | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          latitude: number;
          longitude: number;
          heart_rate?: number | null;
          steps?: number | null;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          latitude?: number;
          longitude?: number;
          heart_rate?: number | null;
          steps?: number | null;
          source?: string;
          created_at?: string;
        };
      };
      emergency_contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          relationship: string | null;
          notification_method: "sms" | "call" | "app_notification";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone: string;
          relationship?: string | null;
          notification_method?: "sms" | "call" | "app_notification";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string;
          relationship?: string | null;
          notification_method?: "sms" | "call" | "app_notification";
          created_at?: string;
        };
      };
      ambulance_locations: {
        Row: {
          id: string;
          ambulance_id: string;
          latitude: number;
          longitude: number;
          speed_kmh: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ambulance_id: string;
          latitude: number;
          longitude: number;
          speed_kmh?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ambulance_id?: string;
          latitude?: number;
          longitude?: number;
          speed_kmh?: number | null;
          created_at?: string;
        };
      };
    };
  };
};
