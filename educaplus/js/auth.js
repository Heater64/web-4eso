/* ============================================
   EDUCA+ - Authentication Module
   Login, Register & Session Management
   ============================================ */

// ============================================
// STATE MANAGEMENT
// ============================================

const AuthState = {
    user: null,
    profile: null,
    loading: true,
    initialized: false
};

// ============================================
// DOM ELEMENTS
// ============================================

const AuthElements = {
    // Login form
    loginForm: null,
    loginEmail: null,
    loginPassword: null,
    loginBtn: null,
    loginError: null,
    
    // Register form
    registerForm: null,
    registerName: null,
    registerEmail: null,
    registerPassword: null,
    registerConfirmPassword: null,
    registerBtn: null,
    registerError: null,
    
    // Common
    authContainer: null,
    toggleAuthLink: null,
    successMessage: null
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize authentication module
 */
async function initAuth() {
    // Get DOM elements
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
    
    // Initialize Supabase
    await SupabaseModule.init();
    
    // Check for existing session
    await checkSession();
    
    // Setup event listeners
    setupAuthEventListeners();
    
    AuthState.initialized = true;
}

/**
 * Check for existing session
 */
async function checkSession() {
    try {
        const client = SupabaseModule.getClient();
        const { data: { session } } = await client.auth.getSession();
        
        if (session) {
            AuthState.user = session.user;
            AuthState.profile = await SupabaseModule.Profiles.getCurrentProfile();
            
            // Redirect to dashboard if on login page
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
        updateAuthUI();
    }
}

/**
 * Setup authentication event listeners
 */
function setupAuthEventListeners() {
    // Login form submission
    if (AuthElements.loginForm) {
        AuthElements.loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form submission
    if (AuthElements.registerForm) {
        AuthElements.registerForm.addEventListener('submit', handleRegister);
    }
    
    // Toggle between login and register
    if (AuthElements.toggleAuthLink) {
        AuthElements.toggleAuthLink.addEventListener('click', toggleAuthMode);
    }
    
    // Password visibility toggles
    document.querySelectorAll('.auth-password-toggle').forEach(toggle => {
        toggle.addEventListener('click', handlePasswordToggle);
    });
    
    // Auth state changes
    const client = SupabaseModule.getClient();
    client.auth.onAuthStateChange(handleAuthStateChange);
}

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Handle login form submission
 * @param {Event} event - Form submit event
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const email = AuthElements.loginEmail.value.trim();
    const password = AuthElements.loginPassword.value;
    
    // Clear previous errors
    clearError('login');
    
    // Validate inputs
    if (!email || !password) {
        showError('login', 'Por favor, completa todos los campos');
        return;
    }
    
    // Show loading state
    setButtonLoading(AuthElements.loginBtn, true);
    
    try {
        const client = SupabaseModule.getClient();
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Get user profile
        AuthState.user = data.user;
        AuthState.profile = await SupabaseModule.Profiles.getCurrentProfile();
        
        // Show success and redirect
        showSuccess('Inicio de sesion exitoso');
        setTimeout(redirectToDashboard, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        handleAuthError('login', error);
    } finally {
        setButtonLoading(AuthElements.loginBtn, false);
    }
}

/**
 * Handle register form submission
 * @param {Event} event - Form submit event
 */
async function handleRegister(event) {
    event.preventDefault();
    
    const name = AuthElements.registerName.value.trim();
    const email = AuthElements.registerEmail.value.trim();
    const password = AuthElements.registerPassword.value;
    const confirmPassword = AuthElements.registerConfirmPassword.value;
    
    // Clear previous errors
    clearError('register');
    
    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
        showError('register', 'Por favor, completa todos los campos');
        return;
    }
    
    // Validate password match
    if (password !== confirmPassword) {
        showError('register', 'Las contrasenas no coinciden');
        return;
    }
    
    // Validate password strength
    if (password.length < 6) {
        showError('register', 'La contrasena debe tener al menos 6 caracteres');
        return;
    }
    
    // Show loading state
    setButtonLoading(AuthElements.registerBtn, true);
    
    try {
        const client = SupabaseModule.getClient();
        
        // Sign up user
        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name
                }
            }
        });
        
        if (error) throw error;
        
        // Create profile
        await SupabaseModule.Profiles.upsertProfile({
            id: data.user.id,
            email: email,
            role: 'user'
        });
        
        // Show success message
        showSuccess('Cuenta creada exitosamente');
        
        // Auto-login after registration
        AuthState.user = data.user;
        AuthState.profile = await SupabaseModule.Profiles.getCurrentProfile();
        
        setTimeout(redirectToDashboard, 1500);
        
    } catch (error) {
        console.error('Registration error:', error);
        handleAuthError('register', error);
    } finally {
        setButtonLoading(AuthElements.registerBtn, false);
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    try {
        const client = SupabaseModule.getClient();
        await client.auth.signOut();
        
        AuthState.user = null;
        AuthState.profile = null;
        
        redirectToLogin();
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error al cerrar sesion', 'error');
    }
}

/**
 * Handle auth state changes
 * @param {string} event - Auth event
 * @param {Object} session - Session object
 */
function handleAuthStateChange(event, session) {
    console.log('Auth state changed:', event);
    
    if (event === 'SIGNED_IN' && session) {
        AuthState.user = session.user;
    } else if (event === 'SIGNED_OUT') {
        AuthState.user = null;
        AuthState.profile = null;
        redirectToLogin();
    }
}

/**
 * Handle password visibility toggle
 * @param {Event} event - Click event
 */
function handlePasswordToggle(event) {
    const button = event.currentTarget;
    const input = button.parentElement.querySelector('input');
    const icon = button.querySelector('svg');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
        `;
    } else {
        input.type = 'password';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
    }
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Toggle between login and register modes
 */
function toggleAuthMode() {
    const loginForm = document.getElementById('login-form-container');
    const registerForm = document.getElementById('register-form-container');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-auth');
    
    if (loginForm.style.display === 'none') {
        // Show login
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        title.textContent = 'Bienvenido de nuevo';
        subtitle.textContent = 'Inicia sesion para continuar';
        toggleText.textContent = 'No tienes cuenta?';
        toggleLink.textContent = 'Registrate aqui';
    } else {
        // Show register
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        title.textContent = 'Crear cuenta';
        subtitle.textContent = 'Unete a Educa+ hoy';
        toggleText.textContent = 'Ya tienes cuenta?';
        toggleLink.textContent = 'Inicia sesion';
    }
    
    // Clear errors
    clearError('login');
    clearError('register');
}

/**
 * Show error message
 * @param {string} type - 'login' or 'register'
 * @param {string} message - Error message
 */
function showError(type, message) {
    const errorElement = type === 'login' 
        ? AuthElements.loginError 
        : AuthElements.registerError;
    
    if (errorElement) {
        errorElement.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            ${message}
        `;
        errorElement.style.display = 'flex';
    }
}

/**
 * Clear error message
 * @param {string} type - 'login' or 'register'
 */
function clearError(type) {
    const errorElement = type === 'login' 
        ? AuthElements.loginError 
        : AuthElements.registerError;
    
    if (errorElement) {
        errorElement.style.display = 'none';
        errorElement.innerHTML = '';
    }
}

/**
 * Handle authentication errors
 * @param {string} type - 'login' or 'register'
 * @param {Object} error - Error object
 */
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
            message = 'Este email ya esta registrado';
            break;
        case 'Password should be at least 6 characters':
            message = 'La contrasena debe tener al menos 6 caracteres';
            break;
        default:
            message = error.message || 'Ha ocurrido un error inesperado';
    }
    
    showError(type, message);
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
    if (AuthElements.successMessage) {
        AuthElements.successMessage.innerHTML = `
            <div class="auth-success">
                <div class="auth-success-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h3 class="auth-success-title">${message}</h3>
                <p class="auth-success-text">Redirigiendo...</p>
            </div>
        `;
        AuthElements.successMessage.style.display = 'flex';
        
        // Hide forms
        if (AuthElements.loginForm) AuthElements.loginForm.style.display = 'none';
        if (AuthElements.registerForm) AuthElements.registerForm.style.display = 'none';
    }
}

/**
 * Set button loading state
 * @param {HTMLElement} button - Button element
 * @param {boolean} loading - Loading state
 */
function setButtonLoading(button, loading) {
    if (!button) return;
    
    if (loading) {
        button.disabled = true;
        button.innerHTML = `
            <span class="auth-btn-loading">
                <span class="auth-btn-spinner"></span>
                Cargando...
            </span>
        `;
    } else {
        button.disabled = false;
        button.textContent = button.dataset.text || 'Continuar';
    }
}

/**
 * Update UI based on auth state
 */
function updateAuthUI() {
    // This function can be used to update UI elements
    // based on the current authentication state
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 */
function showNotification(message, type = 'success') {
    // Create notification container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `toast toast-${type}`;
    notification.innerHTML = `
        <div class="toast-icon">
            ${type === 'success' 
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
            }
        </div>
        <div class="toast-content">
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ============================================
// NAVIGATION
// ============================================

/**
 * Redirect to dashboard
 */
function redirectToDashboard() {
    window.location.href = 'dashboard.html';
}

/**
 * Redirect to login
 */
function redirectToLogin() {
    window.location.href = 'login.html';
}

// ============================================
// GUARDS
// ============================================

/**
 * Require authentication - redirect to login if not authenticated
 */
async function requireAuth() {
    if (!AuthState.initialized) {
        await initAuth();
    }
    
    if (!AuthState.user) {
        redirectToLogin();
        return false;
    }
    
    return true;
}

/**
 * Require admin role - redirect if not admin
 */
async function requireAdmin() {
    const isAuth = await requireAuth();
    if (!isAuth) return false;
    
    const isAdmin = await SupabaseModule.Profiles.isAdmin();
    if (!isAdmin) {
        showNotification('No tienes permisos de administrador', 'error');
        return false;
    }
    
    return true;
}

// ============================================
// EXPORT
// ============================================

window.AuthModule = {
    init: initAuth,
    state: AuthState,
    login: handleLogin,
    logout: handleLogout,
    requireAuth,
    requireAdmin,
    showNotification,
    getUser: () => AuthState.user,
    getProfile: () => AuthState.profile,
    isAdmin: () => AuthState.profile?.role === 'admin'
};
