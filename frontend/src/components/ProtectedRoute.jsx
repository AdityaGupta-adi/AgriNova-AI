import { useEffect, useState } from "react";

import {
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "../firebase";

import {
  Navigate,
} from "react-router-dom";


export default function ProtectedRoute({
  children,
}) {

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);


  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          setUser(currentUser);

          setLoading(false);

        }
      );


    return () => {
      unsubscribe();
    };

  }, []);


  /* =========================
     AUTH CHECK LOADING
  ========================= */

  if (loading) {

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          background: "#f1faef",
          fontFamily: "Arial, sans-serif",
        }}
      >

        <div
          style={{
            fontSize: "55px",
            marginBottom: "15px",
          }}
        >
          🌾
        </div>

        <h2
          style={{
            color: "#2e7d32",
            margin: "0",
          }}
        >
          Loading AgriNova AI...
        </h2>

        <p
          style={{
            color: "#666",
            marginTop: "8px",
          }}
        >
          Checking your account
        </p>

      </div>
    );

  }


  /* =========================
     USER NOT LOGGED IN
  ========================= */

  if (!user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  /* =========================
     USER LOGGED IN
  ========================= */

  return children;

}