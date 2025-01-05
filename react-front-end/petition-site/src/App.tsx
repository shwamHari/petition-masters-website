import React from 'react';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import './App.css';
import Petitions from "./components/Petitions";
import Petition from "./components/Petition";
import NotFound from "./components/NotFound";
import Account from "./components/Account";



function App() {
  return (
      <div className="App">
        <Router>
          <div>
            <Routes>
                <Route path="/account" element={<Account/>} />

                <Route path="/petitions" element={<Petitions/>} />
                <Route path="/petitions/:id" element={<Petition/>} />

                <Route path="*" element={<NotFound/>} />




            </Routes>
          </div>
        </Router>
      </div>
  );
}

export default App;
