import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home.js';
import About from './pages/About.js';
import TestTable from './pages/TestTable.js'; // Remove this import during deployment
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />  
        <Route path="/home" element={<PrivateRoute> <Home /> </PrivateRoute>}/>
        <Route path="/about" element={<About />} />
        <Route path="/test" element={<TestTable />} />  {/*Remove during deployment */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
