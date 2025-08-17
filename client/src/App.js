import './App.css';
//pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home.js';
import Dashboard from './pages/Dashboard.js';
import About from './pages/About.js';
import RecipeID from './pages/RecipeID.js';
import RecipeList from './pages/RecipeList.js';
//components
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />  
        <Route path="/home" element={<PrivateRoute> <Home /> </PrivateRoute>}/> {/* Change private route during final deployment */}
        <Route path="/dashboard" element={<PrivateRoute> <Dashboard /> </PrivateRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/recipe" element={ <RecipeList /> } />
        <Route path="/recipe/:id" element={<RecipeID />} /> {/*Remove during deployment */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
