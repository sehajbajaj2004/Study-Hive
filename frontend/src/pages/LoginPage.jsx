import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './auth.css';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    id: '',
    password: ''
  });

  const navigate = useNavigate();
  const auth = getAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Query Firestore to find the user by email
      const q = query(collection(db, 'users'), where('email', '==', loginData.id));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert('No user found with this email.');
        return;
      }

      // Assume the first document is the correct user
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Verify the password
      const isPasswordValid = bcrypt.compareSync(loginData.password, userData.password);

      if (isPasswordValid) {
        console.log('User signed in:', userData);
        navigate('/dashboard');
      } else {
        alert('Invalid password. Please try again.');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      alert('Login failed. Please check your email and password.');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input type="email" name="id" placeholder="Email" value={loginData.id} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={loginData.password} onChange={handleChange} required />
        <button type="submit">Login</button>
      </form>
      <div className="mt-4">
        <Link to="/register">
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200">
            New User? Register
          </button>
        </Link>
      </div>
    </>
  );
};

export default LoginPage; 
