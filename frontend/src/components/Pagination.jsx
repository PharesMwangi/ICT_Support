export default function Pagination ({page, limit, total, onPage}){
    const pages = Math.max(1, Math.ceil(total / limit));
    if(total === 0) return null;
    const from = (page - 1) * limit + 1;
    const to = Math.min(total, page * limit);

    return(
        <nav className="pagination" aria-label="Pages">
            <span>
                Showing {from}-{to} of {total}
            </span>
            <span style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn--quiet btn--small" disabled={page <= 1} onClick={() => onPage(page - 1)}>
                    Previous
                </button>
                <button
                    type="button"
                    className="btn btn--quiet btn--small"
                    disabled={page >= pages}
                    onClick={() => onPage(page + 1)}
                    >
                    Next
                </button>
            </span>
        </nav>
    );
}