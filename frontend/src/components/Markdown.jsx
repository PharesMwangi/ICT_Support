import { ReactMarkdown } from 'react-markdown';

// react-markdown does not render raw HTML, so article text cannot inject scripts.
export default function Markdown({ children }) {
  return (
    <div className="prose">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}