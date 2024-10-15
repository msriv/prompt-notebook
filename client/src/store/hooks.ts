import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from ".";
import { createSelector } from "@reduxjs/toolkit";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

type Selector<T> = (state: RootState) => T;
export const createAppSelector = <T extends keyof RootState>(
  key: T,
): Selector<RootState[T]> => {
  const selector = createSelector(
    (state: RootState) => state[key],
    (value) => value,
  );
  return (state: RootState) => selector(state);
};
