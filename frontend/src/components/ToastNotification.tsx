import React, { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import {createPortal} from "react-dom";

interface ToastData {
    message: string;
    success: boolean;
}

let toastEvent: ((data: ToastData) => void) | null = null;
const TIMEOUT_DURATION = 3000;

export const triggerToast = (message: string, success: boolean) => {
    toastEvent?.({ message, success });
};

export const ToastNotification: React.FC = () => {
    const [show, setShow] = useState(false);
    const [data, setData] = useState<ToastData>({ message: '', success: true });

    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        const handleTrigger = (newData: ToastData) => {
            setData(newData);
            setShow(true);

            if (timerRef.current)
                clearTimeout(timerRef.current);

            timerRef.current = setTimeout(() => {
                setShow(false);
            }, TIMEOUT_DURATION);
        };

        toastEvent = handleTrigger;

        return () => {
            toastEvent = null;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return createPortal(
        <div
            className={`
                fixed top-5 left-1/2 z-[9999]
                flex items-center gap-3 px-6 py-3
                min-w-[300px] w-fit max-w-[90vw]
                rounded-xl border backdrop-blur-md
                font-semibold tracking-wide shadow-2xl
                transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
                
                ${
                show
                    ? 'opacity-100 -translate-x-1/2 translate-y-0 visible pointer-events-auto'
                    : 'opacity-0 -translate-x-1/2 translate-y-5 invisible pointer-events-none'
            }

                ${/* Logica Colori Successo / Errore */
                data.success
                    ? 'bg-green-500/15 border-green-500/40 text-green-400 shadow-[0_0_15px_rgba(0,255,127,0.2)]'
                    : 'bg-red-500/15 border-red-500/40 text-red-500 shadow-[0_0_15px_rgba(255,77,77,0.2)]'
            }
            `}
        >
            {/* Icona con ombra colorata specifica */}
            <div className={`text-lg drop-shadow-[0_0_5px_rgba(currentColor,0.6)]`}>
                <FontAwesomeIcon icon={data.success ? faCheck : faXmark} />
            </div>

            <span>{data.message}</span>
        </div>,
        document.getElementById('toast-root')!
    );
};