import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home.js';
import Dashboard from './pages/Dashboard.js';
import About from './pages/About.js';
import RecipeID from './pages/RecipeID.js';
import RecipeList from './pages/RecipeList.js';
import Onboarding from './pages/Onboarding.js';
import Settings from './pages/Settings.js';
import Inventory from './pages/Inventory.js';
// Components
import PrivateRoute from './components/PrivateRoute';
import Recommendations from './pages/Recommendations.js';
import Layout from './components/Layout.js';


function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/settings" element={<Settings />} />   
          <Route path="/inventory" element={<Inventory />} /> 

          <Route path="/test" element={<Recommendations />} /> {/* temp */}
          
          {/* Routes with Layout (Sidebar) */}
          <Route element={<Layout />}> 
            <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/recipe" element={<RecipeList />} />
            <Route path="/recipe/:id" element={<RecipeID />} />
          </Route>
        </Routes>
      </BrowserRouter>
  );
}

export default App;