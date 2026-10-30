import {useState, useEffect} from "react";
import {api} from "../api/endpoints.js";

// Departments and categories come from the backend
let cached = null;

export function useMeta() {
    const [meta, setMeta] = useState(cached);
    const [error, setError] = useState(null);

    useEffect(() => {
        if(cached) return;
        let cancelled = false;
        api
        .meta()
        .then((m) =>{
            cached = m;
            if(!cancelled) setMeta(m);
        })
        .catch((e) => !cancelled && setError(e));
        return()=>{
            cancelled = true;
        };

    }, []);
    return {meta, error};
}

export const resetMetaCache = () => {
  cached = null;
};