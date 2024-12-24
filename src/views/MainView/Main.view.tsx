import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GpsReportView from "../GpsReportView/GpsReport.view";
import MonthlyReportView from "../MonthlyReportView/MonthlyReport.view";
import CallSystemReportView from "../CallSystemReport/CallSystemReport.view";
import NotFountView from "../NotFoundView/NotFound.view";

function MainView() {
  return (
    <div className="main-style">
      <Routes>
        <Route path="/" element={<GpsReportView />} />
        <Route path="/gps-report" element={<GpsReportView />} />
        <Route path="/monthly-report" element={<MonthlyReportView />} />
        <Route path="/call-system-report" element={<CallSystemReportView />} />
        <Route path="*" element={<NotFountView />} />
      </Routes>
    </div>
  );
}

export default MainView;
