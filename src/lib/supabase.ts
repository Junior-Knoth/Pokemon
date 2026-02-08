import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos TypeScript baseados no seu schema
export type Database = {
  public: {
    Tables: {
      games: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          region: string | null;
          platform: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          region?: string | null;
          platform?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          region?: string | null;
          platform?: string | null;
          created_at?: string | null;
        };
      };
      pokemons: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          nickname: string;
          species_name: string;
          caught_at: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          game_id: string;
          nickname: string;
          species_name: string;
          caught_at?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          nickname?: string;
          species_name?: string;
          caught_at?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
      };
      battles: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          opponent_name: string;
          event_type:
            | "Gym"
            | "Rival"
            | "Elite Four"
            | "Lore"
            | "Titan"
            | "Legendary"
            | null;
          result: "Win" | "Loss" | "Draw" | null;
          lore_text: string | null;
          battle_date: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          game_id: string;
          opponent_name: string;
          event_type?:
            | "Gym"
            | "Rival"
            | "Elite Four"
            | "Lore"
            | "Titan"
            | "Legendary"
            | null;
          result?: "Win" | "Loss" | "Draw" | null;
          lore_text?: string | null;
          battle_date?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          opponent_name?: string;
          event_type?:
            | "Gym"
            | "Rival"
            | "Elite Four"
            | "Lore"
            | "Titan"
            | "Legendary"
            | null;
          result?: "Win" | "Loss" | "Draw" | null;
          lore_text?: string | null;
          battle_date?: string | null;
        };
      };
      battle_participation: {
        Row: {
          id: string;
          battle_id: string;
          pokemon_id: string;
          level_at_time: number | null;
          moveset: any | null; // jsonb
          is_mvp: boolean | null;
        };
        Insert: {
          id?: string;
          battle_id: string;
          pokemon_id: string;
          level_at_time?: number | null;
          moveset?: any | null;
          is_mvp?: boolean | null;
        };
        Update: {
          id?: string;
          battle_id?: string;
          pokemon_id?: string;
          level_at_time?: number | null;
          moveset?: any | null;
          is_mvp?: boolean | null;
        };
      };
    };
  };
};
