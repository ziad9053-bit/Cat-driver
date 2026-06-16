'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cat_driver_settings');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return {};
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('app_settings').select('*');
    if (!error && data) {
      const newSettings = {};
      data.forEach(item => {
        newSettings[item.key] = item.value;
      });
      setSettings(newSettings);
      applyThemeColors(newSettings);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cat_driver_settings', JSON.stringify(newSettings));
      }
    }
    setLoading(false);
  };

  const applyThemeColors = (sets) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (sets.primary_color) {
        root.style.setProperty('--primary-color', sets.primary_color);
      }
      if (sets.success_color) {
        root.style.setProperty('--success-color', sets.success_color);
      }
      // Add more dynamic CSS vars here if needed
    }
  };

  useEffect(() => {
    // Apply cached theme colors immediately to prevent color flashing
    if (Object.keys(settings).length > 0) {
      applyThemeColors(settings);
    }
    fetchSettings();

    const channel = supabase
      .channel('app_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
