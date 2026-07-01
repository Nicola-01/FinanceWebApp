import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserAuth } from "../../utils/authHelper";

import BackgroundBlobs from "../LandingPage/BackgroundBlobs";
import Navbar from "../LandingPage/Navbar";
import Footer from "../LandingPage/Footer";
import ToDoList from "./ToDoList";

const ToDoPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = getUserAuth();
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="bg-app-bg min-h-screen theme-text-default font-sans overflow-x-hidden selection:bg-app-green/30">
      <BackgroundBlobs />

      <Navbar
        isLoggedIn={isLoggedIn}
        onDashboardClick={() => navigate("/dashboard")}
        onLoginClick={() => navigate("/login")}
      />

      <div className="relative pt-32 pb-10 px-4 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-6xl">
          Roadmap & <br />
          <span className="theme-text-transparent bg-clip-text bg-gradient-to-r theme-gradient-primary-from theme-gradient-overlay-via theme-gradient-brand-to">
            Future Improvements
          </span>
        </h1>
        <p className="text-lg md:text-xl theme-text-muted max-w-6xl leading-relaxed mb-8">
          Here's a look at what I've shipped, what I'm working on, and where I'm
          going.
        </p>
      </div>

      <div className="relative z-10 px-4">
        <ToDoList />
      </div>

      <Footer />
    </div>
  );
};

export default ToDoPage;
