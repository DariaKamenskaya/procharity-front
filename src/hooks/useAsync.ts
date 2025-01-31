/* eslint-disable no-return-assign */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable import/prefer-default-export */
/* eslint-disable no-void */
// @ts-nocheck
import * as React from 'react';

// updates the state strictly after the component has rendered
function useSafeDispatch(dispatch) {
  const mounted = React.useRef(false);
  React.useLayoutEffect(() => {
    mounted.current = true;
    return () => (mounted.current = false);
  }, []);
  return React.useCallback((...args) => (mounted.current ? dispatch(...args) : void 0), [dispatch]);
}

const defaultInitialState = { status: 'idle', data: null, error: null };
function useAsync(initialState) {
  const initialStateRef = React.useRef({
    ...defaultInitialState,
    ...initialState,
  });
  const [{ status, data, error }, setState] = React.useReducer((s, a) => ({ ...s, ...a }), initialStateRef.current);

  const safeSetState = useSafeDispatch(setState);

  const setData = React.useCallback((data) => safeSetState({ data, status: 'resolved' }), [safeSetState]);
  const setError = React.useCallback((error) => safeSetState({ error, status: 'rejected' }), [safeSetState]);
  const reset = React.useCallback(() => safeSetState(initialStateRef.current), [safeSetState]);
  const run = React.useCallback(
    (promise) => {
      if (!promise || !promise.then) {
        throw new Error(
          `The argument passed to useAsync().run must be a promise. Maybe a function that's passed isn't returning anything?`,
        );
      }
      safeSetState({ status: 'pending' });
      return promise
        .then((data) => {
          setData(data);
          return data;
        })
        .catch((e) => {
          setError(e.message);
        });
    },
    [safeSetState, setData, setError],
  );

  return {
    isIdle: status === 'idle',
    isLoading: status === 'pending',
    isError: status === 'rejected',
    isSuccess: status === 'resolved',

    setData,
    setError,
    error,
    status,
    data,
    run,
    reset,
  };
}

export { useAsync };
