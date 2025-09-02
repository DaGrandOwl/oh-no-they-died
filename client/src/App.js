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
          <Route path='/home' element={<StartPage />} />
          <Route path="/about" element={<About />} />

          {/* Only for users not logged in*/}
          <Route path="/login" element={<UnauthenticatedRoute><Login /></UnauthenticatedRoute>} />
          <Route path="/register" element={<UnauthenticatedRoute><Register /></UnauthenticatedRoute>} />

          {/* Logged in users only */}
          <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          {/*Layout Sidebar */}
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