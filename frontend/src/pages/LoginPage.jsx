import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './auth.css';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();
  const auth = getAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const fetchUserProfile = async (userId) => {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userProfile = docSnap.data();
        const fullProfile = {
          userId: userId,
          email: userProfile.email || "",
          college: userProfile.collegeName || "",
          year: userProfile.yearOfStudy || "",
          interest: userProfile.interests || "",
          gender: userProfile.gender || "",
          location: userProfile.location || "",
          preferredLanguage: userProfile.preferredLanguage || ""
        };
        localStorage.setItem("userData", JSON.stringify(fullProfile));
        console.log("✅ User profile loaded and saved:", fullProfile);
      } else {
        console.error("❌ No user profile found in Firestore!");
      }
    } catch (error) {
      console.error("❌ Error fetching user profile:", error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Sign in using Firebase Auth
      const { user } = await signInWithEmailAndPassword(
        auth,
        loginData.email,
        loginData.password
      );

      // 2. Fetch and store user profile
      await fetchUserProfile(user.uid);

      alert("✅ Login successful!");
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Error signing in:', error.message);
      alert('Login failed. Please check your email and password.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-gray-800 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={loginData.email}
          onChange={handleChange}
          required
          className="px-4 py-2 rounded text-black"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={loginData.password}
          onChange={handleChange}
          required
          className="px-4 py-2 rounded text-black"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition duration-200"
        >
          Login
        </button>
      </form>

      <div className="mt-6">
        <Link to="/register">
          <button className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition duration-200">
            New User? Register
          </button>
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
