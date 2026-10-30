import { useCallback, useEffect, useState, useRef } from "react";

// Runs `fn` on mount and whenever `deps` change. Ignores answers that arrive late.
export function useAsync(fn, deps = []) {
    const [state, setState] = useState({ data: null, error: null, loading: true });
    const counter = useRef(0);

    const run = useCallback(() => {
        const id = ++counter.current;
        setState((s) => ({ ...s, loading: true, error: null }));
        return fn()
            .then((data) => {
                if (id === counter.current) setState({ data, error: null, loading: false });
            })
            .catch((error) => {
                if (id === counter.current) setState({ data: null, error, loading: false });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        run();
        return () => {
          counter.current++;
        };
      }, [run]);
    
      return { ...state, reload: run };
}