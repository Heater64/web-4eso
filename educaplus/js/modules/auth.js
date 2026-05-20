/* ============================================
   EDUCA+ - Authentication Module
   Login, Register & Session Management
   ============================================ */

// State Management
const AuthState = {
    user: null,
    profile: null,
    loading: true,
    initialized: false
};

// DOM Elements
const AuthElements = {};

// Initialize authentication module
async function initAuth() {
    AuthElements.loginForm = document.getElementById('login-form');
    AuthElements.loginEmail = document.getElementById('login-email');
    AuthElements.loginPassword = document.getElementById('login-password');
    AuthElements.loginBtn = document.getElementById('login-btn');
    AuthElements.loginError = document.getElementById('login-error');
    
    AuthElements.registerForm = document.getElementById('register-form');
    AuthElements.registerName = document.getElementById('register-name');
    AuthElements.registerEmail = document.getElementById('register-email');
    AuthElements.registerPassword = document.getElementById('register-password');
    AuthElements.registerConfirmPassword = document.getElementById('register-confirm-password');
    AuthElements.registerBtn = document.getElementById('register-btn');
    AuthElements.registerError = document.getElementById('register-error');
    
    AuthElements.authContainer = document.getElementById('auth-container');
    AuthElements.toggleAuthLink = document.getElementById('toggle-auth');
    AuthElements.successMessage = document.getElementById('auth-success');
    
    await window.EducaSupabase.init();
    await checkSession();
    setupAuthEventListeners();
    
    AuthState.initialized = true;
}

// Check for existing session
async function checkSession() {
    try {
        const client = window.EducaSupabase.getClient();
        const { data: { session } } = await client.auth.getSession();
        
        if (session) {
            AuthState.user = session.user;
            AuthState.profile = await window.EducaSupabase.Profiles.getCurrentProfile();
            
            if (window.location.pathname.includes('login.html') || 
                window.location.pathname === '/' || 
                window.location.pathname.includes('index.html')) {
                redirectToDashboard();
            }
        }
    } catch (error) {
        console.error('Session check failed:', error);
    } finally {
        AuthState.loading = false;
    }
}

// Setup event listeners
function setupAuthEventListeners() {
    if (AuthElements.loginForm) {
        AuthElements.loginForm.addEventListener('submit', handleLogin);
    }
    
    if (AuthElements.registerForm) {
        AuthElements.registerForm.addEventListener('submit', handleRegister);
    }
    
    if (AuthElements.toggleAuthLink) {
        AuthElements.toggleAuthLink.addEventListener('click', toggleAuthMode);
    }
    
    document.querySelectorAll('.auth-password-toggle').forEach(toggle => {
        toggle.addEventListener('click', handlePasswordToggle);
    });
    
    const forgotLink = document.getElementById('forgot-password-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', showForgotPasswordModal);
    }
    
    const client = window.EducaSupabase.getClient();
    client.auth.onAuthStateChange(handleAuthStateChange);
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = AuthElements.loginEmail.value.trim();
    const password = AuthElements.loginPassword.value;
    
    clearError('login');
    
    if (!email || !password) {
        showError('login', 'Por favor, completa todos los campos');
        return;
    }
    
    setButtonLoading(AuthElements.loginBtn, true);
    
    try {
        const client = window.EducaSupabase.getClient();
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        AuthState.user = data.user;
        AuthState.profile = await window.EducaSupabase.Profiles.getCurrentProfile();
        
        showSuccess('Inicio de sesión exitoso');
        setTimeout(redirectToDashboard, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        handleAuthError('login', error);
    } finally {
        setButtonLoading(AuthElements.loginBtn, false);
    }
}

// Handle register
async function handleRegister(event) {
    event.preventDefault();
    
    const name = AuthElements.registerName.value.trim();
    const email = AuthElements.registerEmail.value.trim();
    const password = AuthElements.registerPassword.value;
    const confirmPassword = AuthElements.registerConfirmPassword.value;
    
    clearError('register');
    
    if (!name || !email || !password || !confirmPassword) {
        showError('register', 'Por favor, completa todos los campos');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('register', 'Las contraseñas no coinciden');
        return;
    }
    
    if (password.length < 6) {
        showError('register', 'La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    setButtonLoading(AuthElements.registerBtn, true);
    
    try {
        const client = window.EducaSupabase.getClient();
        
        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
                data: { name: name }
            }
        });
        
        if (error) throw error;
        
        await window.EducaSupabase.Profiles.upsertProfile({
            id: data.user.id,
            email: email,
            name: name,
            role: 'user'
        });
        
        showSuccess('¡Cuenta creada exitosamente! Redirigiendo...');
        
        AuthState.user = data.user;
        AuthState.profile = await window.EducaSupabase.Profiles.getCurrentProfile();
        
        setTimeout(redirectToDashboard, 1500);
        
    } catch (error) {
        console.error('Registration error:', error);
        handleAuthError('register', error);
    } finally {
        setButtonLoading(AuthElements.registerBtn, false);
    }
}

// Show forgot password modal
function showForgotPasswordModal(event) {
    event.preventDefault();
    
    const modal = document.getElementById('forgot-password-modal');
    const overlay = document.getElementById('forgot-modal-overlay');
    const closeBtn = document.getElementById('close-forgot-modal');
    const cancelBtn = document.getElementById('cancel-reset');
    const sendBtn = document.getElementById('send-reset-link');
    const resetEmail = document.getElementById('reset-email');
    const resetError = document.getElementById('reset-error');
    const resetSuccess = document.getElementById('reset-success');
    
    if (modal) modal.style.display = 'block';
    
    const closeModal = () => {
        if (modal) modal.style.display = 'none';
        if (resetEmail) resetEmail.value = '';
        if (resetError) resetError.style.display = 'none';
        if (resetSuccess) resetSuccess.style.display = 'none';
    };
    
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (overlay) overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
    };
    
    if (sendBtn) {
        sendBtn.onclick = async () => {
            const email = resetEmail?.value.trim();
            if (!email) {
                if (resetError) {
                    resetError.textContent = 'Por favor, ingresa tu email';
                    resetError.style.display = 'flex';
                }
                return;
            }
            
            sendBtn.disabled = true;
            sendBtn.textContent = 'Enviando...';
            
            try {
                const client = window.EducaSupabase.getClient();
                const { error } = await client.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password.html`
                });
                
                if (error) throw error;
                
                if (resetError) resetError.style.display = 'none';
                if (resetSuccess) resetSuccess.style.display = 'flex';
                
                setTimeout(closeModal, 3000);
            } catch (error) {
                if (resetError) {
                    resetError.textContent = error.message || 'Error al enviar el email';
                    resetError.style.display = 'flex';
                }
            } finally {
                sendBtn.disabled = false;
                sendBtn.textContent = 'Enviar enlace';
            }
        };
    }
}

// Handle password visibility toggle
function handlePasswordToggle(event) {
    const button = event.currentTarget;
    const input = button.parentElement.querySelector('input');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    } else {
        input.type = 'password';
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }
}

// Handle auth state changes
function handleAuthStateChange(event, session) {
    console.log('Auth state changed:', event);
    
    if (event === 'SIGNED_IN' && session) {
        AuthState.user = session.user;
        window.EducaSupabase.Profiles.getCurrentProfile().then(profile => {
            AuthState.profile = profile;
        });
    } else if (event === 'SIGNED_OUT') {
        AuthState.user = null;
        AuthState.profile = null;
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        redirectToLogin();
    }
}

// Toggle between login and register
function toggleAuthMode() {
    const loginForm = document.getElementById('login-form-container');
    const registerForm = document.getElementById('register-form-container');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-auth');
    
    if (loginForm && registerForm) {
        if (loginForm.style.display === 'none') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            if (title) title.textContent = 'Bienvenido de nuevo';
            if (subtitle) subtitle.textContent = 'Inicia sesión para continuar';
            if (toggleText) toggleText.textContent = '¿No tienes cuenta?';
            if (toggleLink) toggleLink.textContent = 'Regístrate aquí';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            if (title) title.textContent = 'Crear cuenta';
            if (subtitle) subtitle.textContent = 'Únete a Educa+ hoy';
            if (toggleText) toggleText.textContent = '¿Ya tienes cuenta?';
            if (toggleLink) toggleLink.textContent = 'Inicia sesión';
        }
    }
    
    clearError('login');
    clearError('register');
}

// Show error message
function showError(type, message) {
    const errorElement = type === 'login' ? AuthElements.loginError : AuthElements.registerError;
    
    if (errorElement) {
        errorElement.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            ${window.Utils?.escapeHtml(message) || message}
        `;
        errorElement.style.display = 'flex';
    }
}

function clearError(type) {
    const errorElement = type === 'login' ? AuthElements.loginError : AuthElements.registerError;
    if (errorElement) {
        errorElement.style.display = 'none';
        errorElement.innerHTML = '';
    }
}

function handleAuthError(type, error) {
    let message = 'Ha ocurrido un error';
    
    switch (error.message) {
        case 'Invalid login credentials':
            message = 'Credenciales incorrectas';
            break;
        case 'Email not confirmed':
            message = 'Por favor, confirma tu email primero';
            break;
        case 'User already registered':
            message = 'Este email ya está registrado';
            break;
        case 'Password should be at least 6 characters':
            message = 'La contraseña debe tener al menos 6 caracteres';
            break;
        default:
            message = error.message || 'Ha ocurrido un error inesperado';
    }
    
    showError(type, message);
}

function showSuccess(message) {
    if (AuthElements.successMessage) {
        AuthElements.successMessage.innerHTML = `
            <div class="auth-success">
                <div class="auth-success-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h3 class="auth-success-title">${window.Utils?.escapeHtml(message) || message}</h3>
                <p class="auth-success-text">Redirigiendo...</p>
            </div>
        `;
        AuthElements.successMessage.style.display = 'flex';
        
        if (AuthElements.loginForm) AuthElements.loginForm.style.display = 'none';
        if (AuthElements.registerForm) AuthElements.registerForm.style.display = 'none';
    }
}

function setButtonLoading(button, loading) {
    if (!button) return;
    
    if (loading) {
        button.disabled = true;
        const originalText = button.textContent;
        button.dataset.originalText = originalText;
        button.innerHTML = `<span class="auth-btn-loading"><span class="auth-btn-spinner"></span>Cargando...</span>`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || 'Continuar';
    }
}

function showNotification(message, type = 'success') {
    if (window.UIModule && window.UIModule.showNotification) {
        window.UIModule.showNotification(message, type);
    } else {
        console.log(`[${type}] ${message}`);
    }
}

function redirectToDashboard() { window.location.href = 'dashboard.html'; }
function redirectToLogin() { window.location.href = 'login.html'; }

async function requireAuth() {
    if (!AuthState.initialized) await initAuth();
    if (!AuthState.user) { redirectToLogin(); return false; }
    return true;
}

async function requireAdmin() {
    const isAuth = await requireAuth();
    if (!isAuth) return false;
    const isAdmin = await window.EducaSupabase.Profiles.isAdmin();
    if (!isAdmin) { showNotification('No tienes permisos de administrador', 'error'); return false; }
    return true;
}

// Export
window.AuthModule = {
    init: initAuth,
    state: AuthState,
    logout: () => window.EducaSupabase.getClient().auth.signOut(),
    requireAuth: requireAuth,
    requireAdmin: requireAdmin,
    showNotification: showNotification,
    getUser: () => AuthState.user,
    getProfile: () => AuthState.profile,
    isAdmin: () => AuthState.profile?.role === 'admin'
};