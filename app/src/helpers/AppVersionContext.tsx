import React, { createContext, useContext, ReactNode } from "react";
import { useAppVersion } from ".";

// Define the shape of the context
interface AppVersionContextProps {
  appVersion: number;
  changeAppVersion: (newVersion: number) => void;
}

// Create the context
const AppVersionContext = createContext<AppVersionContextProps | undefined>(
  undefined,
);

// Create a provider component
export const AppVersionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { appVersion, changeAppVersion } = useAppVersion();

  return (
    <AppVersionContext.Provider value={{ appVersion, changeAppVersion }}>
      {children}
    </AppVersionContext.Provider>
  );
};

// Hook to use the AppVersionContext
export const useAppVersionContext = (): AppVersionContextProps => {
  const context = useContext(AppVersionContext);
  if (!context) {
    throw new Error(
      "useAppVersionContext must be used within an AppVersionProvider",
    );
  }
  return context;
};
