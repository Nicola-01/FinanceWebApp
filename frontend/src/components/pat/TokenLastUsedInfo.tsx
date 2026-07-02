import React from "react";
import type { PatToken } from "../../utils/types";

interface TokenLastUsedInfoProps {
  token: PatToken;
}

export const TokenLastUsedInfo: React.FC<TokenLastUsedInfoProps> = ({
  token,
}) => {
  return (
    <div className="mt-3 flex items-center justify-between pl-[52px]">
      <p className="text-[10px] text-app-muted">
        Created: {new Date(token.createdAt).toLocaleDateString()}
      </p>
      {token.lastUsedAt && (
        <p className="text-[10px] text-app-muted">
          Last used: {new Date(token.lastUsedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};
