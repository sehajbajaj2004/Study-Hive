import React from "react";
import { styles } from "../style";
import AnimatedCanvas from "./AnimatedCanvas"; // ✅ Import the new AnimatedCanvas
import { Link } from "react-router-dom";
import herobg from "../assets/stars-bg2.jpg";

const Hero = () => {
  const username = "User";

  return (
    <section
      className="relative w-full h-screen bg-cover bg-center flex justify-center items-center"
      style={{ backgroundImage: `url(${herobg})` }}
    >
      {/* Content Wrapper */}
      <div
        className={`${styles.paddingX} flex flex-col justify-center items-center gap-10 max-w-7xl w-full px-10 lg:px-20`}
      >
        {/* 3D Model Section */}
        <div className="h-[500px] w-[700px] cursor-grab flex justify-center">
          <AnimatedCanvas />  {/* ✅ Uses the animated book model */}
        </div>

        {/* Text & Button Section */}
        <div className="text-center">
          <h1 className="font-black text-white text-[60px] leading-tight">
            Welcome to 
            <span className="text-[#ffde20]"> Study Hive</span>
          </h1>

          {username === "User" && (
            <div className="mt-10">
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