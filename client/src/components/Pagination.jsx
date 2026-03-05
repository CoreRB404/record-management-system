const Pagination = ({ page, pages, total, onPageChange }) => {
    if (pages <= 1) return null;

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisible = 5;
        let start = Math.max(1, page - Math.floor(maxVisible / 2));
        let end = Math.min(pages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pageNumbers.push(i);
        }
        return pageNumbers;
    };

    return (
        <div className="pagination-wrapper">
            <span className="pagination-info">
                Showing page <strong>{page}</strong> of <strong>{pages}</strong> ({total} total)
            </span>
            <div className="pagination">
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                >
                    ‹ Prev
                </button>
                {getPageNumbers().map((num) => (
                    <button
                        key={num}
                        className={`pagination-btn ${num === page ? 'active' : ''}`}
                        onClick={() => onPageChange(num)}
                    >
                        {num}
                    </button>
                ))}
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= pages}
                >
                    Next ›
                </button>
            </div>
        </div>
    );
};

export default Pagination;
