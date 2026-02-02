package dev.busato.FinanceWebApp.backend.exceptions;

import java.util.UUID;

public class TagNotFoundException extends RuntimeException {

    public TagNotFoundException(String message) {
        super(message);
    }

    public TagNotFoundException(String name, UUID walletID) {
        this("Could not find tag with name '" + name + "' in the wallet : " + walletID);
    }
}
