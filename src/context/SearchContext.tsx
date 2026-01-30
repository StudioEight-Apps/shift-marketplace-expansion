import React, { createContext, useContext, useState, useCallback } from "react";

interface SearchState {
  cityId: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface SearchContextValue extends SearchState {
  setCityId: (cityId: string) => void;
  setSearchDates: (start: Date | null, end: Date | null) => void;
  hasDates: boolean;
}

const initialState: SearchState = {
  cityId: "miami",
  startDate: null,
  endDate: null,
};

const SearchContext = createContext<SearchContextValue | null>(null);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};

interface SearchProviderProps {
  children: React.ReactNode;
}

export const SearchProvider = ({ children }: SearchProviderProps) => {
  const [state, setState] = useState<SearchState>(initialState);

  const setCityId = useCallback((cityId: string) => {
    setState(prev => ({ ...prev, cityId }));
  }, []);

  const setSearchDates = useCallback((startDate: Date | null, endDate: Date | null) => {
    setState(prev => ({ ...prev, startDate, endDate }));
  }, []);

  const hasDates = state.startDate !== null && state.endDate !== null;

  const value: SearchContextValue = {
    ...state,
    setCityId,
    setSearchDates,
    hasDates,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};
