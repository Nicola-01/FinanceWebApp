import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import type { User } from '../AdminDashboard/AdminDashboard.tsx';
import './DeleteConfirmationModal.css';

interface DeleteModalProps {
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
    onConfirm: (userId: string) => Promise<void>;
}

const countdown = 0

export const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ isOpen, user, onClose, onConfirm }) => {
    const [confirmationText, setConfirmationText] = useState("");
    const [deleteTimer, setDeleteTimer] = useState(countdown);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setConfirmationText("");
            setDeleteTimer(countdown);
            setIsDeleting(false);
        }
    }, [isOpen]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isOpen && deleteTimer > 0) {
            interval = setInterval(() => {
                setDeleteTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isOpen, deleteTimer]);

    if (!isOpen || !user) return null;

    const handleConfirmClick = async () => {
        setIsDeleting(true);
        await onConfirm(user.id);
    };

    const isButtonDisabled = deleteTimer > 0 || confirmationText !== user.username || isDeleting;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-effect">
                <div className="modal-header">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="danger-icon-large" />
                    {/*<h2 className="modal-danger-title">Danger Zone</h2>*/}
                </div>

                <p>You are about to permanently delete the user:</p>
                <h3 className="modal-user-box">{user.username}</h3>

                <p className="modal-instruction">
                    This action is irreversible. To confirm, type the username below:
                </p>

                <input
                    className="modal-input"
                    type="search"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder={user.username}
                    autoFocus
                />

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose} disabled={isDeleting}>
                        Cancel
                    </button>

                    <button
                        className="btn-delete"
                        onClick={handleConfirmClick}
                        disabled={isButtonDisabled}
                        style={{
                            backgroundColor: isButtonDisabled ? 'rgba(231, 76, 60, 0.3)' : '#e74c3c',
                            cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                            opacity: isButtonDisabled ? 0.6 : 1
                        }}
                    >
                        {isDeleting ? "Deleting..." :
                            deleteTimer > 0 ? `Wait ${deleteTimer}s` : "DELETE"}
                    </button>
                </div>
            </div>
        </div>
    );
};