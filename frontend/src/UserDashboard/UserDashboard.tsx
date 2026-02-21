import {AccountSettings} from "../components/AccountSettings.tsx";
import {WalletsArea} from "./WalletsArea.tsx";
import React from "react";
import type {DeleteModalHandle} from "../modals/DeleteConfirmationModal.tsx";
import {WalletDashboard} from "./WalletDashboard.tsx";

interface UserDashboardProps {
    deleteModalRef: React.RefObject<DeleteModalHandle | null>;
}

interface UserDashboardProps {
    deleteModalRef: React.RefObject<DeleteModalHandle | null>;
}

const UserDashboard: React.FC<UserDashboardProps> = ({deleteModalRef}) => {
    return (
        <div className="flex flex-col xl:flex-row min-h-screen bg-gray-900 text-white overflow-hidden">
            <AccountSettings/>
            <WalletsArea deleteModalRef={deleteModalRef}/>

            <div className="flex-1 overflow-y-auto h-screen bg-[#0d0d12]"> {/* Sfondo leggermente differenziato per staccarlo dalla sidebar */}
                <WalletDashboard />
            </div>

        </div>
    );
}

export default UserDashboard;