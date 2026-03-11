
import { supabase, isSupabaseConfigured } from '../supabase';
import { Client } from '../types';

const LOCAL_STORAGE_KEY = 'loop_energia_clients';

export const storageService = {
  async getClients(): Promise<Client[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('createdAt', { ascending: false });
        
        if (!error && data) return data;
        console.error("Supabase fetch error, falling back to local storage:", error);
      } catch (err) {
        console.error("Supabase connection error, falling back to local storage:", err);
      }
    }

    try {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed = localData ? JSON.parse(localData) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Local storage read error:", err);
      return [];
    }
  },

  async saveClient(client: Client): Promise<Client> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .insert([client])
          .select();
        
        if (!error && data && data[0]) return data[0];
        console.error("Supabase save error:", error);
      } catch (err) {
        console.error("Supabase save connection error:", err);
      }
    }

    // Fallback to local storage
    try {
      const clients = await this.getClients();
      const id = client.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11));
      const newClient = { ...client, id };
      const updatedClients = [newClient, ...clients];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedClients));
      return newClient;
    } catch (err) {
      console.error("Local storage save error:", err);
      return { ...client, id: client.id || 'temp-' + Date.now() };
    }
  },

  async updateClient(client: Client): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('clients')
          .update(client)
          .eq('id', client.id);
        
        if (!error) return true;
        console.error("Supabase update error:", error);
      } catch (err) {
        console.error("Supabase update connection error:", err);
      }
    }

    // Fallback to local storage
    try {
      const clients = await this.getClients();
      const updatedClients = clients.map(c => c.id === client.id ? client : c);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedClients));
      return true;
    } catch (err) {
      console.error("Local storage update error:", err);
      return false;
    }
  },

  async deleteClient(clientId: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId);
        
        if (!error) return true;
        console.error("Supabase delete error:", error);
      } catch (err) {
        console.error("Supabase delete connection error:", err);
      }
    }

    // Fallback to local storage
    try {
      const clients = await this.getClients();
      const updatedClients = clients.filter(c => c.id !== clientId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedClients));
      return true;
    } catch (err) {
      console.error("Local storage delete error:", err);
      return false;
    }
  }
};
