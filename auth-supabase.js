// Funções de autenticação com Supabase

// Funções utilitárias
function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    const successDiv = document.getElementById("successMessage");
    
    if (successDiv) successDiv.style.display = "none";
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
        
        // Auto-hide após 5 segundos
        setTimeout(() => {
            errorDiv.style.display = "none";
        }, 5000);
    }
}

function showSuccess(message) {
    const errorDiv = document.getElementById("errorMessage");
    const successDiv = document.getElementById("successMessage");
    
    if (errorDiv) errorDiv.style.display = "none";
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = "block";
        
        // Auto-hide após 3 segundos
        setTimeout(() => {
            successDiv.style.display = "none";
        }, 3000);
    }
}

function setLoading(isLoading) {
    const form = document.querySelector(".auth-form");
    const buttons = document.querySelectorAll("button[type=\"submit\"], .auth-button");
    
    buttons.forEach(button => {
        if (isLoading) {
            button.disabled = true;
            button.style.opacity = "0.6";
            if (button.textContent.includes("Cadastrar")) {
                button.textContent = "Cadastrando...";
            } else if (button.textContent.includes("Entrar")) {
                button.textContent = "Entrando...";
            } else if (button.textContent.includes("Sign in with Google")) {
                button.textContent = "Entrando com Google...";
            }
        } else {
            button.disabled = false;
            button.style.opacity = "1";
            if (button.textContent.includes("Cadastrando")) {
                button.textContent = "Cadastrar";
            } else if (button.textContent.includes("Entrando")) {
                button.textContent = "Entrar";
            } else if (button.textContent.includes("Entrando com Google")) {
                button.textContent = "Sign in with Google";
            }
        }
    });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function formatPhone(phone) {
    // Remove tudo que não é número
    const numbers = phone.replace(/\D/g, "");
    
    // Aplica a máscara (xx) xxxxx-xxxx
    if (numbers.length <= 11) {
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return phone;
}

// Event listeners para formulários
document.addEventListener("DOMContentLoaded", function() {
    // Verificar se usuário já está logado
    checkAuthStatus();

    // Formulário de login
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    // Formulário de cadastro
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
        
        // Máscara para telefone
        const phoneInput = document.getElementById("phone");
        if (phoneInput) {
            phoneInput.addEventListener("input", function(e) {
                e.target.value = formatPhone(e.target.value);
            });
        }
        
        // Validação de confirmação de senha
        const passwordInput = document.getElementById("password");
        const confirmPasswordInput = document.getElementById("confirmPassword");
        
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener("blur", function() {
                if (passwordInput.value && confirmPasswordInput.value) {
                    if (passwordInput.value !== confirmPasswordInput.value) {
                        showError("As senhas não conferem");
                        confirmPasswordInput.focus();
                    }
                }
            });
        }
    }

    // Botões do Google
    const googleButtons = document.querySelectorAll("[data-action=\"google-login\"]");
    googleButtons.forEach(button => {
        button.addEventListener("click", handleGoogleLogin);
    });
});

// Verificar status de autenticação
async function checkAuthStatus() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (user) {
            // Usuário logado
            if (window.location.pathname.includes("/login.html") || window.location.pathname.includes("/register.html")) {
                window.location.href = "./index.html";
            } else {
                // Atualizar interface do usuário
                updateUserInterface(user);
            }
        } else {
            // Usuário não logado
            if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
                window.location.href = "./login.html";
            }
        }
    } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
            window.location.href = "./login.html";
        }
    }
}

// Atualizar interface do usuário
function updateUserInterface(user) {
    const userNameElement = document.getElementById("userName");
    if (userNameElement) {
        const displayName = user.user_metadata?.name || user.email.split("@")[0];
        userNameElement.textContent = `Olá, ${displayName}`;
    }
}

// Handler para login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    
    // Validações
    if (!email || !password) {
        showError("Por favor, preencha todos os campos");
        return;
    }
    
    if (!validateEmail(email)) {
        showError("Por favor, insira um e-mail válido");
        return;
    }
    
    setLoading(true);
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        showSuccess("Login realizado com sucesso!");
        
        setTimeout(() => {
            window.location.href = "./index.html";
        }, 1000);
        
    } catch (error) {
        console.error("Erro no login:", error);
        
        let errorMessage = "Erro no login. Tente novamente.";
        if (error.message.includes("Invalid login credentials")) {
            errorMessage = "E-mail ou senha incorretos";
        } else if (error.message.includes("Email not confirmed")) {
            errorMessage = "Por favor, confirme seu e-mail antes de fazer login";
        }
        
        showError(errorMessage);
    } finally {
        setLoading(false);
    }
}

// Handler para cadastro
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const phone = document.getElementById("phone").value.trim();
    const howFoundUs = document.getElementById("howFoundUs").value;
    
    // Validações
    if (!name || !email || !password || !confirmPassword) {
        showError("Por favor, preencha todos os campos obrigatórios");
        return;
    }
    
    if (!validateEmail(email)) {
        showError("Por favor, insira um e-mail válido");
        return;
    }
    
    if (!validatePassword(password)) {
        showError("A senha deve ter pelo menos 6 caracteres");
        return;
    }
    
    if (password !== confirmPassword) {
        showError("As senhas não conferem");
        return;
    }
    
    setLoading(true);
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    phone: phone,
                    how_found_us: howFoundUs
                },
                emailRedirectTo: "./"
            }
        });
        
        if (error) {
            throw error;
        }
        
        if (data.user && !data.user.email_confirmed_at) {
            showSuccess("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
            
            setTimeout(() => {
                window.location.href = "./login.html";
            }, 3000);
        } else {
            showSuccess("Cadastro realizado com sucesso!");
            
            setTimeout(() => {
                window.location.href = "./index.html";
            }, 1000);
        }
        
    } catch (error) {
        console.error("Erro no cadastro:", error);
        
        let errorMessage = "Erro no cadastro. Tente novamente.";
        if (error.message.includes("User already registered")) {
            errorMessage = "Este e-mail já está cadastrado";
        } else if (error.message.includes("Password should be at least")) {
            errorMessage = "A senha deve ter pelo menos 6 caracteres";
        }
        
        showError(errorMessage);
    } finally {
        setLoading(false);
    }
}

// Handler para login com Google
async function handleGoogleLogin() {
    setLoading(true);
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: "./"
            }
        });
        
        if (error) {
            throw error;
        }
        
        // O redirecionamento será automático
        
    } catch (error) {
        console.error("Erro no login com Google:", error);
        showError("Erro ao fazer login com Google. Tente novamente.");
        setLoading(false);
    }
}

// Função para logout
async function logout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        window.location.href = "./login.html";
        
    } catch (error) {
        console.error("Erro no logout:", error);
        // Mesmo com erro, redirecionar para login
        window.location.href = "./login.html";
    }
}

// Função para verificar autenticação (para usar na calculadora)
function checkAuth() {
    return new Promise(async (resolve) => {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            if (user) {
                updateUserInterface(user);
                resolve(true);
            } else {
                window.location.href = "./login.html";
                resolve(false);
            }
        } catch (error) {
            console.error("Erro ao verificar autenticação:", error);
            window.location.href = "./login.html";
            resolve(false);
        }
    });
}

// Listener para mudanças de autenticação
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN") {
        console.log("Usuário logado:", session.user);
        updateUserInterface(session.user);
    } else if (event === "SIGNED_OUT") {
        console.log("Usuário deslogado");
        if (window.location.pathname !== "/login.html" && window.location.pathname !== "/register.html") {
            window.location.href = "./login.html";
        }
    }
});
