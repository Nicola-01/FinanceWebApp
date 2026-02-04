import { useState } from 'react';
import api from '.././api/axiosConfig';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita il refresh della pagina
        setError('');

        try {
            // Chiamata al tuo endpoint Spring
            const response = await api.post('/auth/login', {
                username: username,
                password: password
            });

            // Se va bene, prendiamo il token
            const token = response.data.token;

            // Salviamo il token nel LocalStorage (così rimane se ricarichi la pagina)
            localStorage.setItem('jwtToken', token);

            alert("Login effettuato! Token salvato: " + token.substring(0, 10) + "...");
            // Qui in futuro metteremo il redirect alla Dashboard

        } catch (err) {
            console.error(err);
            setError('Credenziali non valide o errore server');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '10px' }}>
                <h2>Accedi</h2>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">Login</button>
            </form>
        </div>
    );
}

export default Login;