import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <EmptyState title="Page not found">
      <p>This page does not exist. Check the address, or go back to the dashboard.</p>
      <Link className="btn" to="/">
        Go to dashboard
      </Link>
    </EmptyState>
  );
}
