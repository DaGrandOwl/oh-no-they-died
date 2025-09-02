import { BrowserRouter, Routes, Route } from 'react-router-dom';
// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding.js';
import StartPage from './pages/StartPage.js';
import About from './pages/About.js';
import Dashboard from './pages/Dashboard.js';
import RecipeID from './pages/RecipeID.js';
import RecipeList from './pages/RecipeList.js';
import Inventory from './pages/Inventory.js';
import Settings from './pages/Settings.js';
// Components
import PrivateRoute from './components/PrivateRoute';
import UnauthenticatedRoute from './components/UnauthenticatedRoute.js';
import Layout from './components/Layout.js';

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/about" element={<About />} />

          {/* Only for users not logged in*/}
          <Route element={<UnauthenticatedRoute />} >
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          {/* Logged in users only */}
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}> 
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} /> 
            <Route path="/recipe" element={<RecipeList />} />
            <Route path="/recipe/:id" element={<RecipeID />} />
            <Route path="/settings" element={<Settings />} />   
          </Route>
        </Routes>
      </BrowserRouter>
  );
}

export default App;