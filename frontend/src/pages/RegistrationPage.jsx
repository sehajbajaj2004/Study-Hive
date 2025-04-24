import React, { useState } from 'react';
import './auth.css';
import { db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import bcrypt from 'bcryptjs';

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

  const auth = getAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    console.log('Form data:', formData);
    try {
      // Hash the password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(formData.password, salt);

      // Store user data in Firestore
      await addDoc(collection(db, 'users'), {
        email: formData.email,
        password: hashedPassword,
        collegeName: formData.collegeName,
        yearOfStudy: formData.yearOfStudy,
        interests: formData.interests,
        gender: formData.gender,
        location: formData.location,
        preferredLanguage: formData.preferredLanguage
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
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
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
