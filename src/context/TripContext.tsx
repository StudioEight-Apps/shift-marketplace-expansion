import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { differenceInDays, isAfter, isBefore, isEqual } from "date-fns";
import type { Listing } from "@/components/shift/ListingCard";

interface StayDates {
  checkIn: Date | null;
  checkOut: Date | null;
}

interface CarDates {
  pickup: Date | null;
  dropoff: Date | null;
}

interface TripState {
  stay: Listing | null;
  stayDates: StayDates;
  car: Listing | null;
  carDates: CarDates;
  city: string;
}

interface TripContextValue extends TripState {
  setStay: (stay: Listing | null) => void;
  setStayDates: (dates: StayDates) => void;
  setCar: (car: Listing | null) => void;
  setCarDates: (dates: CarDates) => void;
  removeCar: () => void;
  clearTrip: () => void;
  stayNights: number;
  carDays: number;
  stayTotal: number;
  carTotal: number;
  tripTotal: number;
}

const initialState: TripState = {
  stay: null,
  stayDates: { checkIn: null, checkOut: null },
  car: null,
  carDates: { pickup: null, dropoff: null },
  city: "",
};

const TripContext = createContext<TripContextValue | null>(null);

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error("useTrip must be used within a TripProvider");
  }
  return context;
};

interface TripProviderProps {
  children: React.ReactNode;
}

export const TripProvider = ({ children }: TripProviderProps) => {
  const [state, setState] = useState<TripState>(initialState);

  const setStay = useCallback((stay: Listing | null) => {
    setState(prev => ({
      ...prev,
      stay,
      city: stay?.location || "",
    }));
  }, []);

  const setStayDates = useCallback((dates: StayDates) => {
    setState(prev => {
      // If car dates are outside new stay dates, adjust them
      let newCarDates = prev.carDates;
      
      if (dates.checkIn && dates.checkOut && prev.car) {
        const { pickup, dropoff } = prev.carDates;
        
        // Adjust pickup if it's before check-in or after check-out
        let newPickup = pickup;
        if (pickup && (isBefore(pickup, dates.checkIn) || isAfter(pickup, dates.checkOut))) {
          newPickup = dates.checkIn;
        }
        
        // Adjust dropoff if it's after check-out or before check-in
        let newDropoff = dropoff;
        if (dropoff && (isAfter(dropoff, dates.checkOut) || isBefore(dropoff, dates.checkIn))) {
          newDropoff = dates.checkOut;
        }
        
        // Ensure pickup is before dropoff
        if (newPickup && newDropoff && isAfter(newPickup, newDropoff)) {
          newPickup = dates.checkIn;
          newDropoff = dates.checkOut;
        }
        
        newCarDates = { pickup: newPickup, dropoff: newDropoff };
      }
      
      return {
        ...prev,
        stayDates: dates,
        carDates: newCarDates,
      };
    });
  }, []);

  const setCar = useCallback((car: Listing | null) => {
    setState(prev => ({
      ...prev,
      car,
      // Default car dates to stay dates when adding a car
      carDates: car ? {
        pickup: prev.stayDates.checkIn,
        dropoff: prev.stayDates.checkOut,
      } : { pickup: null, dropoff: null },
    }));
  }, []);

  const setCarDates = useCallback((dates: CarDates) => {
    setState(prev => ({
      ...prev,
      carDates: dates,
    }));
  }, []);

  const removeCar = useCallback(() => {
    setState(prev => ({
      ...prev,
      car: null,
      carDates: { pickup: null, dropoff: null },
    }));
  }, []);

  const clearTrip = useCallback(() => {
    setState(initialState);
  }, []);

  // Calculate nights and totals
  const stayNights = useMemo(() => {
    const { checkIn, checkOut } = state.stayDates;
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, differenceInDays(checkOut, checkIn));
  }, [state.stayDates]);

  const carDays = useMemo(() => {
    const { pickup, dropoff } = state.carDates;
    if (!pickup || !dropoff || !state.car) return 0;
    return Math.max(0, differenceInDays(dropoff, pickup));
  }, [state.carDates, state.car]);

  const stayTotal = useMemo(() => {
    if (!state.stay) return 0;
    return state.stay.price * stayNights;
  }, [state.stay, stayNights]);

  const carTotal = useMemo(() => {
    if (!state.car) return 0;
    return state.car.price * carDays;
  }, [state.car, carDays]);

  const tripTotal = stayTotal + carTotal;

  const value: TripContextValue = {
    ...state,
    setStay,
    setStayDates,
    setCar,
    setCarDates,
    removeCar,
    clearTrip,
    stayNights,
    carDays,
    stayTotal,
    carTotal,
    tripTotal,
  };

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
};
