/* variables */
const loginForm = document.getElementById("login-form")
const username = document.getElementById("username");
const password = document.getElementById("password");
const formTitle = document.getElementById("form-title")
const submit = document.getElementById("submit-btn")
const createAcc = document.getElementById("show-create")
const savedUsers = localStorage.getItem("users");

/* Arrays */
let users = [];

if (savedUsers) { users = JSON.parse(savedUsers); }

let mode = localStorage.getItem("username") ? "login" : "create";

/* functions */

function updateUI() {
    if (mode === "login") {
        formTitle.textContent = "Sign in"
        submit.textContent = "Login"
        createAcc.textContent = "Create account"
    } else {
        formTitle.textContent = "Create Account";
        submit.textContent = "Create Account";
        createAcc.textContent = "Back to login";
    }
}

function toggleMode(event) {
    event.preventDefault()
    if (mode === "login") {
        mode = "create";
    } else {
        mode = "login"
    }
    updateUI();
}

function login(event) {
    event.preventDefault()
    if (mode === "login") {
        const foundUser = users.find(user => user.username === username.value);
        if (foundUser && foundUser.password === password.value) {
            localStorage.setItem("username", username.value)
            window.location.href = "index.html"
            console.log("Username:", username.value)
            console.log("Password:", password.value)
        }
        else { alert("❌Invalid username or password❌") }
    } else {
        const userExists = users.find(user => user.username === username.value);
        if (userExists) { alert("User already exists!") }
        else {
            const user = { username: username.value, password: password.value };
            users.push(user);
            localStorage.setItem("users", JSON.stringify(users));
            localStorage.setItem("username", username.value);
            window.location.href = "index.html";
        }
    }
}

/* Function calling */

createAcc.addEventListener("click", toggleMode)
loginForm.addEventListener("submit", login);

