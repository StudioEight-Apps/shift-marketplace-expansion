import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { differenceInDays, differenceInHours, isAfter, isBefore } from "date-fns";
import type { Listing } from "@/components/shift/ListingCard";

interface StayDates {
  checkIn: Date | null;
  checkOut: Date | null;
}

interface CarDates {
  pickup: Date | null;
  dropoff: Date | null;
}

interface YachtBooking {
  yacht: Listing | null;
  startDate: Date | null;
  startTime: string | null; // e.g., "10:00"
  endTime: string | null;   // e.g., "14:00"
}

interface TripState {
  stay: Listing | null;
  stayDates: StayDates;
  car: Listing | null;
  carDates: CarDates;
  yachtBooking: YachtBooking;
  city: string;
}

interface TripContextValue extends TripState {
  setStay: (stay: Listing | null) => void;
  setStayDates: (dates: StayDates) => void;
  setCar: (car: Listing | null) => void;
  setCarDates: (dates: CarDates) => void;
  removeCar: () => void;
  setYacht: (yacht: Listing | null) => void;
  setYachtBooking: (booking: Partial<YachtBooking>) => void;
  removeYacht: () => void;
  clearTrip: () => void;
  stayNights: number;
  carDays: number;
  yachtHours: number;
  stayTotal: number;
  carTotal: number;
  yachtTotal: number;
  tripTotal: number;
  // Validation helpers
  isDateWithinStay: (date: Date) => boolean;
}

const initialYachtBooking: YachtBooking = {
  yacht: null,
  startDate: null,
  startTime: null,
  endTime: null,
};

const initialState: TripState = {
  stay: null,
  stayDates: { checkIn: null, checkOut: null },
  car: null,
  carDates: { pickup: null, dropoff: null },
  yachtBooking: initialYachtBooking,
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

  const isDateWithinStay = useCallback((date: Date) => {
    const { checkIn, checkOut } = state.stayDates;
    if (!checkIn || !checkOut) return true; // No stay dates set, allow any date
    return !isBefore(date, checkIn) && !isAfter(date, checkOut);
  }, [state.stayDates]);

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
      let newYachtBooking = prev.yachtBooking;
      
      if (dates.checkIn && dates.checkOut) {
        // Adjust car dates if outside stay window
        if (prev.car) {
          const { pickup, dropoff } = prev.carDates;
          let newPickup = pickup;
          let newDropoff = dropoff;
          
          if (pickup && isBefore(pickup, dates.checkIn)) {
            newPickup = dates.checkIn;
          }
          if (dropoff && isAfter(dropoff, dates.checkOut)) {
            newDropoff = dates.checkOut;
          }
          if (newPickup && newDropoff && isAfter(newPickup, newDropoff)) {
            newPickup = dates.checkIn;
            newDropoff = dates.checkOut;
          }
          
          newCarDates = { pickup: newPickup, dropoff: newDropoff };
        }
        
        // Adjust yacht date if outside stay window
        if (prev.yachtBooking.yacht && prev.yachtBooking.startDate) {
          if (isBefore(prev.yachtBooking.startDate, dates.checkIn) || 
              isAfter(prev.yachtBooking.startDate, dates.checkOut)) {
            newYachtBooking = { ...prev.yachtBooking, startDate: dates.checkIn };
          }
        }
      }
      
      return {
        ...prev,
        stayDates: dates,
        carDates: newCarDates,
        yachtBooking: newYachtBooking,
      };
    });
  }, []);

  const setCar = useCallback((car: Listing | null) => {
    setState(prev => ({
      ...prev,
      car,
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

  const setYacht = useCallback((yacht: Listing | null) => {
    setState(prev => ({
      ...prev,
      yachtBooking: yacht ? {
        yacht,
        startDate: prev.stayDates.checkIn,
        startTime: "10:00",
        endTime: "14:00",
      } : initialYachtBooking,
    }));
  }, []);

  const setYachtBooking = useCallback((booking: Partial<YachtBooking>) => {
    setState(prev => ({
      ...prev,
      yachtBooking: { ...prev.yachtBooking, ...booking },
    }));
  }, []);

  const removeYacht = useCallback(() => {
    setState(prev => ({
      ...prev,
      yachtBooking: initialYachtBooking,
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
    return Math.max(1, differenceInDays(dropoff, pickup));
  }, [state.carDates, state.car]);

  const yachtHours = useMemo(() => {
    const { yacht, startTime, endTime } = state.yachtBooking;
    if (!yacht || !startTime || !endTime) return 0;
    
    // Parse times and calculate hours
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return Math.max(1, Math.round((endMinutes - startMinutes) / 60));
  }, [state.yachtBooking]);

  const stayTotal = useMemo(() => {
    if (!state.stay) return 0;
    return state.stay.price * stayNights;
  }, [state.stay, stayNights]);

  const carTotal = useMemo(() => {
    if (!state.car) return 0;
    return state.car.price * carDays;
  }, [state.car, carDays]);

  const yachtTotal = useMemo(() => {
    if (!state.yachtBooking.yacht) return 0;
    return state.yachtBooking.yacht.price * yachtHours;
  }, [state.yachtBooking.yacht, yachtHours]);

  const tripTotal = stayTotal + carTotal + yachtTotal;

  const value: TripContextValue = {
    ...state,
    setStay,
    setStayDates,
    setCar,
    setCarDates,
    removeCar,
    setYacht,
    setYachtBooking,
    removeYacht,
    clearTrip,
    stayNights,
    carDays,
    yachtHours,
    stayTotal,
    carTotal,
    yachtTotal,
    tripTotal,
    isDateWithinStay,
  };

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
};
