"use client";

import React, { createContext, useContext, type ReactNode } from "react";
import { createContextualCan } from "@casl/react";
import { usePermissions } from "./usePermissions";
import { defaultAbility, type AppAbility } from "./ability";

// Create context
const AbilityContext = createContext<AppAbility>(defaultAbility);

// Create Can component
export const Can = createContextualCan(AbilityContext.Consumer);

// Provider component
export function AbilityProvider({ children }: { children: ReactNode }) {
  const { ability } = usePermissions();

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}

// Hook to use ability
export function useAbility() {
  return useContext(AbilityContext);
}
