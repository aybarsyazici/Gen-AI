import { useState, useEffect } from "react";

// Constants
const COOKIE_NAME = "appVersion";
const DEFAULT_VERSION = 0;

// Helper function to get cookie by name and decode the value
const getCookie = (name: string): number | null => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) {
    try {
      const decodedValue = atob(match[2]); // Decode from base64
      return parseInt(decodedValue, 10); // Parse to integer
    } catch (error) {
      console.error("Error decoding cookie value:", error);
      return null;
    }
  }
  return null;
};

// Helper function to encode and set a cookie
const setCookie = (name: string, value: number, days: number) => {
  const encodedValue = btoa(value.toString()); // Encode the value to base64
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodedValue};expires=${expires.toUTCString()};path=/`;
};

export const useAppVersion = () => {
  const [appVersion, setAppVersion] = useState<number>(() => {
    const savedVersion = getCookie(COOKIE_NAME);
    return savedVersion !== null ? savedVersion : DEFAULT_VERSION;
  });

  useEffect(() => {
    setCookie(COOKIE_NAME, appVersion, 365); // Save appVersion in a cookie for a year
  }, [appVersion]);

  const changeAppVersion = (newVersion: number) => {
    setAppVersion(newVersion);
  };

  return { appVersion, changeAppVersion };
};
