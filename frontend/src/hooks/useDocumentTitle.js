import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} - Ushuru Sacco ICT Support` : 'Ushuru Sacco ICT Support';
  }, [title]);
}
