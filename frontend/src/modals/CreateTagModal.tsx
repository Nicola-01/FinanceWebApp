import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import api from '../api/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTags, faCheck } from '@fortawesome/free-solid-svg-icons';
import { ModalDialog } from './ModalDialog';
import { triggerToast } from '../components/ToastNotification';
import { type IconKey, ICONS } from '../utils/icons.ts';
import { IconColorSelector } from '../components/IconColorSelector';

export interface CreateTagModalHandle {
    openModal: () => void;
}

interface Props {
    walletId: string;
    onSuccess: () => void;
}

export const CreateTagModal = forwardRef<CreateTagModalHandle, Props>(
    ({ walletId, onSuccess }, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);
        const selectorRef = useRef<HTMLDivElement>(null);

        const [name, setName] = useState('');
        const [iconKey, setIconKey] = useState<IconKey>('tag');
        const [colorHex, setColorHex] = useState('#00ff7f');
        const [showSelectors, setShowSelectors] = useState(false);
        const [loading, setLoading] = useState(false);

        useImperativeHandle(ref, () => ({
            openModal: () => {
                setName('');
                setIconKey('tag');
                setColorHex('#00ff7f');
                dialogRef.current?.showModal();
            }
        }));

        useEffect(() => {
            const handleClickOutside = (e: MouseEvent) => {
                if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
                    setShowSelectors(false);
                }
            };
            if (showSelectors) document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [showSelectors]);

        const handleSubmit = async () => {
            if (name.trim().length < 2) return triggerToast("Name must be at least 2 characters", false);

            setLoading(true);
            try {
                const payload = {
                    name: name.trim(),
                    icon: iconKey,
                    colorHex,
                    parentName: null // Crea SOLO padri da questo modale
                };

                await api.post(`/tags/${walletId}`, payload);
                triggerToast("Parent Tag created!", true);
                onSuccess();
                dialogRef.current?.close();
            } catch (err: any) {
                triggerToast(err.response?.data?.title || "Error creating tag", false);
            } finally {
                setLoading(false);
            }
        };

        return (
            <ModalDialog
                ref={dialogRef}
                title={<><FontAwesomeIcon icon={faTags} className="text-[#00ff7f]" /> New Main Category</>}
                subtitle="Organize your transactions better."
                rightActions={[
                    {
                        icon: <FontAwesomeIcon icon={faCheck} className="text-xl" />,
                        onClick: async () => {
                            if (!loading)
                                await handleSubmit();
                        },
                        hoverColor: 'hover:text-[#00ff7f]',
                        disabled: loading
                    }
                ]}
            >
                <div id="create-tag-form" className="space-y-5 text-left">
                    <div className="relative mb-6 flex flex-col items-center">
                        <button
                            type="button"
                            onClick={() => setShowSelectors(!showSelectors)}
                            className="group flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl border border-app-border bg-app-input text-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:bg-app-surface"
                            style={{ color: colorHex }}
                            title="Change Icon or Color"
                        >
                            <FontAwesomeIcon icon={ICONS[iconKey] || ICONS['tag']} />
                        </button>

                        {showSelectors && (
                            <div className="absolute top-20 z-50">
                                <IconColorSelector
                                    ref={selectorRef}
                                    iconValue={iconKey}
                                    onChangeIcon={setIconKey}
                                    colorValue={colorHex}
                                    onChangeColor={setColorHex}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">Category Name *</label>
                        <input
                            className="h-[48px] w-full rounded-xl border border-app-border bg-app-input px-4 text-white outline-none transition-all focus:border-[#00ff7f]"
                            type="text"
                            placeholder="e.g. Shopping"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                </div>
            </ModalDialog>
        );
    }
);