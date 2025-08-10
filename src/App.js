import React from 'react';
import Editor from './Components/Editor';
import About from './Components/About'
import MobileRedirect from './Components/MobileRedirect'
import Home from './Components/Home';
import { isMobile } from 'react-device-detect';
import {
  BrowserRouter as Router,
  Navigate,
  Routes,
  Route,
} from "react-router-dom";

import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme.js';
import './App.css'
 

function App() {
  if(isMobile) {
    return (
      <ChakraProvider theme={theme}>
          <Router>
            <Routes>
              <Route path="/mobile" element={<MobileRedirect/>}/>
              <Route path="/about" element={<About/>}/>
              <Route path="*" element={<Navigate to="/mobile"/>}/>
            </Routes>
          </Router>
      </ChakraProvider>
    )
  }

  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/about" element={<About/>}/>
          <Route path="/editor" element={<Editor/>}/>
          <Route path="*" element={<Navigate to="/"/>}/>
        </Routes>
      </Router>
    </ChakraProvider>
  )
}

export default App;
