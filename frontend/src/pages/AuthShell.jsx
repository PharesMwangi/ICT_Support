export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <div className="auth__brand">
        <span className="auth__org">Ushuru Sacco</span>
        <span className="auth__title">ICT Support</span>
        <p className="auth__lead">Report a problem to the ICT team, follow it until it is fixed, and find answers in the knowledge base.</p>
      </div>
      <div className="auth__panel">
        <div className="auth__card">{children}</div>
      </div>
    </div>
  );
}
