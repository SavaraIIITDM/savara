export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      activation_codes: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          purchase_type: string;
          purchaser_email: string;
          redeemed_count: number;
          ticket_quota: number;
          verified_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          purchase_type?: string;
          purchaser_email: string;
          redeemed_count?: number;
          ticket_quota: number;
          verified_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          purchase_type?: string;
          purchaser_email?: string;
          redeemed_count?: number;
          ticket_quota?: number;
          verified_at?: string;
        };
        Relationships: [];
      };
      event_checkins: {
        Row: {
          checked_in_at: string;
          checked_in_by: string | null;
          event_id: string;
          id: number;
          team_id: string | null;
          ticket_id: string;
        };
        Insert: {
          checked_in_at?: string;
          checked_in_by?: string | null;
          event_id: string;
          id?: number;
          team_id?: string | null;
          ticket_id: string;
        };
        Update: {
          checked_in_at?: string;
          checked_in_by?: string | null;
          event_id?: string;
          id?: number;
          team_id?: string | null;
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_checkins_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_checkins_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_checkins_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          team_max_size: number;
          team_min_size: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          team_max_size?: number;
          team_min_size?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          team_max_size?: number;
          team_min_size?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          participant_type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          participant_type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          participant_type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          created_at: string;
          email: string;
          is_admin: boolean;
          is_volunteer: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          is_admin?: boolean;
          is_volunteer?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          is_admin?: boolean;
          is_volunteer?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          added_by: string | null;
          created_at: string;
          team_id: string;
          ticket_id: string;
        };
        Insert: {
          added_by?: string | null;
          created_at?: string;
          team_id: string;
          ticket_id: string;
        };
        Update: {
          added_by?: string | null;
          created_at?: string;
          team_id?: string;
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          created_at: string;
          created_by: string | null;
          event_id: string;
          id: string;
          leader_ticket_id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          event_id: string;
          id?: string;
          leader_ticket_id: string;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          event_id?: string;
          id?: string;
          leader_ticket_id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_leader_ticket_id_fkey";
            columns: ["leader_ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      tickets: {
        Row: {
          activation_code_id: string;
          created_at: string;
          id: string;
          participant_type: string;
          qr_token: string;
          user_id: string;
        };
        Insert: {
          activation_code_id: string;
          created_at?: string;
          id?: string;
          participant_type: string;
          qr_token: string;
          user_id: string;
        };
        Update: {
          activation_code_id?: string;
          created_at?: string;
          id?: string;
          participant_type?: string;
          qr_token?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_activation_code_id_fkey";
            columns: ["activation_code_id"];
            isOneToOne: false;
            referencedRelation: "activation_codes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_verify_purchase: {
        Args: {
          p_purchase_type?: string;
          p_purchaser_email: string;
          p_ticket_quota: number;
        };
        Returns: {
          activation_code_id: string;
          code: string;
        }[];
      };
      check_in_individual: {
        Args: { p_event_id: string; p_qr_token: string; p_team_id?: string };
        Returns: string;
      };
      create_team_with_members: {
        Args: {
          p_event_id: string;
          p_leader_qr: string;
          p_member_qrs: string[];
          p_team_name: string;
        };
        Returns: string;
      };
      generate_activation_code: { Args: never; Returns: string };
      is_admin: { Args: never; Returns: boolean };
      is_volunteer_or_admin: { Args: never; Returns: boolean };
      join_team_with_members: {
        Args: { p_member_qrs: string[]; p_team_id: string };
        Returns: number;
      };
      participant_type_from_email: {
        Args: { p_email: string };
        Returns: string;
      };
      redeem_activation_code: {
        Args: { p_code: string };
        Returns: {
          qr_token: string;
          ticket_id: string;
        }[];
      };
      resolve_participant_by_qr: {
        Args: { p_event_id: string; p_qr_token: string };
        Returns: {
          already_registered: boolean;
          email: string;
          full_name: string | null;
          participant_type: string;
          qr_token: string;
          ticket_id: string;
        }[];
      };
      remove_event_checkin: {
        Args: { p_event_id: string; p_qr_token: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
