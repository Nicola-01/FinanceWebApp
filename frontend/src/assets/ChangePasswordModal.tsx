import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEye, faEyeSlash, faShieldAlt, faCheck, faTimes, faKey } from '@fortawesome/free-solid-svg-icons';
import './ChangePasswordModal.css';

interface Props {
    onSuccess: () => void;
}

const ChangePasswordModal: React.FC<Props> = ({ onSuccess }) => {
    // Added 'old' to state
    const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });

    // Independent states for visibility toggles (Added showOldPw)
    const [showOldPw, setShowOldPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Enhanced Security Requirements
    const requirements = [
        { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
        { label: "One lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
        { label: "One uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
        { label: "At least one number", test: (pw: string) => /[0-9]/.test(pw) },
        { label: "One special symbol (!@#$...)", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
        { label: "Passwords match", test: (pw: string) => pw === passwords.confirm && pw !== '' }
    ];

    // Check if ALL requirements are met AND old password is not empty
    const isRequirementsMet = requirements.every(req => req.test(passwords.new));
    const isValid = isRequirementsMet && passwords.old.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setLoading(true);
        setError('');
        try {
            // Update payload to include oldPassword
            await api.post('/auth/change-password', {
                currentPassword: passwords.old,
                newPassword: passwords.new,
                confirmPassword: passwords.confirm
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Error updating password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="glass-card modal-content">
                <h3><FontAwesomeIcon icon={faShieldAlt} className="accent" /> Account Security</h3>
                <p>Please enter your current password and set a new one.</p>

                <form onSubmit={handleSubmit} noValidate>

                    {/* FIELD 1: CURRENT PASSWORD (NEW) */}
                    <div className="input-block">
                        <label className="field-label">Current Password</label>
                        <div className="password-field-container">
                            <FontAwesomeIcon icon={faKey} className="input-icon" />
                            <input
                                type={showOldPw ? "text" : "password"}
                                placeholder="Enter current password"
                                value={passwords.old}
                                onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                            />
                            <button
                                type="button"
                                className="eye-btn"
                                onClick={() => setShowOldPw(!showOldPw)}
                                tabIndex={-1}
                            >
                                <FontAwesomeIcon icon={showOldPw ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>

                    <hr className="divider" />

                    {/* FIELD 2: NEW PASSWORD */}
                    <div className="input-block">
                        <label className="field-label">New Password</label>
                        <div className="password-field-container">
                            <FontAwesomeIcon icon={faLock} className="input-icon" />
                            <input
                                type={showNewPw ? "text" : "password"}
                                placeholder="Enter new password"
                                value={passwords.new}
                                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                            />
                            <button
                                type="button"
                                className="eye-btn"
                                onClick={() => setShowNewPw(!showNewPw)}
                                tabIndex={-1}
                            >
                                <FontAwesomeIcon icon={showNewPw ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>

                    {/* FIELD 3: CONFIRM PASSWORD */}
                    <div className="input-block">
                        <label className="field-label">Confirm New Password</label>
                        <div className="password-field-container">
                            <FontAwesomeIcon icon={faLock} className="input-icon" />
                            <input
                                type={showConfirmPw ? "text" : "password"}
                                placeholder="Confirm new password"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                            />
                            <button
                                type="button"
                                className="eye-btn"
                                onClick={() => setShowConfirmPw(!showConfirmPw)}
                                tabIndex={-1}
                            >
                                <FontAwesomeIcon icon={showConfirmPw ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>

                    {/* Dynamic Requirements List */}
                    <div className="requirements-list">
                        {requirements.map((req, index) => (
                            <div key={index} className={`requirement ${req.test(passwords.new) ? 'met' : 'unmet'}`}>
                                <FontAwesomeIcon icon={req.test(passwords.new) ? faCheck : faTimes} />
                                <span>{req.label}</span>
                            </div>
                        ))}
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <button
                        type="submit"
                        className="add-btn"
                        disabled={!isValid || loading}
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;