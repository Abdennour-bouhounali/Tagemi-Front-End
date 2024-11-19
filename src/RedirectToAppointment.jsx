import React from 'react';
import { Navigate } from 'react-router-dom';

const RedirectToAppointment = ({ children }) => {
  const redirectPaths = [
    "/",
    "/about",
    "/contact",
    "/volunteer",
    "/activities/activity1",
    "/activities/showByActivitiesType/:TypeId",
    // "/login",
    // "/register",
    "/actvities/:Actvityid",
    "/futureProjects",
    "/future-prjects/:Projectid"
  ];

  // Check if the current path is in the list of paths
  if (redirectPaths.includes(window.location.pathname)) {
    return <Navigate to="/appointment" />;
  }

  return children;
};

export default RedirectToAppointment;
