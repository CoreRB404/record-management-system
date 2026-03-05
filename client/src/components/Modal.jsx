import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(() => onClose(), 200);
    };

    if (!isOpen) return null;

    const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : '';

    return createPortal(
        <div className={`modal-overlay ${isAnimating ? 'active' : ''}`} onClick={handleClose}>
            <div
                className={`modal-container ${sizeClass} ${isAnimating ? 'active' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close-btn" onClick={handleClose} id="modal-close-btn">
                        <IoClose />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
