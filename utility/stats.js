class TokenTracker {
    constructor() {
        this.tokens = new Set();
    }

    // Aggiunge un token al tracker
    addToken(token) {
        this.tokens.add(token);
    }

    // Rimuove un token dal tracker
    removeToken(token) {
        this.tokens.delete(token);
    }

    // Controlla se un token è già stato loggato
    hasToken(token) {
        return this.tokens.has(token);
    }

    // Restituisce tutti i token loggati
    getAllTokens() {
        return Array.from(this.tokens);
    }

    // Resetta il tracker
    clearTokens() {
        this.tokens.clear();
    }
}

module.exports = TokenTracker;