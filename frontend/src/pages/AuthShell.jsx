export default function AuthShell({children}){
    return(
        <div className="auth">
            <div className="auth_brand">
                <span className="auth_org">Ushuru Sacco</span>
                <span className="auth_title">ICT Support</span>
                <p className="auth_lead">Report a problem to the ICT team, follow it until it is fixed, and find answers in the knowledge base.</p>
            </div>
            <div className="auth_panel">
                <div className="auth_card">{children}</div>
            </div>
        </div>
    );
}