'use client';
import './style.css';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function signin() {
    setIsLoading(true);
    let username = (document.querySelector('input[type="email"]') as HTMLInputElement).value;
    let password = (document.querySelector('input[type="password"]') as HTMLInputElement).value;

    if (!username.trim() || !password.trim()) {
      alert('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    username = username.trim();
    password = password.trim();

    try {
      const res = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        window.sessionStorage.setItem('token', data.token);
        router.push('/buyers');
      } else {
        alert('Sign-in failed. Please check your credentials.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('An error occurred during sign-in.');
    } finally {
      setIsLoading(false); // Ensure setIsLoading(false) is always called
    }
  }

  function navigateToSignup() {
    router.push('/buyers/new');
  }
  
  return (
    <div className="container">
      <h1>Sign In</h1>
      <input type="email" placeholder="Email" disabled={isLoading} />
      <input type="password" placeholder="Password" disabled={isLoading} />
      <button onClick={signin} disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="spinner"></div>
            Signing In...
          </>
        ) : (
          'Sign In'
        )}
      </button>
      <p className="signup-link">
        Don't have an account?{' '}
        <a href="#" onClick={navigateToSignup}>
          Create here
        </a>
      </p>
    </div>
  );
}
