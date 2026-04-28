import { auth } from './firebase';
import { signInWithEmailAndPassword } from "firebase/auth";


const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Page reload hone se rokta hai

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = "Logging in...";
        }

        try {
            // ✅ Firebase Login Function
            await signInWithEmailAndPassword(auth, email, password);

            console.log("✅ Login Successful! Redirecting...");
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error("🔥 Firebase Error:", error.code, error.message);

            let errorMessage = "Login nahi ho saka. Dobara try karein.";

          
            switch (error.code) {
                case 'auth/invalid-credential':
                case 'auth/wrong-password':
                case 'auth/user-not-found':
                    errorMessage = "Email ya Password ghalat hai!";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Email ka format sahi nahi hai.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Bohat zyada koshishen! Thori der baad try karein.";
                    break;
                default:
                    errorMessage = `Error: ${error.message}`;
            }

            alert("❌ " + errorMessage);
        } finally {
         
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = "Sign In";
            }
        }
    });
} else {
    console.error("❌ Login Form nahi mila! HTML me <form id='login-form'> check karein.");
}