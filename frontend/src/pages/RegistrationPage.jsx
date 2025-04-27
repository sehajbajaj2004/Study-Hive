import React, { useState } from 'react';
import './auth.css';
import { db, auth } from '../../firebaseConfig'; // Make sure you import auth
import { collection, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    collegeName: '',
    yearOfStudy: '',
    interests: '',
    gender: '',
    location: '',
    preferredLanguage: ''
  });
  const [showPopup, setShowPopup] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    try {
      // 1. Create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 2. Save extra profile info to Firestore using user.uid
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        collegeName: formData.collegeName,
        yearOfStudy: formData.yearOfStudy,
        interests: formData.interests,
        gender: formData.gender,
        location: formData.location,
        preferredLanguage: formData.preferredLanguage,
        createdAt: new Date()
      });

      setShowPopup(true); // Show popup on successful registration
    } catch (e) {
      console.error('Error registering user: ', e);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
        <input type="text" name="collegeName" placeholder="College Name" value={formData.collegeName} onChange={handleChange} required />
        <select name="yearOfStudy" value={formData.yearOfStudy} onChange={handleChange} required>
          <option value="">Select Year of Study</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
        <input type="text" name="interests" placeholder="Interests" value={formData.interests} onChange={handleChange} required />
        <select name="gender" value={formData.gender} onChange={handleChange} required>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} required />
        <input type="text" name="preferredLanguage" placeholder="Preferred Language" value={formData.preferredLanguage} onChange={handleChange} required />
        <button type="submit">Register</button>
      </form>

      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h2>Registration Successful!</h2>
            <button onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default RegistrationPage;
