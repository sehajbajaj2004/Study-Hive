import React from "react";
import { styles } from "../style";
import { ModelCanvas } from "./canvas";
import { Link } from "react-router-dom";

import herobg from "../assets/bg-stars.jpg";

const Hero = () => {
  const username = "User";

  return (
    <section
      className="relative w-full h-screen bg-cover bg-center flex justify-center items-center"
      style={{ backgroundImage: `url(${herobg})` }}
    >
      {/* Content Wrapper */}
      <div
        className={`${styles.paddingX} flex flex-col lg:flex-row justify-center items-center gap-10 max-w-7xl w-full px-10 lg:px-20`}
      >
        {/* 3D Model Section */}
        <div className="h-[500px] w-[800px] cursor-grab flex justify-center">
          <ModelCanvas />
        </div>

        {/* Text & Button Section */}
        <div className="text-center lg:text-left">
          <h1 className="font-black text-white text-[60px] leading-tight">
            Welcome to <br /> 
            <span className="text-[#ffde20]">Study Hive</span>
          </h1>

          {/* Show "Get Started" button only if the user is not logged in */}
          {username === "User" && (
            <div className="mt-6 flex justify-center lg:justify-start">
              <Link to="/dashboard">
                <button className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-yellow-500 transition duration-200">
                  Get Started
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
